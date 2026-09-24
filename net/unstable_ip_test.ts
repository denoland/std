// Copyright 2018-2026 the Deno authors. MIT license.

import {
  classifyIP,
  type IPAddressKind,
  isIPv4,
  isIPv6,
  isLinkLocal,
  isLoopback,
  isMulticast,
  isPrivate,
  isUnspecified,
  matchIPv4Subnet,
  matchIPv6Subnet,
  matchSubnets,
  parseIPv4,
  parseIPv6,
} from "./unstable_ip.ts";
import { assert, assertEquals, assertFalse } from "@std/assert";

/** Builds the 16 bytes of an IPv6 address from its eight hextets. */
function bytes(...hextets: number[]): Uint8Array {
  const out = new Uint8Array(16);
  for (const [i, hextet] of hextets.entries()) {
    out[i * 2] = hextet >>> 8;
    out[i * 2 + 1] = hextet & 0xff;
  }
  return out;
}

Deno.test("parseIPv4() returns the address bytes", () => {
  const list: [string, number[]][] = [
    ["192.148.122.255", [192, 148, 122, 255]],
    ["0.128.11.33", [0, 128, 11, 33]],
    ["0.0.0.0", [0, 0, 0, 0]],
    ["255.255.255.255", [255, 255, 255, 255]],
  ];

  for (const [addr, expected] of list) {
    assertEquals(parseIPv4(addr), new Uint8Array(expected));
  }
});

Deno.test("parseIPv4() returns undefined for invalid addresses", () => {
  const list = [
    // Out of range.
    "192.148.122.256",
    "192.168.0.-40",
    // Wrong number of parts.
    "0.128.11",
    "17823366190",
    "192.168.1.2.3",
    "1.2.3.",
    "1..2.3",
    "",
    // Not decimal digits.
    "1a.1a.1.1",
    "a.b.c.d",
    "0x7f.0.0.1",
    "1e2.1.1.1",
    "+1.2.3.4",
    // Leading zeros: `010` must not be read as octal.
    "01.002.3.4",
    "010.0.0.1",
    // Surrounding whitespace.
    " 1.2.3.4",
    "1.2.3.4 ",
  ];

  for (const addr of list) {
    assertEquals(parseIPv4(addr), undefined, addr);
  }
});

Deno.test("isIPv4()", () => {
  const list = [
    { addr: "192.148.122.255", expected: true },
    { addr: "0.128.11.33", expected: true },
    { addr: "0.0.0.0", expected: true },

    { addr: "192.148.122.256", expected: false },
    { addr: "0.128.11", expected: false },
    { addr: "17823366190", expected: false },
    { addr: "192.168.0.-40", expected: false },
    { addr: "1a.1a.1.1", expected: false },
    { addr: "a.b.c.d", expected: false },
    { addr: "192.168.1.2.3", expected: false },
    { addr: " 1.2.3.4", expected: false },
    { addr: "1.2.3.4 ", expected: false },
    { addr: "01.002.3.4", expected: false },
    { addr: "0x7f.0.0.1", expected: false },
    { addr: "1e2.1.1.1", expected: false },
    { addr: "+1.2.3.4", expected: false },
    { addr: "1.2.3.", expected: false },
    { addr: "1..2.3", expected: false },
  ];

  for (const { addr, expected } of list) {
    assertEquals(isIPv4(addr), expected, addr);
  }
});

Deno.test("parseIPv6() returns the address bytes", () => {
  const list: [string, Uint8Array][] = [
    [
      "2001:db8:3333:4444:5555:6666:7777:8888",
      bytes(0x2001, 0x0db8, 0x3333, 0x4444, 0x5555, 0x6666, 0x7777, 0x8888),
    ],
    ["2001:db8::1", bytes(0x2001, 0x0db8, 0, 0, 0, 0, 0, 1)],
    ["2001::db8:0:1", bytes(0x2001, 0, 0, 0, 0, 0x0db8, 0, 1)],
    ["::", bytes()],
    ["::1", bytes(0, 0, 0, 0, 0, 0, 0, 1)],
    ["1::", bytes(1)],
    // "::" standing for a single zero group at either end. Rejected before
    // the parsers landed, because expansion keyed off a hextet count that a
    // trailing or leading "::" inflated to 9.
    ["1:2:3:4:5:6:7::", bytes(1, 2, 3, 4, 5, 6, 7, 0)],
    ["::1:2:3:4:5:6:7", bytes(0, 1, 2, 3, 4, 5, 6, 7)],
    // Uppercase hex is accepted, per the URL standard.
    ["2001:DB8::1", bytes(0x2001, 0x0db8, 0, 0, 0, 0, 0, 1)],
    // x:x:x:x:x:x:d.d.d.d, RFC 4291, section 2.2.
    [
      "2003:3333:4444:5555:6666:7777:192.168.0.1",
      bytes(0x2003, 0x3333, 0x4444, 0x5555, 0x6666, 0x7777, 0xc0a8, 0x0001),
    ],
    ["::192.168.0.1", bytes(0, 0, 0, 0, 0, 0, 0xc0a8, 0x0001)],
    ["::ffff:127.0.0.1", bytes(0, 0, 0, 0, 0, 0xffff, 0x7f00, 0x0001)],
  ];

  for (const [addr, expected] of list) {
    assertEquals(parseIPv6(addr), expected, addr);
  }
});

Deno.test("parseIPv6() returns undefined for invalid addresses", () => {
  const list = [
    // Not hex.
    "2001:db8:3333:4444:5555:6666:7777:gggg",
    "2001:db8::4444:0:-30:8888",
    // Too few or too many pieces.
    "2001:db8:3333:4444:5555:6666:7777",
    "1:2:3:4:5:6:7:8:9",
    "1:2:3:4:5:6:7::8",
    "",
    // Seven pieces already, so there is no room for the IPv4 tail's two.
    "1:2:3:4:5:6::1.2.3.4",
    // More than one "::".
    "2001:db8::4444::8888",
    "2001:db8:::1",
    // A lone leading or trailing ":".
    ":1",
    "1:",
    // A bare IPv4 address is not an IPv6 address.
    "192.128.0.1",
    // Embedded IPv4 must itself be a valid dotted quad.
    "2003:3333:4444:5555:6666:7777:192.168.0.256",
    "::ffff:1.2.3",
    "::ffff:0x1.2.3.4",
    "::ffff:01.2.3.4",
    "::1..2.3",
    "::1.2.3.",
    // Surrounding whitespace, in both positions.
    " ::1",
    "::1 ",
    // Zone IDs are intentionally omitted by the URL standard.
    "fe80::1%eth0",
  ];

  for (const addr of list) {
    assertEquals(parseIPv6(addr), undefined, addr);
  }
});

Deno.test("isIPv6()", () => {
  const list = [
    { addr: "2001:db8:3333:4444:5555:6666:7777:8888", expected: true },
    { addr: "2001:db8::1", expected: true },
    { addr: "2001::db8:0:1", expected: true },
    { addr: "::", expected: true },
    { addr: "::1", expected: true },
    { addr: "2003:3333:4444:5555:6666:7777:192.168.0.1", expected: true },
    { addr: "ab::cd:192.168.0.1", expected: true },
    { addr: "::192.168.0.1", expected: true },
    { addr: "1:2:3:4:5:6:7::", expected: true },
    { addr: "::1:2:3:4:5:6:7", expected: true },

    { addr: "2001:db8:3333:4444:5555:6666:7777:gggg", expected: false },
    { addr: "2003:3333:4444:5555:6666:7777:192.168.0.256", expected: false },
    { addr: "2001:db8:3333:4444:5555:6666:7777", expected: false },
    { addr: "2001:db8::4444::8888", expected: false },
    { addr: "2001:db8::4444:0:-30:8888", expected: false },
    { addr: "192.128.0.1", expected: false },
    { addr: ":1", expected: false },
    { addr: "2001:db8:::1", expected: false },
    { addr: " ::1", expected: false },
    { addr: "::1 ", expected: false },
    { addr: "::ffff:0x1.2.3.4", expected: false },
    { addr: "fe80::1%eth0", expected: false },
    { addr: "1:2:3:4:5:6:7::8", expected: false },
    { addr: "::ffff:1.2.3", expected: false },
    { addr: "1:2:3:4:5:6:7:8:9", expected: false },
  ];

  for (const { addr, expected } of list) {
    assertEquals(isIPv6(addr), expected, addr);
  }
});

Deno.test("matchSubnets()", () => {
  const mixed = [
    "192.168.1.0/24",
    "10.0.0.0/8",
    "2001:db8::/32",
    "172.16.0.100", // exact IP
  ];

  const list = [
    // Multiple and mixed subnets
    { addr: "192.168.1.50", subnets: mixed, expected: true },
    { addr: "10.5.5.5", subnets: mixed, expected: true },
    { addr: "172.16.0.100", subnets: mixed, expected: true },
    { addr: "172.16.0.101", subnets: mixed, expected: false },
    { addr: "8.8.8.8", subnets: mixed, expected: false },
    { addr: "2001:db8:1234::1", subnets: mixed, expected: true },
    { addr: "2001:db9::1", subnets: mixed, expected: false },

    // Invalid inputs
    { addr: "invalid-ip", subnets: ["192.168.1.0/24"], expected: false },
    { addr: "192.168.1.10", subnets: ["invalid-subnet"], expected: false },
    { addr: "192.168.1.10", subnets: ["192.168.1.0/33"], expected: false },
    { addr: "192.168.1.10", subnets: ["192.168.1.0/AA"], expected: false },
    { addr: "192.168.1.10", subnets: ["192.168.1.0/"], expected: false },
    { addr: "2001:db8::1", subnets: ["2001:db8::/129"], expected: false },
    { addr: "2001:db8::1", subnets: ["2001:db8::/"], expected: false },
    { addr: "192.168.1.10", subnets: [], expected: false },

    // Addresses the parsers now reject are not members of any subnet.
    { addr: " 192.168.1.10", subnets: mixed, expected: false },
    { addr: "010.0.0.1", subnets: mixed, expected: false },
    { addr: "0x7f.0.0.1", subnets: ["127.0.0.0/8"], expected: false },
    { addr: "2001:db8:::1", subnets: mixed, expected: false },
    { addr: "2001:db8::1%eth0", subnets: mixed, expected: false },

    // So are subnets whose base address the parsers reject.
    { addr: "192.168.1.10", subnets: ["192.168.01.0/24"], expected: false },
    { addr: "192.168.1.10", subnets: ["0x7f.0.0.0/8"], expected: false },
  ];

  for (const { addr, subnets, expected } of list) {
    assertEquals(matchSubnets(addr, subnets), expected, addr);
  }
});

Deno.test("matchIPv4Subnet()", () => {
  const list = [
    { addr: "192.168.1.10", subnet: "192.168.1.0/24", expected: true },
    { addr: "192.168.1.11", subnet: "/32", expected: false },
    { addr: "192.168.1", subnet: "192.168.1/32", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/33", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/0", expected: true },

    // No "/" means no prefix length, so nothing matches.
    { addr: "192.168.1.1", subnet: "192.168.1.1", expected: false },

    // Prefix lengths are decimal digits only. The address has to sit inside
    // the subnet under the length `parseInt()` used to produce, or the row
    // passes for the wrong reason: `/0x18` meant 0, `/1e1` meant 1, the rest
    // meant 24.
    { addr: "1.2.3.4", subnet: "192.168.1.0/0x18", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/0x18", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/1e1", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/ 24", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/+24", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/24abc", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.0/24/8", expected: false },

    // Zero-padded lengths keep working; unlike an octet they are unambiguous.
    { addr: "192.168.1.1", subnet: "192.168.1.0/024", expected: true },
    { addr: "192.168.1.1", subnet: "192.168.1.0/0024", expected: true },
    { addr: "192.168.2.1", subnet: "192.168.1.0/024", expected: false },
    { addr: "1.2.3.4", subnet: "192.168.1.0/00", expected: true },
    { addr: "192.168.1.1", subnet: "192.168.1.0/033", expected: false },

    // Bit-level boundaries.
    { addr: "192.168.1.255", subnet: "192.168.1.0/24", expected: true },
    { addr: "192.168.2.0", subnet: "192.168.1.0/24", expected: false },
    { addr: "192.168.1.127", subnet: "192.168.1.0/25", expected: true },
    { addr: "192.168.1.128", subnet: "192.168.1.0/25", expected: false },
    { addr: "192.168.1.1", subnet: "192.168.1.1/32", expected: true },
    { addr: "192.168.1.2", subnet: "192.168.1.1/32", expected: false },

    // An address the parser rejects is not in any subnet.
    { addr: "010.0.0.1", subnet: "10.0.0.0/8", expected: false },
    { addr: " 192.168.1.10", subnet: "192.168.1.0/24", expected: false },
  ];

  for (const { addr, subnet, expected } of list) {
    assertEquals(matchIPv4Subnet(addr, subnet), expected, `${addr} ${subnet}`);
  }
});

Deno.test("matchIPv6Subnet()", () => {
  const list = [
    // Basic functionality
    { addr: "2001:db8::1", subnet: "2001:db8::/64", expected: true },

    // Invalid prefix lengths
    { addr: "2001:db8::1", subnet: "2001:db8::/129", expected: false },
    { addr: "2001:db8::1", subnet: "/129", expected: false },
    { addr: "2001:db8::1", subnet: "2001:db8::/", expected: false },

    // Invalid address formats
    { addr: "2001:db8", subnet: "2001:db8::/64", expected: false },
    { addr: "2001:db8::1", subnet: "2001:db8", expected: false },

    // Malformed embedded IPv4 and other junk
    { addr: "2001:db8::192.168.1", subnet: "2001:db8::/64", expected: false },
    { addr: "gggg::1", subnet: "2001:db8::/64", expected: false },
    { addr: "invalid", subnet: "2001:db8::/64", expected: false },

    // Zero prefix (matches all)
    { addr: "2001:db8::1", subnet: "::/0", expected: true },

    // Remaining bits test
    { addr: "2001:db8::1", subnet: "2001:db8::/121", expected: true },

    // Additional coverage cases
    { addr: "2001:db8::", subnet: "2001:db8::/64", expected: true },
    { addr: "::", subnet: "::/128", expected: true },

    // Additional edge cases
    { addr: "2001:db8::1", subnet: "2001:db8::1/-1", expected: false },
    { addr: "2001:db8::1", subnet: "2001:db8::1/abc", expected: false },

    // Zero-padded lengths keep working.
    { addr: "2001:db8::1", subnet: "2001:db8::/064", expected: true },
    { addr: "2001:db9::1", subnet: "2001:db8::/064", expected: false },
    { addr: "2001:db8::1", subnet: "2001:db8::/0129", expected: false },

    // IPv6 with embedded IPv4
    {
      addr: "2001:db8::ffff:192.168.1.1.1",
      subnet: "2001:db8::/64",
      expected: false,
    },
    {
      addr: "2001:db8::ffff:192.168.1",
      subnet: "2001:db8::/64",
      expected: false,
    },
    {
      addr: "::ffff:192.168.1.1:",
      subnet: "::ffff:0.0.0.0/128",
      expected: false,
    },
    {
      addr: "::ffff:192.168.1.1",
      subnet: "::ffff:192.168.0.0/112",
      expected: true,
    },

    // Bit-level boundaries.
    { addr: "2001:db9::1", subnet: "2001:db8::/32", expected: false },
    { addr: "2001:db8:8000::", subnet: "2001:db8::/33", expected: false },
    { addr: "2001:db8:7fff::", subnet: "2001:db8::/33", expected: true },

    // Addresses the parser now rejects.
    { addr: "2001:db8:::1", subnet: "2001:db8::/32", expected: false },
    { addr: "2001:db8::1 ", subnet: "2001:db8::/32", expected: false },
    { addr: "fe80::1%eth0", subnet: "fe80::/10", expected: false },
  ];

  for (const { addr, subnet, expected } of list) {
    assertEquals(matchIPv6Subnet(addr, subnet), expected, `${addr} ${subnet}`);
  }
});

Deno.test("classifyIP() classifies IPv4 addresses", () => {
  const list: [string, IPAddressKind][] = [
    ["0.0.0.0", "unspecified"],
    ["0.1.2.3", "reserved"],
    ["10.0.0.1", "private"],
    ["172.16.0.1", "private"],
    ["192.168.0.1", "private"],
    ["100.64.0.1", "shared"],
    ["127.0.0.1", "loopback"],
    ["127.255.255.255", "loopback"],
    ["169.254.169.254", "link-local"],
    ["192.0.2.1", "documentation"],
    ["198.51.100.1", "documentation"],
    ["203.0.113.1", "documentation"],
    ["198.18.0.1", "benchmarking"],
    ["224.0.0.1", "multicast"],
    ["239.255.255.255", "multicast"],
    ["240.0.0.1", "reserved"],
    ["255.255.255.255", "broadcast"],
    ["8.8.8.8", "global"],
    ["93.184.216.34", "global"],
  ];

  for (const [addr, kind] of list) {
    assertEquals(classifyIP(addr), kind, addr);
  }
});

Deno.test("classifyIP() classifies IPv6 addresses", () => {
  const list: [string, IPAddressKind][] = [
    ["::", "unspecified"],
    ["::1", "loopback"],
    ["64:ff9b:1::1", "reserved"],
    ["100::1", "reserved"],
    ["2001:2::1", "benchmarking"],
    ["2001:10::1", "reserved"],
    ["2001:db8::1", "documentation"],
    ["3fff::1", "documentation"],
    ["5f00::1", "reserved"],
    ["fc00::1", "private"],
    ["fd00::1", "private"],
    ["fe80::1", "link-local"],
    ["fec0::1", "reserved"],
    ["ff02::1", "multicast"],
    ["2606:4700::1", "global"],
  ];

  for (const [addr, kind] of list) {
    assertEquals(classifyIP(addr), kind, addr);
  }
});

Deno.test("classifyIP() matches the longest prefix", () => {
  const list: [string, IPAddressKind][] = [
    // Globally reachable carve-outs inside special-purpose blocks.
    ["192.0.0.1", "reserved"],
    ["192.0.0.9", "global"],
    ["192.0.0.10", "global"],
    ["192.0.0.170", "reserved"],
    ["192.31.196.1", "global"],
    ["192.52.193.1", "global"],
    ["192.175.48.1", "global"],
    ["2001::1", "reserved"],
    ["2001:1::1", "global"],
    ["2001:1::2", "global"],
    ["2001:1::3", "global"],
    ["2001:1::4", "reserved"],
    ["2001:3::1", "global"],
    ["2001:4:112::1", "global"],
    ["2001:20::1", "global"],
    ["2001:30::1", "global"],
    ["2620:4f:8000::1", "global"],
    ["64:ff9b::1", "global"],
    // Special-purpose blocks nested in one another.
    ["100:0:0:1::", "reserved"],
    ["0.0.0.0", "unspecified"],
    ["255.255.255.255", "broadcast"],
    ["::1", "loopback"],
  ];

  for (const [addr, kind] of list) {
    assertEquals(classifyIP(addr), kind, addr);
  }
});

Deno.test("classifyIP() classifies addresses just outside a block", () => {
  const list: [string, IPAddressKind][] = [
    ["9.255.255.255", "global"],
    ["100.128.0.1", "global"],
    ["126.255.255.255", "global"],
    ["128.0.0.1", "global"],
    ["169.253.255.255", "global"],
    ["172.32.0.1", "global"],
    ["192.0.3.1", "global"],
    ["198.20.0.1", "global"],
    ["223.255.255.255", "global"],
    ["64:ff9b:2::", "global"],
    ["100:0:0:2::", "global"],
    ["2001:db9::1", "global"],
    ["4000::1", "global"],
    ["fe00::1", "global"],
    // Outside the benchmarking block but still inside 2001::/23.
    ["2001:2:1::", "reserved"],
  ];

  for (const [addr, kind] of list) {
    assertEquals(classifyIP(addr), kind, addr);
  }
});

Deno.test("classifyIP() classifies IPv4-mapped addresses as the mapped address", () => {
  const list: [string, IPAddressKind][] = [
    ["::ffff:127.0.0.1", "loopback"],
    ["::ffff:7f00:1", "loopback"],
    ["::ffff:169.254.169.254", "link-local"],
    ["::ffff:a9fe:a9fe", "link-local"],
    ["::ffff:192.0.2.1", "documentation"],
    ["::ffff:c000:201", "documentation"],
    ["::ffff:8.8.8.8", "global"],
    ["::ffff:0.0.0.0", "unspecified"],
  ];

  for (const [addr, kind] of list) {
    assertEquals(classifyIP(addr), kind, addr);
  }
});

Deno.test("classifyIP() classifies tunnel and translation addresses by their own block", () => {
  // All seven embed 169.254.169.254. Only the mapped form is an alias for it; the
  // others are a route to it, and classify by the block they are in.
  const list: [string, IPAddressKind][] = [
    ["169.254.169.254", "link-local"],
    ["::ffff:169.254.169.254", "link-local"],
    // 6to4, RFC 3056.
    ["2002:a9fe:a9fe::", "reserved"],
    // NAT64, RFC 6052.
    ["64:ff9b::a9fe:a9fe", "global"],
    // Teredo, RFC 4380: the embedded address is obfuscated by XOR.
    ["2001:0:0:0:0:0:5601:5601", "reserved"],
    // IPv4-translated, RFC 2765, Section 2.1.
    ["::ffff:0:a9fe:a9fe", "global"],
    // IPv4-compatible, RFC 4291, Section 2.5.5.1.
    ["::a9fe:a9fe", "reserved"],
  ];

  for (const [addr, kind] of list) {
    assertEquals(classifyIP(addr), kind, addr);
  }
});

Deno.test("classifyIP() returns undefined for strings that are not IP addresses", () => {
  const list = [
    "",
    "example.com",
    "localhost",
    "192.168.0.256",
    "0x7f.0.0.1",
    "010.0.0.1",
    " 127.0.0.1",
    "127.0.0.1 ",
    "::1 ",
    "2001:db8:::1",
    "fe80::1%eth0",
    "[::1]",
    "127.0.0.1:8080",
  ];

  for (const addr of list) {
    assertEquals(classifyIP(addr), undefined, addr);
  }
});

Deno.test("isLoopback() checks for a loopback address", () => {
  assert(isLoopback("127.0.0.1"));
  assert(isLoopback("127.255.255.255"));
  assert(isLoopback("::1"));
  assert(isLoopback("::ffff:127.0.0.1"));
  assertFalse(isLoopback("10.0.0.1"));
  assertFalse(isLoopback("128.0.0.1"));
  assertFalse(isLoopback("::2"));
  assertFalse(isLoopback("not an address"));
});

Deno.test("isPrivate() checks for a private address", () => {
  assert(isPrivate("10.0.0.1"));
  assert(isPrivate("172.16.0.1"));
  assert(isPrivate("192.168.0.1"));
  assert(isPrivate("fc00::1"));
  assert(isPrivate("fd00::1"));
  assert(isPrivate("::ffff:192.168.0.1"));
  assertFalse(isPrivate("172.32.0.1"));
  assertFalse(isPrivate("8.8.8.8"));
  // Shared address space and link-local addresses are their own kinds.
  assertFalse(isPrivate("100.64.0.1"));
  assertFalse(isPrivate("169.254.169.254"));
  assertFalse(isPrivate("not an address"));
});

Deno.test("isLinkLocal() checks for a link-local address", () => {
  assert(isLinkLocal("169.254.0.1"));
  assert(isLinkLocal("169.254.169.254"));
  assert(isLinkLocal("fe80::1"));
  assert(isLinkLocal("febf::1"));
  assert(isLinkLocal("::ffff:169.254.169.254"));
  assertFalse(isLinkLocal("169.253.0.1"));
  assertFalse(isLinkLocal("192.168.0.1"));
  assertFalse(isLinkLocal("fec0::1"));
  assertFalse(isLinkLocal("not an address"));
});

Deno.test("isMulticast() checks for a multicast address", () => {
  assert(isMulticast("224.0.0.1"));
  assert(isMulticast("239.255.255.255"));
  assert(isMulticast("ff00::"));
  assert(isMulticast("ff02::1"));
  assertFalse(isMulticast("223.255.255.255"));
  assertFalse(isMulticast("240.0.0.1"));
  assertFalse(isMulticast("fe80::1"));
  assertFalse(isMulticast("not an address"));
});

Deno.test("isUnspecified() checks for the unspecified address", () => {
  assert(isUnspecified("0.0.0.0"));
  assert(isUnspecified("::"));
  assert(isUnspecified("::ffff:0.0.0.0"));
  assertFalse(isUnspecified("0.0.0.1"));
  assertFalse(isUnspecified("::1"));
  assertFalse(isUnspecified("not an address"));
});
