// Copyright 2018-2025 the Deno authors. MIT license.

import { isIPv4, isIPv6, matchSubnets } from "./unstable_ip.ts";
import { assertEquals } from "@std/assert";

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
  ];

  for (const { addr, expected } of list) {
    assertEquals(isIPv4(addr), expected);
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

    { addr: "2001:db8:3333:4444:5555:6666:7777:gggg", expected: false },
    { addr: "2003:3333:4444:5555:6666:7777:192.168.0.256", expected: false },
    { addr: "2001:db8:3333:4444:5555:6666:7777", expected: false },
    { addr: "2001:db8::4444::8888", expected: false },
    { addr: "2001:db8::4444:0:-30:8888", expected: false },
    { addr: "192.128.0.1", expected: false },
  ];

  for (const { addr, expected } of list) {
    assertEquals(isIPv6(addr), expected);
  }
});

Deno.test("matchSubnets - IPv4 exact match", () => {
  assertEquals(matchSubnets("192.168.1.10", ["192.168.1.10"]), true);
  assertEquals(matchSubnets("192.168.1.10", ["192.168.1.11"]), false);
});

Deno.test("matchSubnets - IPv4 subnet match", () => {
  // Test /24 subnet
  assertEquals(matchSubnets("192.168.1.10", ["192.168.1.0/24"]), true);
  assertEquals(matchSubnets("192.168.1.255", ["192.168.1.0/24"]), true);
  assertEquals(matchSubnets("192.168.2.10", ["192.168.1.0/24"]), false);

  // Test /16 subnet
  assertEquals(matchSubnets("192.168.100.10", ["192.168.0.0/16"]), true);
  assertEquals(matchSubnets("192.169.1.10", ["192.168.0.0/16"]), false);

  // Test /8 subnet
  assertEquals(matchSubnets("192.100.100.100", ["192.0.0.0/8"]), true);
  assertEquals(matchSubnets("193.1.1.1", ["192.0.0.0/8"]), false);
});

Deno.test("matchSubnets - IPv6 exact match", () => {
  assertEquals(matchSubnets("2001:db8::1", ["2001:db8::1"]), true);
  assertEquals(matchSubnets("2001:db8::1", ["2001:db8::2"]), false);
  assertEquals(matchSubnets("::1", ["::1"]), true);
});

Deno.test("matchSubnets - IPv6 subnet match", () => {
  // Test /64 subnet
  assertEquals(matchSubnets("2001:db8::1", ["2001:db8::/64"]), true);
  assertEquals(matchSubnets("2001:db8::ffff", ["2001:db8::/64"]), true);
  assertEquals(matchSubnets("2001:db9::1", ["2001:db8::/64"]), false);

  // Test /32 subnet
  assertEquals(matchSubnets("2001:db8:1234::1", ["2001:db8::/32"]), true);
  assertEquals(matchSubnets("2001:db9::1", ["2001:db8::/32"]), false);

  // Test /128 (exact match)
  assertEquals(matchSubnets("2001:db8::1", ["2001:db8::1/128"]), true);
  assertEquals(matchSubnets("2001:db8::2", ["2001:db8::1/128"]), false);
});

Deno.test("matchSubnets - multiple subnets", () => {
  const subnets = [
    "192.168.1.0/24",
    "10.0.0.0/8",
    "2001:db8::/32",
    "172.16.0.100", // exact IP
  ];

  assertEquals(matchSubnets("192.168.1.50", subnets), true);
  assertEquals(matchSubnets("10.5.5.5", subnets), true);
  assertEquals(matchSubnets("2001:db8:1234::1", subnets), true);
  assertEquals(matchSubnets("172.16.0.100", subnets), true);
  assertEquals(matchSubnets("172.16.0.101", subnets), false);
  assertEquals(matchSubnets("8.8.8.8", subnets), false);
});

Deno.test("matchSubnets - mixed IPv4 and IPv6", () => {
  const subnets = ["192.168.1.0/24", "2001:db8::/64"];

  assertEquals(matchSubnets("192.168.1.10", subnets), true);
  assertEquals(matchSubnets("2001:db8::1", subnets), true);
  assertEquals(matchSubnets("10.0.0.1", subnets), false);
  assertEquals(matchSubnets("2001:db9::1", subnets), false);
});

Deno.test("matchSubnets - invalid inputs", () => {
  assertEquals(matchSubnets("invalid-ip", ["192.168.1.0/24"]), false);
  assertEquals(matchSubnets("192.168.1.10", ["invalid-subnet"]), false);
  assertEquals(matchSubnets("192.168.1.10", ["192.168.1.0/33"]), false);
  assertEquals(matchSubnets("2001:db8::1", ["2001:db8::/129"]), false);
});

Deno.test("matchSubnets - edge cases", () => {
  // Empty subnets array
  assertEquals(matchSubnets("192.168.1.10", []), false);

  // /0 subnet (all IPs)
  assertEquals(matchSubnets("192.168.1.10", ["0.0.0.0/0"]), true);
  assertEquals(matchSubnets("8.8.8.8", ["0.0.0.0/0"]), true);

  // IPv6 /0 subnet
  assertEquals(matchSubnets("2001:db8::1", ["::/0"]), true);
  assertEquals(matchSubnets("fe80::1", ["::/0"]), true);

  // /32 for IPv4 (exact match)
  assertEquals(matchSubnets("192.168.1.10", ["192.168.1.10/32"]), true);
  assertEquals(matchSubnets("192.168.1.11", ["192.168.1.10/32"]), false);
});
