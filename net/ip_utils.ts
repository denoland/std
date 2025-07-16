// Copyright 2018-2025 the Deno authors. MIT license.

const IPV4_REGEX = /^[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}$/;

export type AddressType = "IPv4" | "IPv6";

function ipToInt(addr: string): number {
  return addr.split(".").reduce(
    (acc, octet) => (acc << 8) + parseInt(octet),
    0,
  ) >>> 0;
}

/**
 * Returns the address type ("IPv4" or "IPv6") for a given remote address string.
 *
 * @param remoteAddr - The remote address as a string.
 * @returns The address type ("IPv4" | "IPv6") or undefined if not recognized.
 */
export const distinctRemoteAddr = (
  remoteAddr: string,
): AddressType | undefined => {
  if (isIPv4(remoteAddr)) {
    return "IPv4";
  }
  if (isIPv6(remoteAddr)) {
    return "IPv6";
  }
};

/**
 * Validates whether a given string is a IPv4 address
 *
 * @param addr - IPv4 address in a string format (e.g., "192.168.0.1").
 * @returns a boolean indicating if the string is a IPv4 address
 */
export function isIPv4(addr: string): boolean {
  return IPV4_REGEX.test(addr);
}

/**
 * Validates whether a given string is a IPv6 address
 *
 * @param addr - IPv6 address in a string format (e.g., "2001:db8::1").
 * @returns a boolean indicating if the string is a IPv6 address
 */
export function isIPv6(addr: string): boolean {
  return addr.includes(":");
}

/**
 * Validates whether a given string is a valid IPv4 address
 *
 * @param addr - IPv4 address in a string format (e.g., "192.168.0.1").
 * @returns a boolean indicating if the string is a valid IPv4 address
 */
export function isValidIPv4(addr: string): boolean {
  if (addr === "localhost") {
    return true;
  }

  if (!isIPv4(addr)) {
    return false;
  }

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
 * @param addr - IPv6 address in a string format (e.g., "2001:db8::1").
 * @returns a boolean indicating if the string is a valid IPv6 address
 */
export function isValidIPv6(addr: string): boolean {
  if (!isIPv6(addr)) {
    return false;
  }

  // more than one use of ::
  if ([...addr.matchAll(/::/g)].length > 1) {
    return false;
  }

  const parts = addr.split(":");

  // insert 0 to the sequence when encountering a ::
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] == "" && parts.length < 8) {
      parts.splice(i, 0, "0");
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

// TODO: Match IPv6 CIDR
export function matchSubnet(subnet: string, address: string): boolean {
  // 192.128.0.1 === 192.128.0.1
  if (subnet === address) return true;

  if (subnet.includes("/")) {
    const [range, bitStr] = subnet.split("/");
    if (range && bitStr) {
      const bits = parseInt(bitStr, 0);
      const zeroes = 32 - bits;
      const mask = bits === 0 ? 0 : (~0 << zeroes) >>> 0;

      return (ipToInt(address) & mask) === (ipToInt(range) & mask);
    }
  }

  return false;
}
