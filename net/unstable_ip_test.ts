// Copyright 2018-2025 the Deno authors. MIT license.

import {
  isIPv4,
  isIPv6,
  matchIPv4Subnet,
  matchIPv6Subnet,
  matchSubnets,
} from "./unstable_ip.ts";
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
  ];

  for (const { addr, subnets, expected } of list) {
    assertEquals(matchSubnets(addr, subnets), expected);
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
  ];

  for (const { addr, subnet, expected } of list) {
    assertEquals(matchIPv4Subnet(addr, subnet), expected);
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

    // expandIPv6 edge cases
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

    //IPv6 with embedded IPv4
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
  ];

  for (const { addr, subnet, expected } of list) {
    assertEquals(matchIPv6Subnet(addr, subnet), expected);
  }
});
