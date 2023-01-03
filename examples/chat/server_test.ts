// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../../testing/asserts.ts";
import { dirname, fromFileUrl, resolve } from "../../path/mod.ts";

const moduleDir = resolve(dirname(fromFileUrl(import.meta.url)));

async function startServer(): Promise<Deno.ChildProcess> {
  const server = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--allow-net",
      "--allow-read",
      "server.ts",
    ],
    cwd: moduleDir,
    stdout: "piped",
    stderr: "null",
    stdin: "null",
  });
  const child = server.spawn();
  const reader = child.stdout.getReader();

  try {
    const { value } = await reader.read();
    assert(
      value && new TextDecoder().decode(value).includes("chat server starting"),
    );
  } catch {
    await child.stdout.cancel();
  } finally {
    reader.releaseLock();
  }

  return child;
}

Deno.test({
  name: "[examples/chat] GET / should serve html",
  async fn() {
    const child = await startServer();
    try {
      const resp = await fetch("http://127.0.0.1:8080/");
      assertEquals(resp.status, 200);
      assertEquals(resp.headers.get("content-type"), "text/html");
      const html = await resp.text();
      assert(html.includes("ws chat example"), "body is ok");
    } finally {
      child.stdout.cancel();
      child.kill();
    }
    await child.status;
  },
});

Deno.test({
  name: "[examples/chat] GET /ws should upgrade conn to ws",
  async fn() {
    const child = await startServer();
    let ws: WebSocket;
    try {
      ws = new WebSocket("ws://127.0.0.1:8080/ws");
      await new Promise<void>((resolve) => {
        ws.onmessage = (message) => {
          assertEquals(message.data, "Connected: [1]");

          ws.onmessage = (message) => {
            assertEquals(message.data, "[1]: Hello");
            ws.close();
          };

          ws.send("Hello");
        };

        ws.onclose = () => {
          resolve();
        };
      });
    } catch (err) {
      console.log(err);
    } finally {
      child.stdout.cancel();
      child.kill();
    }
    await child.status;
  },
});
