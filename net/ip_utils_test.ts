import { assert } from "../assert/assert.ts";
import { assertEquals } from "../assert/equals.ts";
import { assertFalse } from "../assert/false.ts";
import {
  distinctRemoteAddr,
  isIPv4,
  isIPv6,
  isValidIPv4,
  isValidIPv6,
  matchSubnet,
} from "./ip_utils.ts";

Deno.test("distinctRemoteAddr() returns either addr is IPv4, IPv6 or undefined", () => {
  assert(distinctRemoteAddr("192.168.0.1") === "IPv4");
  assert(distinctRemoteAddr("fe08::1") === "IPv6");
  assert(distinctRemoteAddr("foobar") === undefined);
});

Deno.test("isIPv4() returns boolean for list of IPv4s", () => {
  const list = [
    { addr: "127.0.0.1", expected: true },
    { addr: "192.0.0.1", expected: true },
    { addr: "122.255.255.255", expected: true },
    { addr: "10.0.1", expected: false },
    { addr: "fe08::1", expected: false },
  ];

  for (const { addr, expected } of list) {
    assertEquals(isIPv4(addr), expected);
  }
});

Deno.test("isIPv6() returns boolean for list of IPv6s", () => {
  const list = [
    { addr: "127.0.0.1", expected: false },
    { addr: "192.0.0.1", expected: false },
    { addr: "::1", expected: true },
    { addr: "fe08::1", expected: true },
    { addr: "2001:db8:3333:4444:5555:6666:7777:8888", expected: true },
    { addr: "2001::db8:0:1", expected: true },
  ];

  for (const { addr, expected } of list) {
    assertEquals(isIPv6(addr), expected);
  }
});
Deno.test("isValidIPv4() returns boolean for list of IPv4s", () => {
  const list = [
    { addr: "192.148.122.255", expected: true },
    { addr: "0.128.11.33", expected: true },
    { addr: "0.0.0.0", expected: true },
    { addr: "localhost", expected: true },

    { addr: "192.148.122.256", expected: false },
    { addr: "0.128.11", expected: false },
    { addr: "17823366190", expected: false },
    { addr: "192.168.0.-40", expected: false },
  ];

  for (const { addr, expected } of list) {
    assertEquals(isValidIPv4(addr), expected);
  }
});

Deno.test("isValidIPv6() returns boolean for list of IPv6s", () => {
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
    assertEquals(isValidIPv6(addr), expected);
  }
});

Deno.test("matchSubnet() matches a specified static IP or CIDR notation", () => {
  assert(matchSubnet("192.168.0.11", "192.168.0.11"));
  assertFalse(matchSubnet("192.168.0.12", "192.168.0.11"));

  assert(matchSubnet("192.168.1.0/24", "192.168.1.50"));
  assertFalse(matchSubnet("192.168.1.0/24", "192.168.2.1"));

  assert(matchSubnet("10.0.0.0/8", "10.123.55.70"));
  assertFalse(matchSubnet("10.0.0.0/8", "192.168.1.1"));
});
