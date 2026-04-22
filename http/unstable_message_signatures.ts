// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for creating and verifying
 * {@link https://www.rfc-editor.org/rfc/rfc9421 | RFC 9421} HTTP Message Signatures.
 *
 * HTTP Message Signatures provide end-to-end integrity and authenticity for
 * components of an HTTP message by using detached digital signatures or MACs.
 * The `Signature-Input` and `Signature` headers are serialized as Structured
 * Fields Dictionaries ({@link https://www.rfc-editor.org/rfc/rfc9651 | RFC 9651}).
 *
 * @example Signing a request
 * ```ts ignore
 * import { signMessage } from "@std/http/unstable-message-signatures";
 *
 * const key = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
 * const request = new Request("https://example.com/api", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: '{"hello":"world"}',
 * });
 *
 * const signed = await signMessage({
 *   message: request,
 *   params: {
 *     components: ["@method", "@authority", "@path", "content-type"],
 *     keyId: "my-key",
 *     created: Math.floor(Date.now() / 1000),
 *   },
 *   key: key.privateKey,
 * });
 * ```
 *
 * @example Verifying a signed request
 * ```ts ignore
 * import { verifyMessage } from "@std/http/unstable-message-signatures";
 *
 * const results = await verifyMessage(
 *   signedRequest,
 *   async (keyId) => lookupPublicKey(keyId),
 * );
 * ```
 *
 * Note: The `;bs` (Binary-wrapped Structured Field) parameter relies on
 * splitting header values by `", "` because the Fetch API `Headers.get()`
 * joins multiple values with this separator and does not expose `getAll()`.
 * This means `;bs` will produce incorrect results for headers whose single
 * value contains a literal `", "` (e.g. the `Date` header). Avoid using `;bs`
 * on such fields; prefer `;sf` where the field is a known Structured Field.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import type {
  BareItem,
  Dictionary,
  InnerList,
  Item,
} from "@std/http/unstable-structured-fields";
import {
  binary,
  innerList as sfInnerList,
  integer as sfInteger,
  isInnerList,
  isItem,
  item as sfItem,
  parseDictionary,
  parseItem,
  parseList,
  serializeDictionary,
  serializeItem,
  serializeList,
  string as sfString,
} from "@std/http/unstable-structured-fields";

const UTF8_ENCODER = new TextEncoder();
const SF_KEY_REGEXP = /^[a-z*][a-z0-9_\-.*]*$/;

// =============================================================================
// Public Types
// =============================================================================

/**
 * Algorithm identifiers per
 * {@link https://www.rfc-editor.org/rfc/rfc9421#section-3.3 | RFC 9421 section 3.3}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type SignatureAlgorithm =
  | "rsa-pss-sha512"
  | "rsa-v1_5-sha256"
  | "hmac-sha256"
  | "ecdsa-p256-sha256"
  | "ecdsa-p384-sha384"
  | "ed25519";

/**
 * Parameters that can be attached to a component identifier.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9421#section-2.1}
 */
export interface ComponentParameters {
  /** Strict Structured Field serialization. */
  sf?: true;
  /** Dictionary member key. */
  key?: string;
  /**
   * Binary-wrapped field values. Each field value is individually wrapped as
   * a Byte Sequence. Because the Fetch API `Headers.get()` joins multiple
   * values with `", "`, this flag will produce incorrect results for headers
   * whose single value contains a literal `", "` (e.g. `Date`). Avoid using
   * `;bs` on such fields.
   */
  bs?: true;
  /** Derive value from the related request. */
  req?: true;
  /** Derive value from trailer fields. */
  tr?: true;
  /** Query parameter name (for `@query-param`). */
  name?: string;
}

/**
 * A component identifier consisting of a name and optional parameters.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9421#section-2}
 */
export interface ComponentIdentifier {
  /** Lowercased field name or derived component name (e.g. `"@method"`). */
  name: string;
  /** Optional parameters per RFC 9421 section 2.1. */
  parameters?: ComponentParameters;
}

/**
 * Known derived component names per
 * {@link https://www.rfc-editor.org/rfc/rfc9421#section-2.2 | RFC 9421 section 2.2}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type DerivedComponent =
  | "@method"
  | "@target-uri"
  | "@authority"
  | "@scheme"
  | "@request-target"
  | "@path"
  | "@query"
  | "@query-param"
  | "@status";

/**
 * Convenience type accepting either a plain string or a full
 * {@linkcode ComponentIdentifier}. Known derived component names are
 * autocompleted.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type ComponentInput =
  | DerivedComponent
  | (string & NonNullable<unknown>)
  | ComponentIdentifier;

/**
 * Signature parameters used when signing a message.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9421#section-2.3}
 */
export interface SignatureParams {
  /** Ordered list of covered components. */
  components: ComponentInput[];
  /** Signature algorithm. */
  algorithm?: SignatureAlgorithm;
  /** Key identifier. Mapped to/from the wire-format parameter name `keyid`. */
  keyId?: string;
  /** Creation time as seconds since Unix epoch (not milliseconds). */
  created?: number;
  /** Expiration time as seconds since Unix epoch (not milliseconds). */
  expires?: number;
  /** Nonce for replay protection. */
  nonce?: string;
  /** Application-specific tag. */
  tag?: string;
  /**
   * Signature label, defaults to `"sig"`. Must be a valid sf-key (lowercase
   * alphanumeric, `_`, `-`, `.`, `*`). Must also be unique among existing
   * signatures on the target message per RFC 9421 section 4; a `TypeError`
   * is thrown on collision.
   */
  label?: string;
}

/**
 * Parsed signature parameters returned from verification. Components are always
 * fully resolved {@linkcode ComponentIdentifier} objects.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface ParsedSignatureParams {
  /** Ordered list of covered components. */
  components: ComponentIdentifier[];
  /** Signature algorithm, if specified. */
  algorithm?: SignatureAlgorithm;
  /** Key identifier. */
  keyId?: string;
  /** Creation time as seconds since Unix epoch. */
  created?: number;
  /** Expiration time as seconds since Unix epoch. */
  expires?: number;
  /** Nonce value. */
  nonce?: string;
  /** Application-specific tag. */
  tag?: string;
}

/**
 * Options for {@linkcode signMessage}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface SignOptions<
  T extends Request | Response = Request | Response,
> {
  /** The HTTP request or response to sign. */
  message: T;
  /** Signature parameters. */
  params: SignatureParams;
  /** The signing key. */
  key: CryptoKey;
  /** The originating request, needed when signing a response with `;req` components. */
  request?: Request;
}

/**
 * Options for {@linkcode verifyMessage}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface VerifyOptions {
  /** Maximum allowed age of the signature in seconds. */
  maxAge?: number;
  /** Components that must be covered by each verified signature. */
  requiredComponents?: ComponentInput[];
  /** Specific signature label(s) to verify. If omitted, all are verified. */
  labels?: string[];
  /** The originating request, needed when verifying response signatures with `;req` components. */
  request?: Request;
}

/**
 * Result of a successful signature verification.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface VerifyResult {
  /** The label of the verified signature. */
  label: string;
  /** The parsed signature parameters. */
  params: ParsedSignatureParams;
}

// =============================================================================
// Algorithm Dispatch
// =============================================================================

const SUPPORTED_ALGORITHMS: ReadonlySet<string> = new Set([
  "rsa-pss-sha512",
  "rsa-v1_5-sha256",
  "hmac-sha256",
  "ecdsa-p256-sha256",
  "ecdsa-p384-sha384",
  "ed25519",
]);

function isSupportedAlgorithm(value: string): value is SignatureAlgorithm {
  return SUPPORTED_ALGORITHMS.has(value);
}

function getSignParams(
  algorithm: SignatureAlgorithm,
): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
  switch (algorithm) {
    case "rsa-pss-sha512":
      return { name: "RSA-PSS", saltLength: 64 } as RsaPssParams;
    case "rsa-v1_5-sha256":
      return { name: "RSASSA-PKCS1-v1_5" };
    case "hmac-sha256":
      return { name: "HMAC" };
    case "ecdsa-p256-sha256":
      return { name: "ECDSA", hash: "SHA-256" } as EcdsaParams;
    case "ecdsa-p384-sha384":
      return { name: "ECDSA", hash: "SHA-384" } as EcdsaParams;
    case "ed25519":
      return { name: "Ed25519" };
  }
}

function inferAlgorithm(key: CryptoKey): SignatureAlgorithm {
  const alg = key.algorithm;
  const name = alg.name;
  if (name === "Ed25519") return "ed25519";
  if (name === "HMAC") {
    const hash = (alg as HmacKeyAlgorithm).hash.name;
    if (hash === "SHA-256") return "hmac-sha256";
    throw new TypeError(`Unsupported HMAC hash: "${hash}"`);
  }
  if (name === "RSA-PSS") {
    const hash = (alg as RsaHashedKeyAlgorithm).hash.name;
    if (hash === "SHA-512") return "rsa-pss-sha512";
    throw new TypeError(`Unsupported RSA-PSS hash: "${hash}"`);
  }
  if (name === "RSASSA-PKCS1-v1_5") {
    const hash = (alg as RsaHashedKeyAlgorithm).hash.name;
    if (hash === "SHA-256") return "rsa-v1_5-sha256";
    throw new TypeError(`Unsupported RSASSA-PKCS1-v1_5 hash: "${hash}"`);
  }
  if (name === "ECDSA") {
    const curve = (alg as EcKeyAlgorithm).namedCurve;
    if (curve === "P-256") return "ecdsa-p256-sha256";
    if (curve === "P-384") return "ecdsa-p384-sha384";
    throw new TypeError(`Unsupported ECDSA curve: "${curve}"`);
  }
  throw new TypeError(`Cannot infer signature algorithm from key: "${name}"`);
}

// =============================================================================
// Component Value Resolution
// =============================================================================

function normalizeIdentifier(input: ComponentInput): ComponentIdentifier {
  if (typeof input === "string") {
    return { name: input };
  }
  return input;
}

function resolveComponentValue(
  id: ComponentIdentifier,
  message: Request | Response,
  parsedUrl: { value?: URL },
  relatedRequest?: Request,
  relatedParsedUrl?: { value?: URL },
): string {
  const params = id.parameters ?? {};

  // Validate incompatible parameter combinations
  if (params.bs && params.sf) {
    throw new TypeError(
      `Cannot combine "bs" and "sf" parameters on component "${id.name}"`,
    );
  }
  if (params.bs && params.key !== undefined) {
    throw new TypeError(
      `Cannot combine "bs" and "key" parameters on component "${id.name}"`,
    );
  }

  if (params.tr) {
    throw new TypeError(
      `Trailer field resolution (";tr") is not supported for component "${id.name}"`,
    );
  }

  // Handle ;req parameter
  if (params.req) {
    if (message instanceof Request) {
      throw new TypeError(
        `Cannot use "req" parameter on component "${id.name}" for a request message`,
      );
    }
    if (!relatedRequest) {
      throw new TypeError(
        `Cannot resolve "req" parameter on component "${id.name}": no related request provided`,
      );
    }
    const { req: _, ...restParams } = params;
    return resolveComponentValue(
      { name: id.name, parameters: restParams },
      relatedRequest,
      relatedParsedUrl ?? {},
    );
  }

  if (id.name.startsWith("@")) {
    return resolveDerivedComponent(id.name, message, params, parsedUrl);
  }

  return resolveFieldComponent(id.name, message, params);
}

const REQUEST_ONLY_DERIVED: ReadonlySet<string> = new Set<DerivedComponent>([
  "@method",
  "@target-uri",
  "@authority",
  "@scheme",
  "@request-target",
  "@path",
  "@query",
  "@query-param",
]);

function resolveDerivedComponent(
  name: string,
  message: Request | Response,
  params: ComponentParameters,
  parsedUrl: { value?: URL },
): string {
  if (REQUEST_ONLY_DERIVED.has(name)) {
    if (!(message instanceof Request)) {
      throw new TypeError(`Cannot use "${name}" on a response message`);
    }
    return resolveRequestDerived(name, message, params, parsedUrl);
  }

  if (name === "@status") {
    if (message instanceof Request) {
      throw new TypeError(`Cannot use "${name}" on a request message`);
    }
    return String(message.status);
  }

  throw new TypeError(`Unknown derived component "${name}"`);
}

function resolveRequestDerived(
  name: string,
  request: Request,
  params: ComponentParameters,
  parsedUrl: { value?: URL },
): string {
  if (name === "@method") return request.method.toUpperCase();
  if (name === "@target-uri") return request.url;

  const url = parsedUrl.value ??= new URL(request.url);
  switch (name) {
    case "@authority":
      return url.host;
    case "@scheme":
      return url.protocol.slice(0, -1);
    case "@request-target":
      return url.pathname + url.search;
    case "@path":
      return url.pathname || "/";
    case "@query":
      return url.search || "?";
    case "@query-param": {
      if (params.name === undefined) {
        throw new TypeError(
          `Component "${name}" requires "name" parameter`,
        );
      }
      const decoded = decodeURIComponent(params.name);
      const searchParams = new URLSearchParams(url.search);
      const values: string[] = [];
      for (const [k, v] of searchParams) {
        if (k === decoded) values.push(v);
      }
      if (values.length === 0) {
        throw new TypeError(
          `Query parameter "${params.name}" not found in request URL`,
        );
      }
      // RFC 9421 section 2.2.8: "If a parameter name occurs multiple times
      // in a request, the named query parameter MUST NOT be included."
      if (values.length > 1) {
        throw new TypeError(
          `Query parameter "${params.name}" occurs multiple times`,
        );
      }
      return encodeQueryParamValue(values[0]!);
    }
    default:
      // Unreachable: gated by REQUEST_ONLY_DERIVED; kept for exhaustiveness.
      throw new TypeError(`Unknown derived component "${name}"`);
  }
}

function encodeQueryParamValue(value: string): string {
  // RFC 9421 section 2.2.8: use "percent-encode after encoding" from the
  // WHATWG URL spec (application/x-www-form-urlencoded serializing), which
  // differs from encodeURIComponent in that it also encodes !'()* characters.
  // URLSearchParams serializes with + for spaces; convert back to %20.
  return new URLSearchParams([["", value]]).toString().slice(1).replaceAll(
    "+",
    "%20",
  );
}

function resolveFieldComponent(
  name: string,
  message: Request | Response,
  params: ComponentParameters,
): string {
  const headerValue = message.headers.get(name);
  if (headerValue === null) {
    throw new TypeError(`Missing "${name}" header field`);
  }

  if (params.sf) {
    return resolveStrictStructuredField(headerValue, name);
  }

  if (params.key !== undefined) {
    return resolveDictionaryMember(headerValue, name, params.key);
  }

  if (params.bs) {
    return resolveBinaryWrapped(headerValue);
  }

  return headerValue;
}

function resolveStrictStructuredField(
  headerValue: string,
  fieldName: string,
): string {
  // Try Dictionary, then List, then Item — the first successful parse wins
  try {
    return serializeDictionary(parseDictionary(headerValue));
  } catch { /* not a dictionary */ }
  try {
    return serializeList(parseList(headerValue));
  } catch { /* not a list */ }
  try {
    return serializeItem(parseItem(headerValue));
  } catch { /* not an item */ }
  throw new TypeError(
    `Cannot apply "sf" parameter to field "${fieldName}": unknown Structured Field type`,
  );
}

function resolveDictionaryMember(
  headerValue: string,
  fieldName: string,
  key: string,
): string {
  let dict: Dictionary;
  try {
    dict = parseDictionary(headerValue);
  } catch (cause) {
    throw new TypeError(
      `Cannot parse "${fieldName}" as Dictionary for "key" parameter`,
      { cause },
    );
  }
  const member = dict.get(key);
  if (member === undefined) {
    throw new TypeError(
      `Dictionary key "${key}" not found in "${fieldName}" header`,
    );
  }
  if (isItem(member)) {
    return serializeItem(member);
  }
  // Inner list member — serialize as inner list value (member_value)
  return serializeList([member]);
}

function resolveBinaryWrapped(headerValue: string): string {
  // Each field value is individually wrapped as a Byte Sequence.
  // The Fetch API Headers.get() joins multiple values with ", " and does not
  // expose getAll(). Splitting on ", " is therefore the best we can do, but
  // it will mishandle single header values that contain a literal ", " (e.g.
  // the Date header). Avoid using ;bs on such fields.
  const values = headerValue.split(", ");
  const items: Item[] = values.map((v) => {
    const bytes = UTF8_ENCODER.encode(v.trim());
    return sfItem(binary(bytes));
  });
  return serializeList(items);
}

// =============================================================================
// Signature Base Construction
// =============================================================================

function serializeComponentIdentifier(id: ComponentIdentifier): string {
  let result = `"${id.name}"`;
  const params = id.parameters ?? {};
  if (params.sf) result += ";sf";
  if (params.key !== undefined) result += `;key="${params.key}"`;
  if (params.bs) result += ";bs";
  if (params.req) result += ";req";
  if (params.tr) result += ";tr";
  if (params.name !== undefined) result += `;name="${params.name}"`;
  return result;
}

function buildSignatureParamsValue(
  components: ComponentIdentifier[],
  params: SignatureParams,
): string {
  // Build the inner list items (component identifiers as String items with params)
  const items: Item[] = components.map((id) => {
    const sfParams = new Map<string, BareItem>();
    const p = id.parameters ?? {};
    if (p.sf) sfParams.set("sf", { type: "boolean", value: true });
    if (p.key !== undefined) {
      sfParams.set("key", { type: "string", value: p.key });
    }
    if (p.bs) sfParams.set("bs", { type: "boolean", value: true });
    if (p.req) sfParams.set("req", { type: "boolean", value: true });
    // `;tr` is rejected upstream; add handling here when trailer support lands.
    if (p.name !== undefined) {
      sfParams.set("name", { type: "string", value: p.name });
    }
    return sfItem(sfString(id.name), sfParams);
  });

  // Build the inner list parameters (signature metadata)
  const listParams = new Map<string, BareItem>();
  if (params.created !== undefined) {
    listParams.set("created", sfInteger(params.created));
  }
  if (params.expires !== undefined) {
    listParams.set("expires", sfInteger(params.expires));
  }
  if (params.nonce !== undefined) {
    listParams.set("nonce", sfString(params.nonce));
  }
  if (params.algorithm !== undefined) {
    listParams.set("alg", sfString(params.algorithm));
  }
  if (params.keyId !== undefined) {
    listParams.set("keyid", sfString(params.keyId));
  }
  if (params.tag !== undefined) {
    listParams.set("tag", sfString(params.tag));
  }

  const il = sfInnerList(items, listParams);
  // Serialize just the inner list (not as a dictionary member)
  return serializeInnerListValue(il);
}

function serializeInnerListValue(il: InnerList): string {
  const items = il.items.map((i) => serializeItem(i)).join(" ");
  let result = `(${items})`;
  for (const [key, value] of il.parameters) {
    // buildSignatureParamsValue only ever puts integer (created/expires) or
    // string (nonce/alg/keyid/tag) bare items into listParams.
    result += `;${key}=${
      value.type === "integer" ? String(value.value) : `"${value.value}"`
    }`;
  }
  return result;
}

/**
 * Options for {@linkcode createSignatureBase}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface CreateSignatureBaseOptions {
  /** The HTTP request or response. */
  message: Request | Response;
  /** Signature parameters including covered components. */
  params: SignatureParams;
  /** The originating request when signing a response with `;req` components. */
  request?: Request;
}

/**
 * Construct the signature base string for a message per
 * {@link https://www.rfc-editor.org/rfc/rfc9421#section-2.5 | RFC 9421 section 2.5}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { createSignatureBase } from "@std/http/unstable-message-signatures";
 * import { assert } from "@std/assert";
 *
 * const request = new Request("https://example.com/path", {
 *   method: "GET",
 *   headers: { "Content-Type": "text/plain" },
 * });
 * const base = createSignatureBase({
 *   message: request,
 *   params: {
 *     components: ["@method", "@authority"],
 *     keyId: "my-key",
 *     created: 1618884473,
 *   },
 * });
 *
 * assert(base.includes('"@method": GET'));
 * ```
 *
 * @param options The message, signature parameters, and optional related request.
 * @returns The signature base string.
 */
export function createSignatureBase(
  options: CreateSignatureBaseOptions,
): string {
  const { message, params, request: relatedRequest } = options;
  const components = params.components.map(normalizeIdentifier);

  const seen = new Set<string>();
  const lines: string[] = [];
  const parsedUrl: { value?: URL } = {};
  const relatedParsedUrl: { value?: URL } = {};
  for (const id of components) {
    if (id.name === "@signature-params") {
      throw new TypeError(
        `"@signature-params" must not be listed in covered components`,
      );
    }
    if (id.name !== id.name.toLowerCase()) {
      throw new TypeError(
        `Component name "${id.name}" must be lowercase`,
      );
    }
    const serializedId = serializeComponentIdentifier(id);
    if (seen.has(serializedId)) {
      throw new TypeError(
        `Duplicate component identifier ${serializedId} in covered components`,
      );
    }
    seen.add(serializedId);
    const value = resolveComponentValue(
      id,
      message,
      parsedUrl,
      relatedRequest,
      relatedParsedUrl,
    );
    lines.push(`${serializedId}: ${value}`);
  }

  const sigParamsValue = buildSignatureParamsValue(components, params);
  lines.push(`"@signature-params": ${sigParamsValue}`);

  return lines.join("\n");
}

// =============================================================================
// Input Validation
// =============================================================================

function validateTimestamp(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${name} must be a non-negative integer, got ${value}`,
    );
  }
}

function validateSignParams(params: SignatureParams): void {
  if (params.label !== undefined && !SF_KEY_REGEXP.test(params.label)) {
    throw new TypeError(
      `Invalid signature label "${params.label}": must be a valid sf-key (lowercase alphanumeric, _, -, ., *)`,
    );
  }
  if (params.created !== undefined) {
    validateTimestamp(params.created, "created");
  }
  if (params.expires !== undefined) {
    validateTimestamp(params.expires, "expires");
  }
  if (
    params.algorithm !== undefined && !isSupportedAlgorithm(params.algorithm)
  ) {
    throw new TypeError(
      `Unsupported signature algorithm: "${params.algorithm}"`,
    );
  }
}

// =============================================================================
// signMessage
// =============================================================================

/**
 * Sign an HTTP message per
 * {@link https://www.rfc-editor.org/rfc/rfc9421 | RFC 9421}.
 *
 * Returns a new Request/Response with `Signature` and `Signature-Input`
 * headers appended. The original message is not mutated.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { signMessage } from "@std/http/unstable-message-signatures";
 * import { assert } from "@std/assert";
 *
 * const key = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]) as CryptoKeyPair;
 * const request = new Request("https://example.com/", { method: "POST" });
 * const signed = await signMessage({
 *   message: request,
 *   params: {
 *     components: ["@method", "@authority"],
 *     keyId: "test-key",
 *     created: Math.floor(Date.now() / 1000),
 *   },
 *   key: key.privateKey,
 * });
 *
 * assert(signed.headers.has("Signature"));
 * assert(signed.headers.has("Signature-Input"));
 * ```
 *
 * @typeParam T The message type ({@linkcode Request} or {@linkcode Response}).
 * @param options Signing options.
 * @returns A new message with signature headers appended.
 */
export async function signMessage<T extends Request | Response>(
  options: SignOptions<T>,
): Promise<T> {
  const { message, params, key, request } = options;
  const label = params.label ?? "sig";

  validateSignParams(params);
  assertUniqueLabel(message.headers, label);

  const algorithm = params.algorithm ?? inferAlgorithm(key);

  const baseOpts: CreateSignatureBaseOptions = { message, params };
  if (request) baseOpts.request = request;
  const base = createSignatureBase(baseOpts);
  const baseBytes = UTF8_ENCODER.encode(base);

  const signParams = getSignParams(algorithm);
  const signatureBytes: Uint8Array_ = new Uint8Array(
    await crypto.subtle.sign(signParams, key, baseBytes),
  );

  // Build Signature-Input value
  const components = params.components.map(normalizeIdentifier);
  const sigParamsValue = buildSignatureParamsValue(components, params);

  // Build headers
  const sigInputHeader = `${label}=${sigParamsValue}`;
  const sigHeader = serializeDictionary(
    new Map([[label, sfItem(binary(signatureBytes))]]),
  );

  // clone() preserves the concrete type at runtime
  const clone = message.clone() as T;
  appendHeader(clone.headers, "Signature-Input", sigInputHeader);
  appendHeader(clone.headers, "Signature", sigHeader);
  return clone;
}

function appendHeader(headers: Headers, name: string, value: string): void {
  const existing = headers.get(name);
  if (existing) {
    headers.set(name, `${existing}, ${value}`);
  } else {
    headers.set(name, value);
  }
}

// Per RFC 9421 §4, signature labels MUST be unique within an HTTP message
// across both the Signature-Input and Signature dictionaries. Appending a
// signature with a colliding label would produce duplicate dictionary keys
// that silently corrupt prior signatures on parse (last value wins per
// RFC 8941).
function assertUniqueLabel(headers: Headers, label: string): void {
  for (const name of ["Signature-Input", "Signature"] as const) {
    const value = headers.get(name);
    if (value === null) continue;
    let dict: Dictionary;
    try {
      dict = parseDictionary(value);
    } catch (cause) {
      throw new TypeError(
        `Cannot parse existing "${name}" header on message to check label uniqueness`,
        { cause },
      );
    }
    if (dict.has(label)) {
      throw new TypeError(
        `Signature label "${label}" is already present in the "${name}" header on the message; choose a unique label (RFC 9421 section 4)`,
      );
    }
  }
}

// =============================================================================
// verifyMessage
// =============================================================================

/**
 * Verify one or more signatures on an HTTP message per
 * {@link https://www.rfc-editor.org/rfc/rfc9421 | RFC 9421}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore
 * import { verifyMessage } from "@std/http/unstable-message-signatures";
 *
 * const results = await verifyMessage(
 *   signedRequest,
 *   async (keyId) => lookupPublicKey(keyId),
 *   { requiredComponents: ["@method", "@authority"] },
 * );
 * ```
 *
 * @param message The HTTP request or response to verify.
 * @param keyLookup Resolves a key identifier to a CryptoKey, or `null` if the
 *   key is not found. When the signature has no `keyid` parameter, the empty
 *   string `""` is passed.
 * @param options Optional verification constraints.
 * @returns Array of verified signature results.
 */
export async function verifyMessage(
  message: Request | Response,
  keyLookup: (
    keyId: string,
    algorithm?: SignatureAlgorithm,
  ) => Promise<CryptoKey | null> | CryptoKey | null,
  options?: VerifyOptions,
): Promise<VerifyResult[]> {
  if (
    options?.maxAge !== undefined &&
    (!Number.isInteger(options.maxAge) || options.maxAge < 0)
  ) {
    throw new RangeError(
      `maxAge must be a non-negative integer, got ${options.maxAge}`,
    );
  }

  const sigInputHeader = message.headers.get("Signature-Input");
  if (sigInputHeader === null) {
    throw new TypeError('Missing "Signature-Input" header');
  }
  const sigHeader = message.headers.get("Signature");
  if (sigHeader === null) {
    throw new TypeError('Missing "Signature" header');
  }

  const sigInputDict = parseDictionary(sigInputHeader);
  const sigDict = parseDictionary(sigHeader);

  // Validate label consistency
  for (const [label] of sigInputDict) {
    if (!sigDict.has(label)) {
      throw new TypeError(
        `Label "${label}" found in Signature-Input but missing in Signature`,
      );
    }
  }
  for (const [label] of sigDict) {
    if (!sigInputDict.has(label)) {
      throw new TypeError(
        `Label "${label}" found in Signature but missing in Signature-Input`,
      );
    }
  }

  const results: VerifyResult[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (const [label, sigInputMember] of sigInputDict) {
    // Filter by labels option
    if (options?.labels && !options.labels.includes(label)) continue;

    if (!isInnerList(sigInputMember)) {
      throw new TypeError(
        `Signature-Input member "${label}" is not an Inner List`,
      );
    }

    // Parse covered components from the inner list
    const parsedParams = parseSignatureInput(sigInputMember, label);

    // Enforce required components
    if (options?.requiredComponents) {
      for (const required of options.requiredComponents) {
        const reqId = normalizeIdentifier(required);
        const reqKey = serializeComponentIdentifier(reqId);
        const found = parsedParams.components.some(
          (c) => serializeComponentIdentifier(c) === reqKey,
        );
        if (!found) {
          throw new Error(
            `Signature "${label}" does not cover required component ${reqKey}`,
          );
        }
      }
    }

    // Check expires
    if (parsedParams.expires !== undefined) {
      if (now > parsedParams.expires) {
        throw new Error(
          `Signature "${label}" has expired (past "expires" timestamp)`,
        );
      }
    }

    // Check maxAge
    if (options?.maxAge !== undefined) {
      if (parsedParams.created === undefined) {
        throw new Error(
          `Signature "${label}" has no "created" timestamp but maxAge was requested`,
        );
      }
      if (now - parsedParams.created > options.maxAge) {
        throw new Error(`Signature "${label}" has expired`);
      }
    }

    // Reconstruct signature base
    const reconstructedParams: SignatureParams = {
      components: parsedParams.components,
      ...(parsedParams.algorithm !== undefined &&
        { algorithm: parsedParams.algorithm }),
      ...(parsedParams.keyId !== undefined && { keyId: parsedParams.keyId }),
      ...(parsedParams.created !== undefined &&
        { created: parsedParams.created }),
      ...(parsedParams.expires !== undefined &&
        { expires: parsedParams.expires }),
      ...(parsedParams.nonce !== undefined && { nonce: parsedParams.nonce }),
      ...(parsedParams.tag !== undefined && { tag: parsedParams.tag }),
    };
    const verifyBaseOpts: CreateSignatureBaseOptions = {
      message,
      params: reconstructedParams,
    };
    if (options?.request) verifyBaseOpts.request = options.request;
    const base = createSignatureBase(verifyBaseOpts);
    const baseBytes = UTF8_ENCODER.encode(base);

    // Get signature bytes
    const sigMember = sigDict.get(label);
    if (!sigMember || !isItem(sigMember)) {
      throw new TypeError(
        `Signature member "${label}" is not an Item`,
      );
    }
    if (sigMember.value.type !== "binary") {
      throw new TypeError(
        `Signature member "${label}" is not a Byte Sequence`,
      );
    }
    const sigBytes: Uint8Array_ = new Uint8Array(
      sigMember.value.value,
    );

    // Look up key
    const algorithm = parsedParams.algorithm;
    const keyId = parsedParams.keyId ?? "";
    const verifyKey = await keyLookup(keyId, algorithm);
    if (verifyKey === null) {
      throw new TypeError(`Key not found for keyId "${keyId}"`);
    }

    const verifyAlgorithm = algorithm ?? inferAlgorithm(verifyKey);
    const verifyParams = getSignParams(verifyAlgorithm);

    const valid = await crypto.subtle.verify(
      verifyParams,
      verifyKey,
      sigBytes,
      baseBytes,
    );

    if (!valid) {
      throw new Error(
        `Signature verification failed for label "${label}"`,
      );
    }

    results.push({ label, params: parsedParams });
  }

  return results;
}

function parseSignatureInput(
  il: InnerList,
  label: string,
): ParsedSignatureParams {
  const components: ComponentIdentifier[] = [];

  for (const member of il.items) {
    if (member.value.type !== "string") {
      throw new TypeError(
        `Component identifier in "${label}" is not a String`,
      );
    }
    const name = member.value.value;
    const params: ComponentParameters = {};
    for (const [key, value] of member.parameters) {
      switch (key) {
        case "sf":
          if (value.type === "boolean" && value.value) params.sf = true;
          break;
        case "key":
          if (value.type === "string") params.key = value.value;
          break;
        case "bs":
          if (value.type === "boolean" && value.value) params.bs = true;
          break;
        case "req":
          if (value.type === "boolean" && value.value) params.req = true;
          break;
        case "tr":
          if (value.type === "boolean" && value.value) params.tr = true;
          break;
        case "name":
          if (value.type === "string") params.name = value.value;
          break;
      }
    }
    const hasParams = Object.values(params).some((v) => v !== undefined);
    components.push(hasParams ? { name, parameters: params } : { name });
  }

  const result: ParsedSignatureParams = { components };

  for (const [key, value] of il.parameters) {
    switch (key) {
      case "created":
        if (value.type === "integer") result.created = value.value;
        break;
      case "expires":
        if (value.type === "integer") result.expires = value.value;
        break;
      case "nonce":
        if (value.type === "string") result.nonce = value.value;
        break;
      case "alg":
        if (value.type === "string" && isSupportedAlgorithm(value.value)) {
          result.algorithm = value.value;
        }
        break;
      case "keyid":
        if (value.type === "string") result.keyId = value.value;
        break;
      case "tag":
        if (value.type === "string") result.tag = value.value;
        break;
    }
  }

  return result;
}
