// Copyright 2018-2026 the Deno authors. MIT license.

import { getAvailablePort } from "./get_available_port.ts";
import { assertEquals, assertNotEquals, assertThrows } from "@std/assert";
import { stub } from "@std/testing/mock";

/** Helper function to see if a port is indeed available for listening (race-y) */
async function testWithPort(port: number) {
  const server = Deno.serve({
    port,
    async onListen() {
      const resp = await fetch(`http://localhost:${port}`);
      const text = await resp.text();
      assertEquals(text, "hello");
      server.shutdown();
    },
  }, () => new Response("hello"));

  await server.finished;
}

Deno.test("getAvailablePort() gets an available port", async () => {
  const port = getAvailablePort();
  assertEquals(typeof port, "number");
  await testWithPort(port);
});

Deno.test("getAvailablePort() gets an available port with a preferred port", async () => {
  const preferredPort = 9563;
  const port = getAvailablePort({ preferredPort });
  assertEquals(port, preferredPort);
  await testWithPort(port);
});

Deno.test("getAvailablePort() falls back to another port if preferred port is in use", async () => {
  const preferredPort = 9563;
  const server = Deno.serve(
    { port: preferredPort, onListen: () => {} },
    () => new Response("hello"),
  );
  const port = getAvailablePort({ preferredPort });
  assertEquals(typeof port, "number");
  assertNotEquals(port, preferredPort);
  server.shutdown();
  await server.finished;
});

Deno.test("getAvailablePort() throws if error is not AddrInUse", () => {
  using _ = stub(Deno, "listen", () => {
    throw new Error();
  });
  const preferredPort = 9563;
  assertThrows(() => getAvailablePort({ preferredPort }), Error);
});
