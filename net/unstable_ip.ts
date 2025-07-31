// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Validates whether a given string is a valid IPv4 address.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IPv4 address in a string format (e.g., "192.168.0.1").
 * @returns A boolean indicating if the string is a valid IPv4 address.
 *
 * @example Check if the address is a IPv4
 * ```ts
 * import { isIPv4 } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * const correctIp = "192.168.0.1"
 * const incorrectIp = "192.168.0.256"
 *
 * assert(isIPv4(correctIp))
 * assertFalse(isIPv4(incorrectIp))
 * ```
 */
export function isIPv4(addr: string): boolean {
  const octets = addr.split(".");

  return octets.length === 4 && octets.every((octet) => {
    const n = Number(octet);
    return n >= 0 && n <= 255 && !isNaN(n);
  });
}

/**
 * Validates whether a given string is a IPv6 address.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IPv6 address in a string format (e.g., "2001:db8::1").
 * @returns A boolean indicating if the string is a valid IPv6 address.
 *
 * @example Check if the address is a IPv6
 * ```ts
 * import { isIPv6 } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * const correctIp = "2001::db8:0:1"
 * const incorrectIp = "2001::db8::1"
 *
 * assert(isIPv6(correctIp))
 * assertFalse(isIPv6(incorrectIp))
 * ```
 */
export function isIPv6(addr: string): boolean {
  // more than one use of ::
  if (addr.split("::").length > 2) return false;

  const hextets = addr.split(":");

  // x:x:x:x:x:x:d.d.d.d (https://www.rfc-editor.org/rfc/rfc4291#section-2.2)
  // check if has ipv4 on
  if (addr.includes(".")) {
    // is just an ipv4
    if (hextets.length === 1) return false;

    const last = hextets.pop();
    if (!last || !isIPv4(last)) return false;

    // just to maintain the length to 8
    hextets.push("");
  }

  // expand ::
  while (hextets.length < 8) {
    const idx = hextets.indexOf("");
    if (idx === -1) break;
    hextets.splice(idx, 0, "");
  }

  return hextets.length === 8 && hextets.every((hextet) => {
    const n = hextet === "" ? 0 : parseInt(hextet, 16);
    return n >= 0 && n <= 65535 && !isNaN(n);
  });
}
