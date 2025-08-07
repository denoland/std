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

  return (
    octets.length === 4 &&
    octets.every((octet) => {
      const n = Number(octet);
      return n >= 0 && n <= 255 && !isNaN(n);
    })
  );
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

  return (
    hextets.length === 8 &&
    hextets.every((hextet) => {
      const n = hextet === "" ? 0 : parseInt(hextet, 16);
      return n >= 0 && n <= 65535 && !isNaN(n);
    })
  );
}

/**
 * Checks if an IP address matches a subnet or specific IP address.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr The IP address to check (IPv4 or IPv6)
 * @param subnetOrIps The subnet in CIDR notation (e.g., "192.168.1.0/24") or a specific IP address
 * @returns true if the IP address matches the subnet or IP, false otherwise
 * @example Check if the address is a IPv6
 *
 * ```ts
 * import { matchSubnets } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * assert(matchSubnets("192.168.1.10", ["192.168.1.0/24"]));
 * assertFalse(matchSubnets("192.168.2.10", ["192.168.1.0/24"]));
 *
 * assert(matchSubnets("2001:db8::ffff", ["2001:db8::/64"]));
 * assertFalse(matchSubnets("2001:db9::1", ["2001:db8::/64"]));
 * ```
 */
export function matchSubnets(addr: string, subnetOrIps: string[]): boolean {
  if (!isValidIP(addr)) {
    return false;
  }

  for (const subnetOrIp of subnetOrIps) {
    if (matchSubnet(addr, subnetOrIp)) {
      return true;
    }
  }

  return false;
}

function matchSubnet(addr: string, subnet: string): boolean {
  // If the subnet doesn't contain "/", treat it as a specific IP address
  if (!subnet.includes("/")) {
    return addr === subnet;
  }

  // Parse subnet into IP address and prefix length
  const [subnetIP, prefixLengthStr] = subnet.split("/");
  if (subnetIP === undefined || prefixLengthStr === undefined) {
    return false;
  }

  // Validate that the subnet IP is a valid IPv4 or IPv6 address
  if (!isValidIP(subnetIP)) {
    return false;
  }

  // Parse and validate the prefix length
  const prefix = parseInt(prefixLengthStr, 10);
  if (isNaN(prefix)) {
    return false;
  }

  // Check if both IP and subnet are the same type (IPv4 or IPv6)
  const ipIsV4 = isIPv4(addr);
  const subnetIsV4 = isIPv4(subnetIP);

  // IP and subnet must be the same version (both IPv4 or both IPv6)
  if (ipIsV4 !== subnetIsV4) {
    return false;
  }

  // Delegate to the appropriate subnet matching function
  if (ipIsV4) {
    return matchIPv4Subnet(addr, subnetIP, prefix);
  } else {
    return matchIPv6Subnet(addr, subnetIP, prefix);
  }
}

function isValidIP(ip: string): boolean {
  return isIPv4(ip) || isIPv6(ip);
}

function matchIPv4Subnet(
  ip: string,
  subnetIP: string,
  prefixLength: number
): boolean {
  if (prefixLength < 0 || prefixLength > 32) {
    return false;
  }

  // Special case: /0 matches all IPv4 addresses
  if (prefixLength === 0) {
    return true;
  }

  const ipBytes = ip.split(".").map(Number);
  const subnetBytes = subnetIP.split(".").map(Number);

  if (ipBytes.length !== 4 || subnetBytes.length !== 4) {
    return false;
  }

  const mask = (0xffffffff << (32 - prefixLength)) >>> 0;

  const ipInt =
    (ipBytes[0]! << 24) |
    (ipBytes[1]! << 16) |
    (ipBytes[2]! << 8) |
    ipBytes[3]!;
  const subnetInt =
    (subnetBytes[0]! << 24) |
    (subnetBytes[1]! << 16) |
    (subnetBytes[2]! << 8) |
    subnetBytes[3]!;

  return ((ipInt >>> 0) & mask) === ((subnetInt >>> 0) & mask);
}

function matchIPv6Subnet(
  ip: string,
  subnetIP: string,
  prefixLength: number
): boolean {
  if (prefixLength < 0 || prefixLength > 128) {
    return false;
  }

  if (prefixLength === 0) {
    return true;
  }

  const ipExpanded = expandIPv6(ip);
  const subnetExpanded = expandIPv6(subnetIP);

  if (!ipExpanded || !subnetExpanded) {
    return false;
  }

  const ipBytes = ipv6ToBytes(ipExpanded);
  const subnetBytes = ipv6ToBytes(subnetExpanded);

  const fullBytes = Math.floor(prefixLength / 8);
  const remainingBits = prefixLength % 8;

  for (let i = 0; i < fullBytes; i++) {
    if (ipBytes[i] !== subnetBytes[i]) {
      return false;
    }
  }

  if (remainingBits > 0 && fullBytes < 16) {
    const mask = 0xff << (8 - remainingBits);
    const ipByte = ipBytes[fullBytes];
    const subnetByte = subnetBytes[fullBytes];
    if (ipByte === undefined || subnetByte === undefined) {
      return false;
    }
    return (ipByte & mask) === (subnetByte & mask);
  }

  return true;
}

function expandIPv6(ip: string): string | null {
  if (ip.includes(".")) {
    const parts = ip.split(":");
    const ipv4Part = parts.pop();
    if (!ipv4Part) {
      return null;
    }
    const ipv4Bytes = ipv4Part.split(".").map(Number);
    if (ipv4Bytes.length !== 4) {
      return null;
    }
    const ipv4Hex =
      ((ipv4Bytes[0]! << 8) | ipv4Bytes[1]!).toString(16).padStart(4, "0") +
      ":" +
      ((ipv4Bytes[2]! << 8) | ipv4Bytes[3]!).toString(16).padStart(4, "0");
    ip = parts.join(":") + ":" + ipv4Hex;
  }

  let expanded = ip;

  // Handle ::
  if (expanded.includes("::")) {
    const parts = expanded.split("::");
    const leftParts = parts[0] ? parts[0].split(":") : [];
    const rightParts = parts[1] ? parts[1].split(":") : [];
    const missingParts = 8 - leftParts.length - rightParts.length;

    expanded = leftParts
      .concat(new Array(missingParts).fill("0"))
      .concat(rightParts)
      .join(":");
  }

  // Pad each hextet to 4 digits
  return expanded
    .split(":")
    .map((hextet) => hextet.padStart(4, "0"))
    .join(":");
}

function ipv6ToBytes(expandedIPv6: string): number[] {
  const hextets = expandedIPv6.split(":");
  const bytes: number[] = [];

  for (const hextet of hextets) {
    const value = parseInt(hextet, 16);
    bytes.push((value >> 8) & 0xff, value & 0xff);
  }

  return bytes;
}
