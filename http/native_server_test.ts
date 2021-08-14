// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Server, ServerRequest } from "./native_server.ts";
import { mockConn as createMockConn } from "./_mock_conn.ts";
import { dirname, fromFileUrl, join, resolve } from "../path/mod.ts";
import { readAll, writeAll } from "../io/util.ts";
import { deferred } from "../async/mod.ts";
import {
  assert,
  assertEquals,
  assertThrowsAsync,
  unreachable,
} from "../testing/asserts.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");

const nextTick = () => new Promise((resolve) => setTimeout(resolve));

class MockRequestEvent implements Deno.RequestEvent {
  calls: Response[] = [];
  request: Request;
  #rejectionError?: Error;

  constructor(input: RequestInfo, init?: RequestInit, rejectionError?: Error) {
    this.request = new Request(input, init);
    this.#rejectionError = rejectionError;
  }

  async respondWith(response: Response | Promise<Response>): Promise<void> {
    this.calls.push(await response);

    return typeof this.#rejectionError !== "undefined"
      ? Promise.reject(this.#rejectionError)
      : Promise.resolve();
  }
}

class MockListener implements Deno.Listener {
  closed = false;

  constructor(public conn: Deno.Conn) {}

  get addr(): Deno.Addr {
    return this.conn.localAddr;
  }

  get rid(): number {
    return 8080;
  }

  accept(): Promise<Deno.Conn> {
    return Promise.resolve(this.conn);
  }

  close(): void {
    this.closed = true;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<Deno.Conn> {
    while (true) {
      if (this.closed) {
        break;
      }

      yield this.conn;
    }
  }
}

Deno.test("ServerRequest should expose the underlying Request through a getter", async () => {
  const mockRequestEvent = new MockRequestEvent("http://0.0.0.0:4505");
  const request = new ServerRequest(mockRequestEvent, createMockConn());

  assertEquals(request.request, mockRequestEvent.request);

  await request.respondWith(new Response());
});

Deno.test("ServerRequest should expose the underlying ConnInfo through a getter", async () => {
  const mockRequestEvent = new MockRequestEvent("http://0.0.0.0:4505");
  const mockConn = createMockConn();
  const expectedConnInfo = {
    localAddr: mockConn.localAddr,
    remoteAddr: mockConn.remoteAddr,
  };

  const request = new ServerRequest(mockRequestEvent, mockConn);

  assertEquals(request.connInfo, expectedConnInfo);

  await request.respondWith(new Response());
});

Deno.test("ServerRequest should expose a done promise getter which resolves when the response has been sent", async () => {
  const mockRequestEvent = new MockRequestEvent("http://0.0.0.0:4505");
  const request = new ServerRequest(mockRequestEvent, createMockConn());

  let done = false;
  request.done.then(() => done = true);

  assertEquals(done, false);

  await request.respondWith(new Response());
  assertEquals(done, true);
});

Deno.test("ServerRequest should delegate the responding to the underlying requestEvent", async () => {
  const mockRequestEvent = new MockRequestEvent("http://0.0.0.0:4505");
  const mockResponse = new Response("test-response", { status: 200 });

  const request = new ServerRequest(mockRequestEvent, createMockConn());
  await request.respondWith(mockResponse);

  assertEquals(mockRequestEvent.calls[0], mockResponse);
});

Deno.test("ServerRequest should reject with a BadResource error if the response has already been sent", async () => {
  const mockRequestEvent = new MockRequestEvent("http://0.0.0.0:4505");
  const mockResponse = new Response("test-response", { status: 200 });

  const request = new ServerRequest(mockRequestEvent, createMockConn());
  await request.respondWith(mockResponse);

  try {
    await request.respondWith(mockResponse);

    unreachable();
  } catch (error) {
    assertEquals(error, new Deno.errors.BadResource("Response already sent."));
  }
});

Deno.test("ServerRequest should reject if the underlying request event rejects (e.g. underlying connection is closed)", async () => {
  const mockError = new Error("test-error");
  const mockRequestEvent = new MockRequestEvent(
    "http://0.0.0.0:4505",
    undefined,
    mockError,
  );
  const mockResponse = new Response("test-response", { status: 200 });

  const request = new ServerRequest(mockRequestEvent, createMockConn());

  try {
    await request.respondWith(mockResponse);

    unreachable();
  } catch (error) {
    assertEquals(error, mockError);
  }
});

Deno.test("Server should expose the underlying listener", () => {
  const mockListener = new MockListener(createMockConn());
  const server = new Server(mockListener);

  assertEquals(server.listener, mockListener);
});

Deno.test("Server should close the underlying listener on close", () => {
  const mockListener = new MockListener(createMockConn());
  const server = new Server(mockListener);

  server.close();

  assertEquals(mockListener.closed, true);
});

["get", "post", "put", "delete", "patch"].forEach(
  (method) => {
    Deno.test(`Server should construct a new HTTP Server capable of handling ${method} requests and gracefully closing afterwards`, async () => {
      const listenOptions = {
        hostname: "localhost",
        port: 4505,
      };
      const listener = Deno.listen(listenOptions);
      const url = `http://${listenOptions.hostname}:${listenOptions.port}`;

      const expectedStatus = 418;
      const expectedBody = `${method}: ${url} - Hello Deno on HTTP!`;

      const server = new Server(listener);

      (async () => {
        for await (const requestEvent of server) {
          const response = new Response(expectedBody, {
            status: expectedStatus,
          });

          await requestEvent.respondWith(response);
        }
      })();

      try {
        const response = await fetch(url, { method });
        const body = await response.text();

        assertEquals(body, expectedBody);
        assertEquals(response.status, expectedStatus);
      } catch (_) {
        unreachable();
      } finally {
        server.close();
      }
    });
  },
);

["get", "post", "put", "delete", "patch"].forEach(
  (method) => {
    Deno.test(`Server should construct a new HTTPS Server capable of handling ${method} requests and gracefully closing afterwards`, async () => {
      const listenTlsOptions = {
        hostname: "localhost",
        port: 4505,
        certFile: join(testdataDir, "tls/localhost.crt"),
        keyFile: join(testdataDir, "tls/localhost.key"),
      };

      const listener = Deno.listenTls(listenTlsOptions);
      const url =
        `https://${listenTlsOptions.hostname}:${listenTlsOptions.port}`;

      const expectedStatus = 418;
      const expectedBody = `${method}: ${url} - Hello Deno on HTTPS!`;

      const server = new Server(listener);

      (async () => {
        for await (const requestEvent of server) {
          const response = new Response(expectedBody, {
            status: expectedStatus,
          });

          await requestEvent.respondWith(response);
        }
      })();

      try {
        // Invalid certificate, connection should throw on first read or write
        // but should not crash the server.
        const badConn = await Deno.connectTls({
          hostname: listenTlsOptions.hostname,
          port: listenTlsOptions.port,
          // missing certFile
        });

        await assertThrowsAsync(
          () => badConn.read(new Uint8Array(1)),
          Deno.errors.InvalidData,
          "invalid certificate: UnknownIssuer",
          "Read with missing certFile didn't throw an InvalidData error when it should have.",
        );

        badConn.close();

        // Valid request after invalid
        const conn = await Deno.connectTls({
          hostname: listenTlsOptions.hostname,
          port: listenTlsOptions.port,
          certFile: join(testdataDir, "tls/RootCA.pem"),
        });

        await writeAll(
          conn,
          new TextEncoder().encode(
            `${method.toUpperCase()} / HTTP/1.0\r\n\r\n`,
          ),
        );

        const response = new TextDecoder().decode(await readAll(conn));

        conn.close();

        assert(
          response.includes("HTTP/1.0 418 I'm a teapot"),
          "Status code not correct",
        );
        assert(
          response.includes(expectedBody),
          "Response body not correct",
        );
      } finally {
        server.close();
      }
    });
  },
);

Deno.test("Server should not reject when waiting for the request to be processed (i.e. `await serverRequest.done`)", async () => {
  const listenOptions = {
    hostname: "localhost",
    port: 4505,
  };
  const listener = Deno.listen(listenOptions);
  const server = new Server(listener);

  const errors: Error[] = [];
  const onRequest = deferred();
  const postRespondWith = deferred();

  (async () => {
    for await (const requestEvent of server) {
      onRequest.resolve();

      await nextTick();

      // Can expect the requestEvent.respondWith() to reject
      // but not the server itself during iteration.
      await requestEvent
        .respondWith(new Response("test-response"))
        .catch((error: Error) => errors.push(error));

      postRespondWith.resolve();
    }
  })();

  const conn = await Deno.connect(listenOptions);

  await writeAll(
    conn,
    new TextEncoder().encode(
      `GET / HTTP/1.0\r\n\r\n`,
    ),
  );

  await onRequest;
  conn.close();

  await postRespondWith;
  server.close();

  assertEquals(errors.length, 1);
});
