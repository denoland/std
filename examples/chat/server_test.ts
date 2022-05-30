// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../../testing/asserts.ts";
import { dirname, fromFileUrl, resolve } from "../../path/mod.ts";
import { TextLineStream } from "../../streams/delimiter.ts";

const moduleDir = resolve(dirname(fromFileUrl(import.meta.url)));

async function startServer(): Promise<Deno.Child<Deno.SpawnOptions>> {
  const server = Deno.spawnChild(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--allow-net",
      "--allow-read",
      "server.ts",
    ],
    cwd: moduleDir,
    stderr: "null",
  });
  try {
    const r = server.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
      new TextLineStream(),
    );
    const reader = r.getReader();
    const res = await reader.read();
    assert(!res.done && res.value.includes("chat server starting"));
    await reader.cancel();
  } catch {
    server.kill("SIGTERM");
  }

  return server;
}

Deno.test({
  name: "[examples/chat] GET / should serve html",
  sanitizeResources: false, // TODO(@crowlKats): re-enable once https://github.com/denoland/deno/pull/14686 lands
  async fn() {
    const server = await startServer();
    const resp = await fetch("http://127.0.0.1:8080/");
    assertEquals(resp.status, 200);
    assertEquals(resp.headers.get("content-type"), "text/html");
    const html = await resp.text();
    assert(html.includes("ws chat example"), "body is ok");
    server.kill("SIGTERM");
    await server.status;
  },
});

Deno.test({
  name: "[examples/chat] GET /ws should upgrade conn to ws",
  sanitizeResources: false, // TODO(@crowlKats): re-enable once https://github.com/denoland/deno/pull/14686 lands
  async fn() {
    const server = await startServer();
    const ws = new WebSocket("ws://127.0.0.1:8080/ws");
    await new Promise<void>((resolve) => {
      ws.onmessage = (message) => {
        assertEquals(message.data, "Connected: [1]");
        ws.onmessage = (message) => {
          assertEquals(message.data, "[1]: Hello");
          ws.close();
        };
        ws.send("Hello");
      };
      ws.onclose = () => resolve();
    });
    server.kill("SIGTERM");
    await server.status;
  },
});
