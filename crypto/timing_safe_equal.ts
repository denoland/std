// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

function toUint8Array(
  value: ArrayBufferView | ArrayBufferLike,
): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }
  return ArrayBuffer.isView(value)
    ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    : new Uint8Array(value);
}

/**
 * When checking the values of cryptographic hashes are equal, default
 * comparisons can be susceptible to timing based attacks, where attacker is
 * able to find out information about the host system by repeatedly checking
 * response times to equality comparisons of values.
 *
 * It is likely some form of timing safe equality will make its way to the
 * WebCrypto standard (see:
 * {@link https://github.com/w3c/webcrypto/issues/270 | w3c/webcrypto#270}), but until
 * that time, `timingSafeEqual()` is provided.
 *
 * Note: This is a best-effort constant-time comparison implemented in
 * JavaScript. The V8 JIT compiler does not provide formal constant-time
 * guarantees, and inputs backed by `SharedArrayBuffer` are susceptible to
 * concurrent modification during comparison.
 *
 * @example Usage
 * ```ts
 * import { timingSafeEqual } from "@std/crypto/timing-safe-equal";
 * import { assert } from "@std/assert";
 *
 * const a = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello world"),
 * );
 * const b = await crypto.subtle.digest(
 *   "SHA-384",
 *   new TextEncoder().encode("hello world"),
 * );
 *
 * assert(timingSafeEqual(a, b));
 * ```
 *
 * @param a The first value to compare.
 * @param b The second value to compare.
 * @returns `true` if the values are equal, otherwise `false`.
 * @throws {TypeError} If the byte lengths of the two buffers are not equal.
 */
export function timingSafeEqual(
  a: ArrayBufferView | ArrayBufferLike,
  b: ArrayBufferView | ArrayBufferLike,
): boolean {
  if (a.byteLength !== b.byteLength) {
    throw new TypeError(
      `Cannot compare buffers of different byte lengths (${a.byteLength} vs ${b.byteLength})`,
    );
  }
  const ua = toUint8Array(a);
  const ub = toUint8Array(b);
  const length = ua.length;
  let out = 0;
  for (let i = 0; i < length; i++) {
    out |= ua[i]! ^ ub[i]!;
  }
  return out === 0;
}
