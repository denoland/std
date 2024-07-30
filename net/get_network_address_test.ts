// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { getNetworkAddress } from "./get_network_address.ts";
import { stub } from "@std/testing/mock";
import { assertEquals } from "@std/assert";

const INTERFACES: Deno.NetworkInterfaceInfo[] = [
  // Network inaccessible
  {
    family: "IPv4",
    name: "lo0",
    address: "127.0.0.1",
    netmask: "255.0.0.0",
    scopeid: null,
    cidr: "127.0.0.1/8",
    mac: "00:00:00:00:00:00",
  },
  {
    family: "IPv6",
    name: "lo0",
    address: "::1",
    netmask: "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
    scopeid: 0,
    cidr: "::1/128",
    mac: "00:00:00:00:00:00",
  },
  {
    family: "IPv6",
    name: "lo0",
    address: "fe80::1",
    netmask: "ffff:ffff:ffff:ffff::",
    scopeid: 1,
    cidr: "fe80::1/64",
    mac: "00:00:00:00:00:00",
  },
  {
    family: "IPv6",
    name: "utun2",
    address: "fe80::7c00:d02e:f1ae:3980",
    netmask: "ffff:ffff:ffff:ffff::",
    scopeid: 17,
    cidr: "fe80::7c00:d02e:f1ae:3980/64",
    mac: "00:00:00:00:00:00",
  },
  // Network accessible
  {
    family: "IPv4",
    name: "en0",
    address: "192.168.0.123",
    netmask: "255.255.255.0",
    scopeid: null,
    cidr: "192.168.0.123/24",
    mac: "11:11:11:11:11:11",
  },
  {
    family: "IPv6",
    name: "en0",
    address: "2001:0000:0000:0000:0000:0000:0000:1234",
    netmask: "ffff:ffff:ffff:ffff::",
    scopeid: 0,
    cidr: "2001:0000:0000:0000:0000:0000:0000:1234/64",
    mac: "11:11:11:11:11:11",
  },
] as const;

Deno.test("getNetworkAddress() works with IPv4", () => {
  using _networkInterfaces = stub(
    Deno,
    "networkInterfaces",
    () => INTERFACES,
  );
  const hostname = getNetworkAddress();
  assertEquals(hostname, INTERFACES[4]!.address);
});

Deno.test("getNetworkAddress() returns listenable IPv4 address", () => {
  const hostname = getNetworkAddress();
  // Only do this test if listenable network interfaces exist
  if (hostname !== undefined) {
    using _listener = Deno.listen({ hostname, port: 0 });
  }
});

Deno.test("getNetworkAddress() works with IPv6", () => {
  using _networkInterfaces = stub(
    Deno,
    "networkInterfaces",
    () => INTERFACES,
  );
  const hostname = getNetworkAddress("IPv6");
  assertEquals(hostname, INTERFACES[5]!.address);
});

Deno.test("getNetworkAddress() returns listenable IPv6 address", () => {
  const hostname = getNetworkAddress("IPv6");
  // Only do this test if listenable network interfaces exist
  if (hostname !== undefined) {
    using _listener = Deno.listen({ hostname, port: 0 });
  }
});
