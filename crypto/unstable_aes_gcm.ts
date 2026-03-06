// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

/**
 * High-level AES-GCM authenticated encryption with automatic nonce generation.
 *
 * With random nonces, do not encrypt more than ~2^32 messages under the same
 * key. Beyond this limit, nonce collision probability becomes non-negligible.
 *
 * @example Usage
 * ```ts
 * import { encryptAesGcm, decryptAesGcm } from "@std/crypto/unstable-aes-gcm";
 * import { assertEquals } from "@std/assert";
 *
 * const key = await crypto.subtle.generateKey(
 *   { name: "AES-GCM", length: 256 },
 *   false,
 *   ["encrypt", "decrypt"],
 * );
 *
 * const plaintext = new TextEncoder().encode("hello world");
 * const encrypted = await encryptAesGcm(key, plaintext);
 * const decrypted = await decryptAesGcm(key, encrypted);
 *
 * assertEquals(decrypted, plaintext);
 * ```
 *
 * @module
 */

const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;
const OVERHEAD = NONCE_LENGTH + TAG_LENGTH;

/** Options for {@linkcode encryptAesGcm} and {@linkcode decryptAesGcm}. */
export interface AesGcmOptions {
  /** Additional authenticated data. Authenticated but not encrypted. */
  additionalData?: BufferSource;
}

/**
 * Encrypts plaintext using AES-GCM with a random 96-bit nonce.
 *
 * Returns `nonce (12 bytes) || ciphertext || tag (16 bytes)`.
 *
 * @example Usage
 * ```ts
 * import { encryptAesGcm } from "@std/crypto/unstable-aes-gcm";
 * import { assertNotEquals } from "@std/assert";
 *
 * const key = await crypto.subtle.generateKey(
 *   { name: "AES-GCM", length: 256 },
 *   false,
 *   ["encrypt", "decrypt"],
 * );
 *
 * const encrypted = await encryptAesGcm(
 *   key,
 *   new TextEncoder().encode("hello world"),
 * );
 *
 * assertNotEquals(encrypted.length, 0);
 * ```
 *
 * @param key The AES-GCM `CryptoKey` to encrypt with.
 * @param plaintext The data to encrypt.
 * @param options Optional additional authenticated data.
 * @returns The concatenated nonce, ciphertext, and authentication tag.
 *
 * @remarks With random nonces, do not encrypt more than ~2^32 messages
 * under the same key. Beyond this limit, nonce collision probability
 * becomes non-negligible.
 *
 * @see {@link https://csrc.nist.gov/pubs/sp/800/38/d/final | NIST SP 800-38D} Section 8.3
 */
export async function encryptAesGcm(
  key: CryptoKey,
  plaintext: BufferSource,
  options?: AesGcmOptions,
): Promise<Uint8Array_> {
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));

  const params: AesGcmParams = {
    name: "AES-GCM",
    iv: nonce,
    tagLength: TAG_LENGTH * 8,
  };
  if (options?.additionalData !== undefined) {
    params.additionalData = options.additionalData;
  }

  const ciphertextAndTag = new Uint8Array(
    await crypto.subtle.encrypt(params, key, plaintext),
  );

  const result = new Uint8Array(NONCE_LENGTH + ciphertextAndTag.byteLength);
  result.set(nonce);
  result.set(ciphertextAndTag, NONCE_LENGTH);
  return result;
}

/**
 * Decrypts data produced by {@linkcode encryptAesGcm}.
 *
 * Expects input in the format `nonce (12 bytes) || ciphertext || tag (16 bytes)`.
 *
 * @example Usage
 * ```ts
 * import { decryptAesGcm, encryptAesGcm } from "@std/crypto/unstable-aes-gcm";
 * import { assertEquals } from "@std/assert";
 *
 * const key = await crypto.subtle.generateKey(
 *   { name: "AES-GCM", length: 256 },
 *   false,
 *   ["encrypt", "decrypt"],
 * );
 *
 * const plaintext = new TextEncoder().encode("hello world");
 * const encrypted = await encryptAesGcm(key, plaintext);
 *
 * assertEquals(await decryptAesGcm(key, encrypted), plaintext);
 * ```
 *
 * @param key The AES-GCM `CryptoKey` to decrypt with.
 * @param data The wire-format output from {@linkcode encryptAesGcm}: nonce (12 B) || ciphertext || tag (16 B).
 * @param options Optional additional authenticated data (must match what was used during encryption).
 * @returns The decrypted plaintext.
 * @throws {RangeError} If `data` is shorter than 28 bytes (12 nonce + 16 tag).
 * @throws {DOMException} If authentication fails (wrong key, tampered data, or
 * mismatched additional data).
 */
export async function decryptAesGcm(
  key: CryptoKey,
  data: BufferSource,
  options?: AesGcmOptions,
): Promise<Uint8Array_> {
  const bytes = ArrayBuffer.isView(data)
    ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    : new Uint8Array(data);

  if (bytes.byteLength < OVERHEAD) {
    throw new RangeError(
      `Data is too short: expected at least ${OVERHEAD} bytes, got ${bytes.byteLength}`,
    );
  }

  const nonce = bytes.subarray(0, NONCE_LENGTH);
  const ciphertextAndTag = bytes.subarray(NONCE_LENGTH);

  const params: AesGcmParams = {
    name: "AES-GCM",
    iv: nonce,
    tagLength: TAG_LENGTH * 8,
  };
  if (options?.additionalData !== undefined) {
    params.additionalData = options.additionalData;
  }

  return new Uint8Array(
    await crypto.subtle.decrypt(params, key, ciphertextAndTag),
  );
}
