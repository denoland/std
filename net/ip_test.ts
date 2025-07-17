// Copyright 2018-2025 the Deno authors. MIT license.

import { isIPv4, isIPv6 } from "./ip.ts";
import { assertEquals } from "@std/assert";

Deno.test("isIPv4() returns boolean for list of IPv4s", () => {
  const list = [
    { addr: "192.148.122.255", expected: true },
    { addr: "0.128.11.33", expected: true },
    { addr: "0.0.0.0", expected: true },

    { addr: "192.148.122.256", expected: false },
    { addr: "0.128.11", expected: false },
    { addr: "17823366190", expected: false },
    { addr: "192.168.0.-40", expected: false },
  ];

  for (const { addr, expected } of list) {
    assertEquals(isIPv4(addr), expected);
  }
});

Deno.test("isIPv6() returns boolean for list of IPv6s", () => {
  const list = [
    { addr: "2001:db8:3333:4444:5555:6666:7777:8888", expected: true },
    { addr: "2001:db8::1", expected: true },
    { addr: "2001::db8:0:1", expected: true },
    { addr: "::", expected: true },
    { addr: "::1", expected: true },

    { addr: "2001:db8:3333:4444:5555:6666:7777:gggg", expected: false },
    { addr: "2001:db8:3333:4444:5555:6666:7777", expected: false },
    { addr: "2001:db8::4444::8888", expected: false },
    { addr: "2001:db8::4444:0:-30:8888", expected: false },
    { addr: "192.128.0.1", expected: false },
  ];

  for (const { addr, expected } of list) {
    assertEquals(isIPv6(addr), expected);
  }
});
