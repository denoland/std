// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import EventEmitter from "./events.ts";
import http from "./http.ts";
import { ERR_SERVER_NOT_RUNNING } from "./internal/errors.ts";
import { assert, assertEquals } from "../testing/asserts.ts";
import { deferred } from "../async/deferred.ts";
import { gzip } from "./zlib.ts";
import { Buffer } from "./buffer.ts";

Deno.test("[node/http listen]", async () => {
  {
    const server = http.createServer();
    assertEquals(0, EventEmitter.listenerCount(server, "request"));
  }

  {
    const server = http.createServer(() => {});
    assertEquals(1, EventEmitter.listenerCount(server, "request"));
  }

  {
    const promise = deferred<void>();
    const server = http.createServer();

    server.listen(() => {
      server.close();
    });
    server.on("close", () => {
      promise.resolve();
    });

    await promise;
  }

  {
    const promise = deferred<void>();
    const server = http.createServer();

    server.listen().on("listening", () => {
      server.close();
    });
    server.on("close", () => {
      promise.resolve();
    });

    await promise;
  }

  for (const port of [0, -0, 0.0, "0", null, undefined]) {
    const promise = deferred<void>();
    const server = http.createServer();

    server.listen(port, () => {
      server.close();
    });
    server.on("close", () => {
      promise.resolve();
    });

    await promise;
  }
});

Deno.test("[node/http close]", async () => {
  {
    const promise1 = deferred<void>();
    const promise2 = deferred<void>();
    // Node quirk: callback gets exception object, event listener does not.
    const server = http.createServer().close((err) => {
      assert(err instanceof ERR_SERVER_NOT_RUNNING);
      promise1.resolve();
    });
    server.on("close", (err) => {
      assertEquals(err, undefined);
      promise2.resolve();
    });
    server.on("listening", () => {
      throw Error("unreachable");
    });
    await promise1;
    await promise2;
  }

  {
    const promise1 = deferred<void>();
    const promise2 = deferred<void>();
    const server = http.createServer().listen().close((err) => {
      assertEquals(err, undefined);
      promise1.resolve();
    });
    server.on("close", (err) => {
      assertEquals(err, undefined);
      promise2.resolve();
    });
    server.on("listening", () => {
      throw Error("unreachable");
    });
    await promise1;
    await promise2;
  }
});

Deno.test("[node/http] chunked response", async () => {
  for (
    const body of [undefined, "", "ok"]
  ) {
    const expected = body ?? "";
    const promise = deferred<void>();

    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "transfer-encoding": "chunked" });
      res.end(body);
    });

    server.listen(async () => {
      const res = await fetch(`http://127.0.0.1:${server.address().port}/`);
      assert(res.ok);

      const actual = await res.text();
      assertEquals(actual, expected);

      server.close(() => promise.resolve());
    });

    await promise;
  }
});

Deno.test("[node/http] request default protocol", async () => {
  const promise = deferred<void>();
  const server = http.createServer((_, res) => {
    res.end("ok");
  });
  server.listen(() => {
    const req = http.request(
      { host: "localhost", port: server.address().port },
      (res) => {
        res.on("data", () => {});
        res.on("end", () => {
          server.close();
        });
        assertEquals(res.statusCode, 200);
      },
    );
    req.end();
  });
  server.on("close", () => {
    promise.resolve();
  });
  await promise;
});

Deno.test("[node/http] non-string buffer response", async () => {
  const promise = deferred<void>();
  const server = http.createServer((_, res) => {
    gzip(
      Buffer.from("a".repeat(100), "utf8"),
      {},
      (_err: Error, data: Buffer) => {
        res.setHeader("Content-Encoding", "gzip");
        res.end(data);
      },
    );
  });
  server.listen(async () => {
    const res = await fetch(`http://localhost:${server.address().port}`);
    try {
      const text = await res.text();
      assertEquals(text, "a".repeat(100));
    } catch (e) {
      server.emit("error", e);
    } finally {
      server.close();
    }
  });
  server.on("close", () => {
    promise.resolve();
  });
  await promise;
});

Deno.test("[node/http] http.IncomingMessage can be created without url", async () => {
  const message = new http.IncomingMessage(
    // adapted from https://github.com/dougmoscrop/serverless-http/blob/80bfb3e940057d694874a8b0bc12ad96d2abe7ab/lib/request.js#L7
    {
      // @ts-expect-error
      encrypted: true,
      readable: false,
      remoteAddress: "foo",
      address: () => ({ port: 443 }),
      end: Function.prototype,
      destroy: Function.prototype,
    },
  );
  message.url = "https://example.com";
});
