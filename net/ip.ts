// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Validates whether a given string is a valid IPv4 address
 *
 * @param addr IPv4 address in a string format (e.g., "192.168.0.1").
 * @returns A boolean indicating if the string is a valid IPv4 address
 *
 * @example Check if the address is a IPv4
 * ```ts no-assert ignore
 * import { isIPv4 } from "@std/net/ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * const correctIp = "192.168.0.1"
 * const incorrectIp = "192.168.0.256"
 *
 * assert(isIPv4(correctIp))
 * assertFalse(isIPv4(incorrectIp))
 *
 * ```
 */
export function isIPv4(addr: string): boolean {
  const parts = addr.split(".");

  if (parts.length <= 0 || parts.length < 4) return false;

  for (const part of parts) {
    const n = parseInt(part);

    // n >= 256 or is negative
    if (n >= Math.pow(2, 8) || n < 0) {
      return false;
    }
  }

  return true;
}

/**
 * Validates whether a given string is a IPv6 address
 *
 * @param addr IPv6 address in a string format (e.g., "2001:db8::1").
 * @returns A boolean indicating if the string is a valid IPv6 address

 * @example Check if the address is a IPv4
 * ```ts no-assert ignore
 * import { isIPv6 } from "@std/net/ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * const correctIp = "2001::db8:0:1"
 * const incorrectIp = "2001::db8::1"
 *
 * assert(isIPv6(correctIp))
 * assertFalse(isIPv6(incorrectIp))
 *
 * ```
 */
export function isIPv6(addr: string): boolean {
  // more than one use of ::
  if ([...addr.matchAll(/::/g)].length > 1) {
    return false;
  }

  const parts = addr.split(":");

  // insert "" to the sequence when encountering a :: to normalize the hextets
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] == "" && parts.length < 8) {
      parts.splice(i, 0, "");
    }
  }

  if (parts.length <= 0 || parts.length < 8) return false;

  for (const part of parts) {
    const n = part == "" ? 0 : parseInt(part, 16);

    if (n >= Math.pow(2, 16) || n < 0 || isNaN(n)) {
      return false;
    }
  }

  return true;
}
