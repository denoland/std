// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import * as net from "./net.ts";
import { assertEquals } from "../testing/asserts.ts";
import { deferred } from "../async/deferred.ts";
import * as path from "./path.ts";
import * as http from "./http.ts";
import { assert } from "../_util/asserts.ts";

Deno.test("[node/net] close event emits after error event", async () => {
  const socket = net.createConnection(27009, "doesnotexist");
  const events: ("error" | "close")[] = [];
  const errorEmitted = deferred();
  const closeEmitted = deferred();
  socket.once("error", () => {
    events.push("error");
    errorEmitted.resolve();
  });
  socket.once("close", () => {
    events.push("close");
    closeEmitted.resolve();
  });
  await Promise.all([errorEmitted, closeEmitted]);

  // `error` happens before `close`
  assertEquals(events, ["error", "close"]);
});

Deno.test("[node/net] the port is available immediately after close callback", async () => {
  const p = deferred();

  // This simulates what get-port@5.1.1 does.
  const getAvailablePort = (port: number) =>
    new Promise((resolve, reject) => {
      const server = net.createServer();
      server.on("error", reject);
      server.listen({ port }, () => {
        // deno-lint-ignore no-explicit-any
        const { port } = server.address() as any;
        server.close(() => {
          resolve(port);
        });
      });
    });

  const port = await getAvailablePort(5555);

  const httpServer = http.createServer();
  httpServer.on("error", (e) => p.reject(e));
  httpServer.listen(port, () => {
    httpServer.close(() => p.resolve());
  });
  await p;
});

Deno.test("[node/net] net.connect().unref() works", async () => {
  const ctl = new AbortController();
  await Deno.serve(() => {
    return new Response("hello");
  }, {
    signal: ctl.signal,
    onListen: async () => {
      const { stdout, stderr } = await new Deno.Command(Deno.execPath(), {
        args: [
          "eval",
          `
            import * as net from "./net.ts";
            const socket = net.connect(9000, () => {
              console.log("connected");
              socket.unref();
              socket.on("data", (data) => console.log(data.toString()));
              socket.write("GET / HTTP/1.1\\n\\n");
            });
          `,
        ],
        cwd: path.dirname(path.fromFileUrl(new URL(import.meta.url))),
      }).output();
      if (stderr.length > 0) {
        console.log(new TextDecoder().decode(stderr));
      }
      assertEquals(new TextDecoder().decode(stdout), "connected\n");
      ctl.abort();
    },
  });
});

Deno.test({
  name: "[node/net] throws permission error instead of unknown error",
  permissions: "none",
  fn: () => {
    try {
      const s = new net.Server();
      s.listen(3000);
    } catch (e) {
      assert(e instanceof Deno.errors.PermissionDenied);
    }
  },
});
