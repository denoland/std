// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

function toDataView(
  value: ArrayBufferView | ArrayBufferLike | DataView,
): DataView {
  if (value instanceof DataView) {
    return value;
  }
  return ArrayBuffer.isView(value)
    ? new DataView(value.buffer, value.byteOffset, value.byteLength)
    : new DataView(value);
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
 * that time, `timingSafeEqual()` is provided:
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
 */
export function timingSafeEqual(
  a: ArrayBufferView | ArrayBufferLike | DataView,
  b: ArrayBufferView | ArrayBufferLike | DataView,
): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const dataViewA = toDataView(a);
  const dataViewB = toDataView(b);
  const length = a.byteLength;
  let out = 0;
  let i = -1;
  while (++i < length) {
    out |= dataViewA.getUint8(i) ^ dataViewB.getUint8(i);
  }
  return out === 0;
}
