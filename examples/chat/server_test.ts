// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../../testing/asserts.ts";
import { delay } from "../../async/delay.ts";
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
  });
  try {
    const r = server.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
      new TextLineStream(),
    );
    const reader = r.getReader();
    const res = await reader.read();
    assert(!res.done && res.value.includes("chat server starting"));
    reader.releaseLock();
  } catch {
    await server.status;
  }

  return server;
}

Deno.test({
  name: "[examples/chat] GET / should serve html",
  async fn() {
    const server = await startServer();
    try {
      const resp = await fetch("http://127.0.0.1:8080/");
      assertEquals(resp.status, 200);
      assertEquals(resp.headers.get("content-type"), "text/html");
      const html = await resp.text();
      assert(html.includes("ws chat example"), "body is ok");
    } finally {
      await server.status;
    }
    await delay(10);
  },
});

Deno.test({
  name: "[examples/chat] GET /ws should upgrade conn to ws",
  async fn() {
    const server = await startServer();
    let ws: WebSocket;
    try {
      ws = new WebSocket("ws://127.0.0.1:8080/ws");
      await new Promise<void>((resolve) => {
        ws.onmessage = (message) => {
          assertEquals(message.data, "Connected: [1]");
          ws.onmessage = (message) => {
            assertEquals(message.data, "[1]: Hello");
            ws.close();
            resolve();
          };
          ws.send("Hello");
        };
      });
    } catch (err) {
      console.log(err);
    } finally {
      await server.status;
    }
  },
});
