// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import EventEmitter from "./events.ts";
import http, { type RequestOptions } from "./http.ts";
import { ERR_SERVER_NOT_RUNNING } from "./internal/errors.ts";
import { assert, assertEquals } from "../testing/asserts.ts";
import { deferred } from "../async/deferred.ts";

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

Deno.test("[node/http] send request with non-chunked body", async () => {
  const promise = deferred<void>();
  const server = http.createServer((req, res) => {
    const responseBody: string[] = [];
    req.on("data", (chunk) => {
      responseBody.push(chunk.toString());
    });
    req.on("close", () => {
      const headers = Object.fromEntries(
        Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), v]),
      );
      if (
        responseBody[0] === "hello world" &&
        headers["content-length"] === "11" &&
        /(?:^|\W)chunked(?:$|\W)/i.test(headers["transfer-encoding"]) === false
      ) {
        res.writeHead(200, { "Content-Type": "text/plain" });
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
      }
      res.end("ok");
    });
  });
  server.listen(() => {
    const opts: RequestOptions = {
      host: "localhost",
      port: server.address().port,
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": "11",
      },
    };
    const req = http.request(opts, (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        server.close();
      });
      assertEquals(res.statusCode, 200);
    });
    req.write("hello ");
    req.write("world");
    req.end();
  });
  server.on("close", () => {
    promise.resolve();
  });
  await promise;
});

Deno.test("[node/http] send request with chunked body", async () => {
  const promise = deferred<void>();
  const server = http.createServer((req, res) => {
    const responseBody: string[] = [];
    req.on("data", (chunk) => {
      responseBody.push(chunk.toString());
    });
    req.on("close", () => {
      const headers = Object.fromEntries(
        Object.entries(req.headers).map(([k, v]) => [k.toLowerCase(), v]),
      );
      if (
        responseBody[0] === "hello " &&
        responseBody[1] === "world" &&
        headers["content-length"] === undefined &&
        /(?:^|\W)chunked(?:$|\W)/i.test(headers["transfer-encoding"])
      ) {
        res.writeHead(200, { "Content-Type": "text/plain" });
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
      }
      res.end("ok");
    });
  });
  server.listen(() => {
    const opts: RequestOptions = {
      host: "localhost",
      port: server.address().port,
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    };
    const req = http.request(opts, (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        server.close();
      });
      assertEquals(res.statusCode, 200);
    });
    req.write("hello ");
    req.write("world");
    req.end();
  });
  server.on("close", () => {
    promise.resolve();
  });
  await promise;
});
