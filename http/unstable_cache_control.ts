// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Parsing and formatting of the `Cache-Control` HTTP header per
 * {@link https://www.rfc-editor.org/rfc/rfc9111#section-5.2 | RFC 9111 Section 5.2}.
 *
 * Provides {@linkcode parseCacheControl} to parse a header value into a typed
 * object and {@linkcode formatCacheControl} to serialize back to a header string.
 *
 * @example Response with Cache-Control and ETag
 * ```ts ignore
 * import { formatCacheControl } from "@std/http/unstable-cache-control";
 * import { eTag } from "@std/http/etag";
 *
 * Deno.serve(async (_req) => {
 *   const body = "hello";
 *   const etag = await eTag(body);
 *   const headers = new Headers();
 *   if (etag) headers.set("etag", etag);
 *   headers.set("cache-control", formatCacheControl({
 *     maxAge: 3600,
 *     private: true,
 *     mustRevalidate: true,
 *   }));
 *   return new Response(body, { headers });
 * });
 * ```
 *
 * @example Parse request Cache-Control
 * ```ts ignore
 * import { parseCacheControl } from "@std/http/unstable-cache-control";
 *
 * Deno.serve((req) => {
 *   const cc = parseCacheControl(req.headers.get("cache-control"));
 *   if (cc.noStore) {
 *     return new Response(null, { status: 400 }); // client forbids storing
 *   }
 *   return new Response("OK");
 * });
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9111#section-5.2}
 *
 * @module
 */

/**
 * Shared Cache-Control directives valid in both request and response.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface CacheControlBase {
  /** When present, the cache must not store the request or response. */
  noStore?: true;
  /** When present, the cache must not transform the payload. */
  noTransform?: true;
  /**
   * Maximum age in seconds. In a request: accept responses whose age is no
   * greater than this. In a response: the response is stale after this many seconds.
   */
  maxAge?: number;
}

/**
 * Cache-Control directives for requests (e.g. from a client).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9111#section-5.2.1}
 */
export interface RequestCacheControl extends CacheControlBase {
  /** When present, the cache must not use a stored response without revalidation. */
  noCache?: true;
  /**
   * Accept stale responses. If a number, accept responses that have been stale
   * for no more than this many seconds. If `true`, accept any staleness.
   */
  maxStale?: number | true;
  /** Require the response to be fresh for at least this many seconds. */
  minFresh?: number;
  /** Only return a cached response; do not forward the request to the origin. */
  onlyIfCached?: true;
}

/**
 * Cache-Control directives for responses (e.g. from a server).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9111#section-5.2.2}
 */
export interface ResponseCacheControl extends CacheControlBase {
  /**
   * When `true`, the response must not be used from cache without revalidation.
   * When an array, only the listed response header fields require revalidation;
   * the rest of the response may be used without it.
   */
  noCache?: true | string[];
  /**
   * When `true`, the response is intended for a single user (private cache only).
   * When an array, only the listed header field names are private.
   */
  private?: true | string[];
  /** The response may be stored by any cache. */
  public?: true;
  /** Shared (e.g. CDN) cache maximum age in seconds. Overrides max-age for shared caches. */
  sMaxage?: number;
  /** When stale, the cache must revalidate before using the response. */
  mustRevalidate?: true;
  /** Same as must-revalidate but applies only to shared caches. */
  proxyRevalidate?: true;
  /** The cache must not use the response if it does not understand the directive. */
  mustUnderstand?: true;
  /** The response will not change while fresh; caches may reuse it without revalidation. */
  immutable?: true;
  /** Allow use of stale response while revalidating in the background (seconds). */
  staleWhileRevalidate?: number;
  /** Allow use of stale response if revalidation fails (seconds). */
  staleIfError?: number;
}

/**
 * Parsed Cache-Control value. Union of request and response types when direction
 * is unknown (e.g. after parsing a raw header string).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type CacheControl = RequestCacheControl | ResponseCacheControl;

/** Union of every directive field across both interfaces, using the widest type
 * for fields that appear in both (e.g. `noCache` becomes `true | string[]`).
 * Avoids per-field type assertions during parsing and formatting. */
type AllCacheControlFields = {
  [K in keyof RequestCacheControl | keyof ResponseCacheControl]?: K extends
    keyof RequestCacheControl
    ? K extends keyof ResponseCacheControl
      ? RequestCacheControl[K] | ResponseCacheControl[K]
    : RequestCacheControl[K]
    : K extends keyof ResponseCacheControl ? ResponseCacheControl[K]
    : never;
};

/** Upper bound for delta-seconds per RFC 9111 §1.2.2. Values above this are
 * clamped to this sentinel which represents "infinity" (~68 years). */
const MAX_DELTA_SECONDS = 2_147_483_648; // 2^31

function parseNonNegativeInt(value: string, directive: string): number {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new SyntaxError(
      `Cache-Control: invalid value for ${directive}: "${value}"`,
    );
  }
  const n = Number(trimmed);
  return n > MAX_DELTA_SECONDS ? MAX_DELTA_SECONDS : n;
}

/** Split by comma but not inside double-quoted strings (needed for
 * `no-cache` and `private` whose quoted-string arguments may contain commas). */
function splitDirectives(value: string): string[] {
  // Fast path: no quotes means a simple split is safe.
  if (!value.includes('"')) return value.split(",");

  const parts: string[] = [];
  let start = 0;
  let inQuotes = false;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c === 34 /* " */) {
      inQuotes = !inQuotes;
    } else if (c === 44 /* , */ && !inQuotes) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

/** Parse a comma-separated list of HTTP field names from a directive argument.
 * Strips surrounding double quotes if present and unescapes `\"` sequences.
 * Returns an array of trimmed, non-empty field names. */
function parseFieldNames(value: string): string[] {
  const t = value.trim();
  const parsed = t.length >= 2 && t.startsWith('"') && t.endsWith('"')
    ? t.slice(1, -1).replace(/\\"/g, '"')
    : t;
  return parsed.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Parses a `Cache-Control` header value into a typed object. Returns an empty
 * object for `null` or empty string. Directive names are case-insensitive.
 * Unknown directives are ignored per RFC 9111. Throws on malformed values for
 * known directives (e.g. `max-age=abc`).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The header value (e.g. `headers.get("cache-control")`).
 * @returns Parsed directives as a union of request/response types.
 *
 * @example Usage
 * ```ts
 * import { parseCacheControl } from "@std/http/unstable-cache-control";
 * import { assertEquals } from "@std/assert";
 *
 * const cc = parseCacheControl("max-age=3600, private");
 * assertEquals(cc.maxAge, 3600);
 * assertEquals(cc.private, true);
 * ```
 *
 * @throws {SyntaxError} If a known directive has a malformed value (e.g.
 * `max-age=abc`) or a required value is missing (e.g. bare `max-age`).
 */
export function parseCacheControl(value: string | null): CacheControl {
  const result: AllCacheControlFields = {};
  if (value === null || value.trim() === "") {
    return result as CacheControl;
  }

  const seen = new Set<string>();
  const parts = splitDirectives(value);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === "") continue;

    const eq = trimmed.indexOf("=");
    const name = (eq === -1 ? trimmed : trimmed.slice(0, eq)).trim()
      .toLowerCase();
    const rawValue = eq === -1 ? undefined : trimmed.slice(eq + 1).trim();

    // RFC 9111 §4.2.1: when a directive appears more than once, use the first
    // occurrence. Track seen directive names to skip subsequent duplicates.
    if (seen.has(name)) continue;
    seen.add(name);

    switch (name) {
      case "max-age":
        if (rawValue === undefined) {
          throw new SyntaxError(
            `Cache-Control: ${name} requires an integer value`,
          );
        }
        result.maxAge = parseNonNegativeInt(rawValue, name);
        break;
      case "max-stale":
        result.maxStale = rawValue === undefined
          ? true
          : parseNonNegativeInt(rawValue, name);
        break;
      case "min-fresh":
        if (rawValue === undefined) {
          throw new SyntaxError(
            `Cache-Control: ${name} requires an integer value`,
          );
        }
        result.minFresh = parseNonNegativeInt(rawValue, name);
        break;
      case "no-cache":
        result.noCache = rawValue === undefined
          ? true
          : parseFieldNames(rawValue);
        break;
      case "no-store":
        result.noStore = true;
        break;
      case "no-transform":
        result.noTransform = true;
        break;
      case "only-if-cached":
        result.onlyIfCached = true;
        break;
      case "must-revalidate":
        result.mustRevalidate = true;
        break;
      case "must-understand":
        result.mustUnderstand = true;
        break;
      case "proxy-revalidate":
        result.proxyRevalidate = true;
        break;
      case "public":
        result.public = true;
        break;
      case "s-maxage":
        if (rawValue === undefined) {
          throw new SyntaxError(
            `Cache-Control: ${name} requires an integer value`,
          );
        }
        result.sMaxage = parseNonNegativeInt(rawValue, name);
        break;
      case "private":
        result.private = rawValue === undefined
          ? true
          : parseFieldNames(rawValue);
        break;
      case "immutable":
        result.immutable = true;
        break;
      case "stale-while-revalidate":
        if (rawValue === undefined) {
          throw new SyntaxError(
            `Cache-Control: ${name} requires an integer value`,
          );
        }
        result.staleWhileRevalidate = parseNonNegativeInt(rawValue, name);
        break;
      case "stale-if-error":
        if (rawValue === undefined) {
          throw new SyntaxError(
            `Cache-Control: ${name} requires an integer value`,
          );
        }
        result.staleIfError = parseNonNegativeInt(rawValue, name);
        break;
      default:
        // Unknown directives are ignored per RFC 9111 §5.2.3.
        continue;
    }
  }

  return result as CacheControl;
}

function append(
  out: string[],
  directive: string,
  value?: number | true | string[],
): void {
  if (value === undefined) return;
  if (value === true) {
    out.push(directive);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      throw new RangeError(
        `Cache-Control: ${directive} must be a non-negative integer, got ${value}`,
      );
    }
    // Clamp to MAX_DELTA_SECONDS to match parser behavior (RFC 9111 §1.2.2).
    out.push(`${directive}=${Math.min(value, MAX_DELTA_SECONDS)}`);
    return;
  }
  if (value.length === 0) {
    out.push(directive);
    return;
  }
  out.push(`${directive}="${value.join(", ")}"`);
}

/**
 * Serializes a Cache-Control object to a header value string. Output is
 * lowercase and comma-separated. Empty object produces an empty string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param cc The Cache-Control object (request or response).
 * @returns The header value string, or empty string if no directives.
 *
 * @example Usage
 * ```ts
 * import { formatCacheControl } from "@std/http/unstable-cache-control";
 * import { assertEquals } from "@std/assert";
 *
 * const value = formatCacheControl({ maxAge: 300, mustRevalidate: true });
 * assertEquals(value, "max-age=300, must-revalidate");
 * ```
 *
 * @throws {RangeError} If a numeric directive value is not a non-negative
 * integer (e.g. `NaN`, `Infinity`, `-1`, or `3.14`).
 */
export function formatCacheControl(cc: CacheControl): string {
  const d: AllCacheControlFields = cc;
  const out: string[] = [];
  append(out, "max-age", d.maxAge);
  append(out, "no-cache", d.noCache);
  append(out, "no-store", d.noStore);
  append(out, "no-transform", d.noTransform);
  append(out, "max-stale", d.maxStale);
  append(out, "min-fresh", d.minFresh);
  append(out, "only-if-cached", d.onlyIfCached);
  append(out, "s-maxage", d.sMaxage);
  append(out, "private", d.private);
  append(out, "public", d.public);
  append(out, "must-revalidate", d.mustRevalidate);
  append(out, "proxy-revalidate", d.proxyRevalidate);
  append(out, "must-understand", d.mustUnderstand);
  append(out, "immutable", d.immutable);
  append(out, "stale-while-revalidate", d.staleWhileRevalidate);
  append(out, "stale-if-error", d.staleIfError);

  return out.join(", ");
}
