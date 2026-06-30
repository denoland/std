// Copyright 2018-2026 the Deno authors. MIT license.

import { isPortAvailable } from "./unstable_is_port_available.ts";
import { assert, assertFalse, assertThrows } from "@std/assert";
import { stub } from "@std/testing/mock";

Deno.test("isPortAvailable() returns true for an available port", () => {
  assert(isPortAvailable(0));
});

Deno.test("isPortAvailable() returns false for a port already in use", () => {
  using listener = Deno.listen({ port: 0 });
  const { port } = listener.addr;
  assertFalse(isPortAvailable(port));
});

Deno.test("isPortAvailable() respects the hostname option", () => {
  using listener = Deno.listen({ port: 0, hostname: "127.0.0.1" });
  const { port } = listener.addr;
  assertFalse(isPortAvailable(port, { hostname: "127.0.0.1" }));
});

Deno.test("isPortAvailable() rethrows errors other than AddrInUse", () => {
  using _listen = stub(Deno, "listen", () => {
    throw new Error("boom");
  });
  assertThrows(() => isPortAvailable(0), Error, "boom");
});
