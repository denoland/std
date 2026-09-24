// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

const CHAR_0 = 0x30;
const CHAR_9 = 0x39;

/** Hex digit value of a char code, or -1 if it is not a hex digit. */
function hexValue(code: number): number {
  if (code >= CHAR_0 && code <= CHAR_9) return code - CHAR_0;
  if (code >= 0x61 && code <= 0x66) return code - 0x61 + 10; // a-f
  if (code >= 0x41 && code <= 0x46) return code - 0x41 + 10; // A-F
  return -1;
}

function isDigit(code: number): boolean {
  return code >= CHAR_0 && code <= CHAR_9;
}

/**
 * Parses a string as an IPv4 address.
 *
 * The accepted syntax is the URL standard's
 * {@link https://url.spec.whatwg.org/#valid-ipv4-address-string | valid IPv4-address string}:
 * four decimal octets separated by `.`, each written as the shortest possible
 * string of ASCII digits. Hexadecimal, octal and fewer-than-four-part forms are
 * rejected, as is surrounding whitespace.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IPv4 address in a string format (e.g., "192.168.0.1").
 * @returns The four address bytes, or `undefined` if the string is not a valid
 * IPv4 address.
 *
 * @example Parse an IPv4 address
 * ```ts
 * import { parseIPv4 } from "@std/net/unstable-ip"
 * import { assertEquals } from "@std/assert"
 *
 * assertEquals(parseIPv4("192.168.0.1"), new Uint8Array([192, 168, 0, 1]))
 * assertEquals(parseIPv4("0x7f.0.0.1"), undefined)
 * ```
 */
export function parseIPv4(addr: string): Uint8Array | undefined {
  const parts = addr.split(".");
  if (parts.length !== 4) return undefined;

  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    const part = parts[i]!;
    // "Shortest possible" rules out leading zeros, so each octet value has
    // exactly one spelling and `010` cannot be read as octal.
    if (part.length === 0 || part.length > 3) return undefined;
    if (part.length > 1 && part.charCodeAt(0) === CHAR_0) return undefined;

    let value = 0;
    for (let j = 0; j < part.length; j++) {
      const code = part.charCodeAt(j);
      if (!isDigit(code)) return undefined;
      value = value * 10 + (code - CHAR_0);
    }
    if (value > 255) return undefined;
    bytes[i] = value;
  }
  return bytes;
}

/**
 * Validates whether a given string is a valid IPv4 address.
 *
 * See {@linkcode parseIPv4} for the accepted syntax.
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
  return parseIPv4(addr) !== undefined;
}

/**
 * Parses a string as an IPv6 address.
 *
 * Implements the URL standard's
 * {@link https://url.spec.whatwg.org/#concept-ipv6-parser | IPv6 parser}, which
 * covers `::` compression and the trailing `x:x:x:x:x:x:d.d.d.d` form. Zone
 * IDs (`fe80::1%eth0`) are intentionally omitted by that standard and are
 * rejected here too, unlike `node:net`'s `isIP()`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IPv6 address in a string format (e.g., "2001:db8::1").
 * @returns The sixteen address bytes, or `undefined` if the string is not a
 * valid IPv6 address.
 *
 * @example Parse an IPv6 address
 * ```ts
 * import { parseIPv6 } from "@std/net/unstable-ip"
 * import { assertEquals } from "@std/assert"
 *
 * const loopback = new Uint8Array(16)
 * loopback[15] = 1
 *
 * assertEquals(parseIPv6("::1"), loopback)
 * assertEquals(parseIPv6("2001:db8:::1"), undefined)
 * ```
 */
export function parseIPv6(addr: string): Uint8Array | undefined {
  const pieces = new Uint16Array(8);
  let pieceIndex = 0;
  let compress = -1;
  let pointer = 0;

  if (addr.charCodeAt(pointer) === 0x3a) { // ":"
    if (addr.charCodeAt(pointer + 1) !== 0x3a) return undefined;
    pointer += 2;
    pieceIndex += 1;
    compress = pieceIndex;
  }

  while (pointer < addr.length) {
    if (pieceIndex === 8) return undefined;

    if (addr.charCodeAt(pointer) === 0x3a) {
      if (compress !== -1) return undefined;
      pointer += 1;
      pieceIndex += 1;
      compress = pieceIndex;
      continue;
    }

    let value = 0;
    let length = 0;
    while (length < 4) {
      const digit = hexValue(addr.charCodeAt(pointer));
      if (digit === -1) break;
      value = value * 0x10 + digit;
      pointer += 1;
      length += 1;
    }

    if (addr.charCodeAt(pointer) === 0x2e) { // "."
      if (length === 0) return undefined;
      // Rewind: what looked like a hextet is the first octet of an IPv4 tail.
      pointer -= length;
      if (pieceIndex > 6) return undefined;

      let numbersSeen = 0;
      while (pointer < addr.length) {
        let ipv4Piece = -1;
        if (numbersSeen > 0) {
          if (addr.charCodeAt(pointer) === 0x2e && numbersSeen < 4) {
            pointer += 1;
          } else return undefined;
        }
        if (!isDigit(addr.charCodeAt(pointer))) return undefined;
        while (isDigit(addr.charCodeAt(pointer))) {
          const number = addr.charCodeAt(pointer) - CHAR_0;
          if (ipv4Piece === -1) ipv4Piece = number;
          else if (ipv4Piece === 0) return undefined;
          else ipv4Piece = ipv4Piece * 10 + number;
          if (ipv4Piece > 255) return undefined;
          pointer += 1;
        }
        pieces[pieceIndex] = pieces[pieceIndex]! * 0x100 + ipv4Piece;
        numbersSeen += 1;
        if (numbersSeen === 2 || numbersSeen === 4) pieceIndex += 1;
      }
      if (numbersSeen !== 4) return undefined;
      break;
    } else if (addr.charCodeAt(pointer) === 0x3a) {
      pointer += 1;
      if (pointer >= addr.length) return undefined;
    } else if (pointer < addr.length) {
      return undefined;
    }

    pieces[pieceIndex] = value;
    pieceIndex += 1;
  }

  if (compress !== -1) {
    let swaps = pieceIndex - compress;
    pieceIndex = 7;
    while (pieceIndex !== 0 && swaps > 0) {
      const swapIndex = compress + swaps - 1;
      const tmp = pieces[pieceIndex]!;
      pieces[pieceIndex] = pieces[swapIndex]!;
      pieces[swapIndex] = tmp;
      pieceIndex -= 1;
      swaps -= 1;
    }
  } else if (pieceIndex !== 8) return undefined;

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    bytes[i * 2] = pieces[i]! >>> 8;
    bytes[i * 2 + 1] = pieces[i]! & 0xff;
  }
  return bytes;
}

/**
 * Validates whether a given string is a IPv6 address.
 *
 * See {@linkcode parseIPv6} for the accepted syntax.
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
  return parseIPv6(addr) !== undefined;
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
  const isV4 = isIPv4(addr);
  if (!isV4 && !isIPv6(addr)) return false;

  for (const subnetOrIp of subnetOrIps) {
    // Without a "/" the entry is a specific address, compared verbatim.
    if (!subnetOrIp.includes("/")) {
      if (addr === subnetOrIp) return true;
      continue;
    }
    const matched = isV4
      ? matchIPv4Subnet(addr, subnetOrIp)
      : matchIPv6Subnet(addr, subnetOrIp);
    if (matched) return true;
  }

  return false;
}

/**
 * Parses a CIDR prefix length: decimal digits only, within range. Unlike an
 * address octet, a zero-padded length has only one reading, so `/024` is
 * accepted.
 */
function parsePrefixLength(
  prefix: string,
  maxLength: number,
): number | undefined {
  if (prefix.length === 0) return undefined;

  let value = 0;
  for (let i = 0; i < prefix.length; i++) {
    const code = prefix.charCodeAt(i);
    if (!isDigit(code)) return undefined;
    value = value * 10 + (code - CHAR_0);
    if (value > maxLength) return undefined;
  }
  return value;
}

/** Splits `a.b.c.d/n` into its address and prefix length. */
function parseSubnet(
  subnet: string,
  parse: (addr: string) => Uint8Array | undefined,
  maxLength: number,
): [Uint8Array, number] | undefined {
  const slash = subnet.indexOf("/");
  if (slash === -1) return undefined;

  const bytes = parse(subnet.slice(0, slash));
  if (bytes === undefined) return undefined;

  const prefixLength = parsePrefixLength(subnet.slice(slash + 1), maxLength);
  if (prefixLength === undefined) return undefined;

  return [bytes, prefixLength];
}

/** Compares the leading `prefixLength` bits of two equal-length addresses. */
function matchPrefix(
  addr: Uint8Array,
  subnet: Uint8Array,
  prefixLength: number,
): boolean {
  const fullBytes = prefixLength >> 3;
  for (let i = 0; i < fullBytes; i++) {
    if (addr[i] !== subnet[i]) return false;
  }

  const remainingBits = prefixLength & 7;
  if (remainingBits === 0) return true;

  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (addr[fullBytes]! & mask) === (subnet[fullBytes]! & mask);
}

/**
 * Checks if an IPv4 address matches a subnet or specific IPv4 address.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr The IP address to check (IPv4)
 * @param subnet The subnet in CIDR notation (e.g., "192.168.1.0/24") or a specific IP address
 * @returns true if the IP address matches the subnet or IP, false otherwise
 * @example Check if the address is a IPv6
 *
 * ```ts
 * import { matchIPv4Subnet } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * assert(matchIPv4Subnet("192.168.1.10", "192.168.1.0/24"));
 * assertFalse(matchIPv4Subnet("192.168.2.10", "192.168.1.0/24"));
 * ```
 */
export function matchIPv4Subnet(addr: string, subnet: string): boolean {
  const addrBytes = parseIPv4(addr);
  if (addrBytes === undefined) return false;

  const parsed = parseSubnet(subnet, parseIPv4, 32);
  if (parsed === undefined) return false;

  return matchPrefix(addrBytes, parsed[0], parsed[1]);
}

/**
 * Checks if an IPv6 address matches a subnet or specific IPv6 address.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr The IP address to check (IPv6)
 * @param subnet The subnet in CIDR notation (e.g., "2001:db8::/64") or a specific IP address
 * @returns true if the IP address matches the subnet or IP, false otherwise
 * @example Check if the address is a IPv6
 *
 * ```ts
 * import { matchIPv6Subnet } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * assert(matchIPv6Subnet("2001:db8::ffff", "2001:db8::/64"));
 * assertFalse(matchIPv6Subnet("2001:db9::1", "2001:db8::/64"));
 * ```
 */
export function matchIPv6Subnet(addr: string, subnet: string): boolean {
  const addrBytes = parseIPv6(addr);
  if (addrBytes === undefined) return false;

  const parsed = parseSubnet(subnet, parseIPv6, 128);
  if (parsed === undefined) return false;

  return matchPrefix(addrBytes, parsed[0], parsed[1]);
}

/**
 * The kind of an IP address, following the classification of the IANA
 * special-purpose address registries.
 *
 * `"global"` covers every address that no special-purpose block claims, plus
 * the individual carve-outs that IANA marks globally reachable inside a
 * special-purpose block. It means "not special-purpose", not "safe to connect
 * to"; see {@linkcode classifyIP}.
 *
 * `"reserved"` covers both blocks that are not routable, such as `0.0.0.0/8`,
 * and routable tunnel prefixes, such as 6to4 (`2002::/16`) and Teredo
 * (`2001::/32`).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type IPAddressKind =
  | "loopback"
  | "unspecified"
  | "private"
  | "link-local"
  | "shared"
  | "documentation"
  | "benchmarking"
  | "multicast"
  | "broadcast"
  | "reserved"
  | "global";

/**
 * IPv4 special-purpose blocks, transcribed from the IANA registry on
 * 2026-09-12. Lookup is longest-prefix-first, so the order of the rows here
 * does not matter, and an address in no block is `"global"`.
 */
const IPV4_BLOCKS: [cidr: string, kind: IPAddressKind][] = [
  ["0.0.0.0/8", "reserved"], // RFC 791, Section 3.2
  ["0.0.0.0/32", "unspecified"], // RFC 1122, Section 3.2.1.3
  ["10.0.0.0/8", "private"], // RFC 1918
  ["100.64.0.0/10", "shared"], // RFC 6598
  ["127.0.0.0/8", "loopback"], // RFC 1122, Section 3.2.1.3
  ["169.254.0.0/16", "link-local"], // RFC 3927
  ["172.16.0.0/12", "private"], // RFC 1918
  ["192.0.0.0/24", "reserved"], // RFC 6890, Section 2.1
  ["192.0.0.0/29", "reserved"], // RFC 7335
  ["192.0.0.8/32", "reserved"], // RFC 7600
  ["192.0.0.9/32", "global"], // RFC 7723
  ["192.0.0.10/32", "global"], // RFC 8155
  ["192.0.0.170/32", "reserved"], // RFC 8880
  ["192.0.0.171/32", "reserved"], // RFC 7050, Section 2.2
  ["192.0.2.0/24", "documentation"], // RFC 5737
  ["192.31.196.0/24", "global"], // RFC 7535
  ["192.52.193.0/24", "global"], // RFC 7450
  ["192.88.99.0/24", "reserved"], // RFC 7526
  ["192.88.99.2/32", "reserved"], // RFC 6751
  ["192.168.0.0/16", "private"], // RFC 1918
  ["192.175.48.0/24", "global"], // RFC 7534
  ["198.18.0.0/15", "benchmarking"], // RFC 2544
  ["198.51.100.0/24", "documentation"], // RFC 5737
  ["203.0.113.0/24", "documentation"], // RFC 5737
  // Multicast is not part of the special-purpose registry.
  ["224.0.0.0/4", "multicast"], // RFC 5771
  ["240.0.0.0/4", "reserved"], // RFC 1112, Section 4
  ["255.255.255.255/32", "broadcast"], // RFC 8190, RFC 919, Section 7
];

/** IPv6 special-purpose blocks, transcribed from the IANA registry on 2026-09-12. */
const IPV6_BLOCKS: [cidr: string, kind: IPAddressKind][] = [
  ["::/128", "unspecified"], // RFC 4291
  ["::1/128", "loopback"], // RFC 4291
  // IPv4-compatible addresses, deprecated and not in the registry.
  ["::/96", "reserved"], // RFC 4291, Section 2.5.5.1
  ["64:ff9b::/96", "global"], // RFC 6052
  ["64:ff9b:1::/48", "reserved"], // RFC 8215
  ["100::/64", "reserved"], // RFC 6666
  ["100:0:0:1::/64", "reserved"], // RFC 9780
  // "False, unless allowed by a more specific allocation", hence the carve-outs.
  ["2001::/23", "reserved"], // RFC 2928
  ["2001::/32", "reserved"], // RFC 4380, RFC 8190
  ["2001:1::1/128", "global"], // RFC 7723
  ["2001:1::2/128", "global"], // RFC 8155
  ["2001:1::3/128", "global"], // RFC 9665
  ["2001:2::/48", "benchmarking"], // RFC 5180
  ["2001:3::/32", "global"], // RFC 7450
  ["2001:4:112::/48", "global"], // RFC 7535
  ["2001:10::/28", "reserved"], // RFC 4843
  ["2001:20::/28", "global"], // RFC 7343
  ["2001:30::/28", "global"], // RFC 9374
  ["2001:db8::/32", "documentation"], // RFC 3849
  ["2002::/16", "reserved"], // RFC 3056
  ["2620:4f:8000::/48", "global"], // RFC 7534
  ["3fff::/20", "documentation"], // RFC 9637
  ["5f00::/16", "reserved"], // RFC 9602
  ["fc00::/7", "private"], // RFC 4193, RFC 8190
  ["fe80::/10", "link-local"], // RFC 4291
  // Site-local addresses, deprecated and removed from the registry.
  ["fec0::/10", "reserved"], // RFC 3879
  // Multicast is not part of the special-purpose registry.
  ["ff00::/8", "multicast"], // RFC 4291, Section 2.7
];

/** A block as looked up: prefix bytes, prefix length in bits, and the kind. */
type AddressBlock = [
  prefix: Uint8Array,
  prefixLength: number,
  kind: IPAddressKind,
];

/** Parses the block table, longest prefix first so that the first hit wins. */
function compileBlocks(
  blocks: [string, IPAddressKind][],
  parse: (addr: string) => Uint8Array | undefined,
  maxLength: number,
): AddressBlock[] {
  return blocks
    .map(([cidr, kind]): AddressBlock => {
      const [prefix, prefixLength] = parseSubnet(cidr, parse, maxLength)!;
      return [prefix, prefixLength, kind];
    })
    .sort((a, b) => b[1] - a[1]);
}

const IPV4_TABLE = compileBlocks(IPV4_BLOCKS, parseIPv4, 32);
const IPV6_TABLE = compileBlocks(IPV6_BLOCKS, parseIPv6, 128);

function lookupKind(addr: Uint8Array, table: AddressBlock[]): IPAddressKind {
  for (const [prefix, prefixLength, kind] of table) {
    if (matchPrefix(addr, prefix, prefixLength)) return kind;
  }
  return "global";
}

/**
 * Returns the four IPv4 bytes of an address in `::ffff:0:0/96`, or `undefined`
 * for any other address. A mapped address is an alias for the IPv4 address it
 * contains, so it classifies as that address.
 */
function unmapIPv4(bytes: Uint8Array): Uint8Array | undefined {
  for (let i = 0; i < 10; i++) {
    if (bytes[i] !== 0) return undefined;
  }
  if (bytes[10] !== 0xff || bytes[11] !== 0xff) return undefined;
  return bytes.subarray(12);
}

/**
 * Classifies an IP address against the IANA special-purpose address
 * registries.
 *
 * The address is matched against the longest special-purpose prefix that
 * contains it, so a carve-out beats the block it sits in:
 * `192.0.0.9` is `"global"` even though `192.0.0.0/24` is `"reserved"`.
 * Addresses in no special-purpose block are `"global"`.
 *
 * IPv4-mapped addresses (`::ffff:0:0/96`) are classified as the IPv4 address
 * they contain. Tunnel and translation forms such as 6to4 and Teredo are not:
 * they are a route to an address rather than that address, and classify by
 * their own block.
 *
 * A `"global"` result is therefore not SSRF protection on its own. The IPv4
 * address inside a NAT64, 6to4, Teredo or IPv4-translated address is not
 * inspected, so `64:ff9b::a9fe:a9fe` is `"global"` although it reaches
 * `169.254.169.254`. DNS rebinding and redirects are out of scope too.
 *
 * This takes an address, not a host string. `URL` normalizes an IPv4 host for
 * you, so `new URL("http://0x7f.1/").hostname` is `"127.0.0.1"`, but it keeps
 * the brackets around an IPv6 host. Strip those before classifying.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IP address in a string format (e.g., "192.168.0.1").
 * @returns The kind of the address, or `undefined` if the string is not a
 * valid IP address.
 *
 * @example Classify an address
 * ```ts
 * import { classifyIP } from "@std/net/unstable-ip"
 * import { assertEquals } from "@std/assert"
 *
 * assertEquals(classifyIP("127.0.0.1"), "loopback")
 * assertEquals(classifyIP("10.0.0.1"), "private")
 * assertEquals(classifyIP("2001:db8::1"), "documentation")
 * assertEquals(classifyIP("93.184.216.34"), "global")
 * assertEquals(classifyIP("example.com"), undefined)
 * ```
 *
 * @example Carve-outs inside a special-purpose block
 * ```ts
 * import { classifyIP } from "@std/net/unstable-ip"
 * import { assertEquals } from "@std/assert"
 *
 * assertEquals(classifyIP("192.0.0.1"), "reserved")
 * assertEquals(classifyIP("192.0.0.9"), "global")
 * ```
 *
 * @example Embedded IPv4 addresses are not inspected
 * ```ts
 * import { classifyIP } from "@std/net/unstable-ip"
 * import { assertEquals } from "@std/assert"
 *
 * // NAT64 and IPv4-translated forms of 169.254.169.254
 * assertEquals(classifyIP("64:ff9b::a9fe:a9fe"), "global")
 * assertEquals(classifyIP("::ffff:0:a9fe:a9fe"), "global")
 * ```
 *
 * @example Classify the host of a URL
 * ```ts
 * import { classifyIP } from "@std/net/unstable-ip"
 * import { assertEquals } from "@std/assert"
 *
 * function hostAddress(url: URL): string {
 *   const { hostname } = url
 *   return hostname.startsWith("[") ? hostname.slice(1, -1) : hostname
 * }
 *
 * const ipv6 = new URL("http://[::1]:8080/")
 * assertEquals(hostAddress(ipv6), "::1")
 * assertEquals(classifyIP(hostAddress(ipv6)), "loopback")
 *
 * const ipv4 = new URL("http://0x7f.1/")
 * assertEquals(classifyIP(hostAddress(ipv4)), "loopback")
 * ```
 */
export function classifyIP(addr: string): IPAddressKind | undefined {
  const ipv4 = parseIPv4(addr);
  if (ipv4 !== undefined) return lookupKind(ipv4, IPV4_TABLE);

  const ipv6 = parseIPv6(addr);
  if (ipv6 === undefined) return undefined;

  const mapped = unmapIPv4(ipv6);
  return mapped === undefined
    ? lookupKind(ipv6, IPV6_TABLE)
    : lookupKind(mapped, IPV4_TABLE);
}

/**
 * Checks whether an IP address is a loopback address, that is, in
 * `127.0.0.0/8` or equal to `::1`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IP address in a string format (e.g., "127.0.0.1").
 * @returns `true` if the address is a loopback address, `false` otherwise,
 * including for strings that are not valid IP addresses.
 *
 * @example Check for a loopback address
 * ```ts
 * import { isLoopback } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * assert(isLoopback("127.0.0.1"))
 * assert(isLoopback("::1"))
 * assertFalse(isLoopback("10.0.0.1"))
 * ```
 */
export function isLoopback(addr: string): boolean {
  return classifyIP(addr) === "loopback";
}

/**
 * Checks whether an IP address is in a private block: `10.0.0.0/8`,
 * `172.16.0.0/12` and `192.168.0.0/16` (RFC 1918), or `fc00::/7` (RFC 4193).
 *
 * The shared address space `100.64.0.0/10` (RFC 6598) is not private but
 * `"shared"`, and link-local addresses are `"link-local"`. Use
 * {@linkcode classifyIP} to cover those too.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IP address in a string format (e.g., "192.168.0.1").
 * @returns `true` if the address is in a private block, `false` otherwise,
 * including for strings that are not valid IP addresses.
 *
 * @example Check for a private address
 * ```ts
 * import { isPrivate } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * assert(isPrivate("192.168.0.1"))
 * assert(isPrivate("fd00::1"))
 * assertFalse(isPrivate("100.64.0.1"))
 * ```
 */
export function isPrivate(addr: string): boolean {
  return classifyIP(addr) === "private";
}

/**
 * Checks whether an IP address is link-local, that is, in `169.254.0.0/16`
 * (RFC 3927) or `fe80::/10` (RFC 4291).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IP address in a string format (e.g., "169.254.0.1").
 * @returns `true` if the address is link-local, `false` otherwise, including
 * for strings that are not valid IP addresses.
 *
 * @example Check for a link-local address
 * ```ts
 * import { isLinkLocal } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * assert(isLinkLocal("169.254.169.254"))
 * assert(isLinkLocal("fe80::1"))
 * assertFalse(isLinkLocal("192.168.0.1"))
 * ```
 */
export function isLinkLocal(addr: string): boolean {
  return classifyIP(addr) === "link-local";
}

/**
 * Checks whether an IP address is a multicast address, that is, in
 * `224.0.0.0/4` (RFC 5771) or `ff00::/8` (RFC 4291).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IP address in a string format (e.g., "224.0.0.1").
 * @returns `true` if the address is a multicast address, `false` otherwise,
 * including for strings that are not valid IP addresses.
 *
 * @example Check for a multicast address
 * ```ts
 * import { isMulticast } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * assert(isMulticast("224.0.0.1"))
 * assert(isMulticast("ff02::1"))
 * assertFalse(isMulticast("93.184.216.34"))
 * ```
 */
export function isMulticast(addr: string): boolean {
  return classifyIP(addr) === "multicast";
}

/**
 * Checks whether an IP address is the unspecified address, that is, `0.0.0.0`
 * or `::` (RFC 4291).
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param addr IP address in a string format (e.g., "0.0.0.0").
 * @returns `true` if the address is the unspecified address, `false`
 * otherwise, including for strings that are not valid IP addresses.
 *
 * @example Check for the unspecified address
 * ```ts
 * import { isUnspecified } from "@std/net/unstable-ip"
 * import { assert, assertFalse } from "@std/assert"
 *
 * assert(isUnspecified("0.0.0.0"))
 * assert(isUnspecified("::"))
 * assertFalse(isUnspecified("0.0.0.1"))
 * ```
 */
export function isUnspecified(addr: string): boolean {
  return classifyIP(addr) === "unspecified";
}
