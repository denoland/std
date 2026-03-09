// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for creating and verifying
 * {@link https://www.rfc-editor.org/rfc/rfc9530 | RFC 9530} Digest Fields
 * (Content-Digest and Repr-Digest).
 *
 * Digest fields provide end-to-end integrity of HTTP message bodies. Values are
 * serialized as Structured Fields Dictionaries (RFC 9651).
 *
 * @example Creating a Content-Digest header
 * ```ts
 * import { createContentDigest } from "@std/http/unstable-digest-fields";
 *
 * const body = JSON.stringify({ amount: 100 });
 * const digest = await createContentDigest(body);
 * const request = new Request("https://example.com/pay", {
 *   method: "POST",
 *   headers: { "Content-Digest": digest },
 *   body,
 * });
 * ```
 *
 * @example Verifying a Content-Digest
 * ```ts ignore
 * import { verifyContentDigest } from "@std/http/unstable-digest-fields";
 *
 * const response = await fetch("https://example.com/data");
 * const verified = await verifyContentDigest(response);
 * const data = await verified.json();
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import { timingSafeEqual } from "@std/crypto/timing-safe-equal";
import type { Item } from "@std/http/unstable-structured-fields";
import { toBytes } from "@std/streams/unstable-to-bytes";
import {
  binary,
  isItem,
  item,
  parseDictionary,
  serializeDictionary,
} from "@std/http/unstable-structured-fields";

const UTF8_ENCODER = new TextEncoder();

const DIGEST_ALGORITHMS = ["sha-256", "sha-512"] as const;

/** Supported digest algorithms per RFC 9530 §5. */
export type DigestAlgorithm = "sha-256" | "sha-512";

const WEB_CRYPTO_NAMES: Record<DigestAlgorithm, string> = {
  "sha-256": "SHA-256",
  "sha-512": "SHA-512",
};

function isSupportedAlgorithm(value: string): value is DigestAlgorithm {
  return DIGEST_ALGORITHMS.includes(value as DigestAlgorithm);
}

/** Options for creating a Content-Digest or Repr-Digest header. */
export interface CreateDigestOptions {
  /** Algorithms to include. Defaults to `["sha-256"]`. */
  algorithms?: DigestAlgorithm[];
}

/**
 * Low-level: compute a digest for raw bytes without header formatting.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param content The content to digest.
 * @param algorithm The digest algorithm.
 * @returns The digest bytes.
 * @throws {TypeError} If the algorithm is not supported.
 */
export async function computeDigest(
  content: Uint8Array,
  algorithm: DigestAlgorithm,
): Promise<Uint8Array> {
  if (!isSupportedAlgorithm(algorithm)) {
    throw new TypeError(`Unsupported digest algorithm: "${algorithm}"`);
  }
  // Cast required: Deno types use ArrayBufferView<ArrayBuffer> for BufferSource
  // but Uint8Array exposes ArrayBufferLike which includes SharedArrayBuffer.
  const hash = await crypto.subtle.digest(
    WEB_CRYPTO_NAMES[algorithm],
    content as BufferSource,
  );
  return new Uint8Array(hash);
}

function contentToBytes(
  content: string | Uint8Array | ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  if (typeof content === "string") {
    return Promise.resolve(UTF8_ENCODER.encode(content));
  }
  if (content instanceof Uint8Array) {
    return Promise.resolve(content);
  }
  return toBytes(content);
}

function buildDigestHeaderValue(
  digests: Map<DigestAlgorithm, Uint8Array>,
): string {
  const dict = new Map<string, Item>();
  for (const alg of DIGEST_ALGORITHMS) {
    const digest = digests.get(alg);
    if (digest !== undefined) {
      dict.set(alg, item(binary(digest)));
    }
  }
  return serializeDictionary(dict);
}

function validateAlgorithms(algorithms: DigestAlgorithm[]): void {
  if (algorithms.length === 0) {
    throw new TypeError("At least one algorithm must be specified");
  }
  for (const alg of algorithms) {
    if (!isSupportedAlgorithm(alg)) {
      throw new TypeError(`Unsupported digest algorithm: "${alg}"`);
    }
  }
}

/**
 * Compute the Content-Digest header value for the given body.
 *
 * Content-Digest covers the actual message body bytes (after any content
 * coding such as gzip has been applied).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param content The message body (string, bytes, or stream).
 * @param options Optional algorithms to include; defaults to `["sha-256"]`.
 * @returns The header value, e.g. `sha-256=:base64...:`.
 * @throws {TypeError} If the algorithms option is empty or contains unsupported values.
 */
export async function createContentDigest(
  content: string | Uint8Array | ReadableStream<Uint8Array>,
  options?: CreateDigestOptions,
): Promise<string> {
  const algorithms = options?.algorithms ?? ["sha-256"];
  validateAlgorithms(algorithms);
  const unique = [...new Set(algorithms)];
  const bytes = await contentToBytes(content);
  const digests = new Map<DigestAlgorithm, Uint8Array>();
  await Promise.all(unique.map(async (alg) => {
    digests.set(alg, await computeDigest(bytes, alg));
  }));
  return buildDigestHeaderValue(digests);
}

/**
 * Compute the Repr-Digest header value for the given representation.
 *
 * Repr-Digest covers the representation data *before* content coding is
 * applied (i.e. the decoded payload). When no content coding is used,
 * Repr-Digest and Content-Digest are identical. It is the caller's
 * responsibility to pass the decoded representation bytes.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param content The representation body (string, bytes, or stream).
 * @param options Optional algorithms to include; defaults to `["sha-256"]`.
 * @returns The header value, e.g. `sha-256=:base64...:`.
 * @throws {TypeError} If the algorithms option is empty or contains unsupported values.
 */
export function createReprDigest(
  content: string | Uint8Array | ReadableStream<Uint8Array>,
  options?: CreateDigestOptions,
): Promise<string> {
  return createContentDigest(content, options);
}

const CONTENT_DIGEST_HEADER = "Content-Digest";
const REPR_DIGEST_HEADER = "Repr-Digest";

function parseDigestHeaderValue(
  headerValue: string,
  headerName: string,
): Map<DigestAlgorithm, Uint8Array> {
  const result = new Map<DigestAlgorithm, Uint8Array>();
  let dict;
  try {
    dict = parseDictionary(headerValue);
  } catch (cause) {
    throw new TypeError(`"${headerName}" header is malformed`, { cause });
  }
  for (const [key, member] of dict) {
    if (!isItem(member)) continue;
    if (!isSupportedAlgorithm(key)) continue;
    const bare = member.value;
    if (bare.type !== "binary") continue;
    result.set(key, bare.value);
  }
  return result;
}

async function verifyDigestHeader<T extends Request | Response>(
  message: T,
  headerName: string,
): Promise<T> {
  const headerValue = message.headers.get(headerName);
  if (headerValue === null || headerValue === "") {
    throw new TypeError(`Missing "${headerName}" header`);
  }

  let bodyBytes: Uint8Array;
  if (message.body === null) {
    bodyBytes = new Uint8Array(0);
  } else {
    bodyBytes = await message.clone().bytes();
  }

  const stated = parseDigestHeaderValue(headerValue, headerName);
  if (stated.size === 0) {
    throw new TypeError(
      `"${headerName}" header contains no supported digest algorithms`,
    );
  }

  for (const [alg, statedDigest] of stated) {
    const computed = await computeDigest(bodyBytes, alg);
    if (!timingSafeEqual(statedDigest, computed)) {
      throw new Error(
        `"${headerName}" digest mismatch for algorithm "${alg}"`,
      );
    }
  }

  return message;
}

/**
 * Verify the Content-Digest header of a request or response against its body.
 *
 * Reads the body from a clone to verify; the returned message is the original
 * and its body is still consumable.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param message The HTTP request or response to verify.
 * @returns The same message (body still consumable).
 * @throws {TypeError} If the header is missing, malformed, or contains no supported algorithms.
 * @throws {Error} If the digest does not match.
 */
export function verifyContentDigest<T extends Request | Response>(
  message: T,
): Promise<T> {
  return verifyDigestHeader(message, CONTENT_DIGEST_HEADER);
}

/**
 * Verify the Repr-Digest header of a request or response against its body.
 *
 * Reads the body from a clone to verify; the returned message is the original
 * and its body is still consumable.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param message The HTTP request or response to verify.
 * @returns The same message (body still consumable).
 * @throws {TypeError} If the header is missing, malformed, or contains no supported algorithms.
 * @throws {Error} If the digest does not match.
 */
export function verifyReprDigest<T extends Request | Response>(
  message: T,
): Promise<T> {
  return verifyDigestHeader(message, REPR_DIGEST_HEADER);
}
