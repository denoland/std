// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { getAvailablePort } from "./get_available_port.ts";
import { assertEquals } from "@std/assert";

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
  await testWithPort(port);
});

Deno.test("getAvailablePort() gets an available port with a preferred port", async () => {
  const port = getAvailablePort({ preferredPort: 9563 });
  await testWithPort(port);
});
