// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { getNetworkAddress } from "./get_network_address.ts";
import { assertNotEquals } from "../assert/assert_not_equals.ts";

Deno.test("getNetworkAddress() works with IPv4", () => {
  const hostname = getNetworkAddress();
  assertNotEquals(hostname, undefined);
  // Fails if the IPv4 address doesn't belong to the machine
  using _listener = Deno.listen({ hostname, port: 0 });
});

Deno.test("getNetworkAddress() works with IPv6", () => {
  const hostname = getNetworkAddress("IPv6");
  assertNotEquals(hostname, undefined);
  // Fails if the IPv6 address doesn't belong to the machine
  using _listener = Deno.listen({ hostname, port: 0 });
});
