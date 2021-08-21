// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import {
  listenAndServe,
  listenAndServeTls,
  serve,
  Server,
  ServerRequest,
} from "./native_server.ts";
import { mockConn as createMockConn } from "./_mock_conn.ts";
import { dirname, fromFileUrl, join, resolve } from "../path/mod.ts";
import { readAll, writeAll } from "../io/util.ts";
import { deferred, delay } from "../async/mod.ts";
import {
  assert,
  assertEquals,
  assertThrows,
  assertThrowsAsync,
  unreachable,
} from "../testing/asserts.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const testdataDir = resolve(moduleDir, "testdata");

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
  conn: Deno.Conn;
  #closed = false;
  #rejectionError?: Error;

  constructor(conn: Deno.Conn, rejectionError?: Error) {
    this.conn = conn;
    this.#rejectionError = rejectionError;
  }

  get addr(): Deno.Addr {
    return this.conn.localAddr;
  }

  get rid(): number {
    return 4505;
  }

  async accept(): Promise<Deno.Conn> {
    await delay(0);

    return typeof this.#rejectionError !== "undefined"
      ? Promise.reject(this.#rejectionError)
      : Promise.resolve(this.conn);
  }

  close(): void {
    this.#closed = true;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<Deno.Conn> {
    while (true) {
      if (this.#closed) {
        break;
      }

      await delay(0);

      if (typeof this.#rejectionError !== "undefined") {
        throw this.#rejectionError;
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

Deno.test("Server should expose whether it is closed", () => {
  const handler = () => new Response();
  const server = new Server({ handler });

  assertEquals(server.closed, false);

  server.close();
  assertEquals(server.closed, true);
});

Deno.test("Server.close should throw an error if the server is already closed", async () => {
  const handler = () => new Response();
  const server = new Server({ handler });
  server.close();

  await assertThrows(
    () => server.close(),
    Deno.errors.Http,
    "Server closed",
  );
});

Deno.test("Server.serve should throw an error if the server is already closed", async () => {
  const handler = () => new Response();
  const server = new Server({ handler });
  server.close();

  const listenOptions = {
    hostname: "localhost",
    port: 4505,
  };
  const listener = Deno.listen(listenOptions);

  await assertThrowsAsync(
    () => server.serve(listener),
    Deno.errors.Http,
    "Server closed",
  );

  try {
    listener.close();
  } catch (error) {
    if (!(error instanceof Deno.errors.BadResource)) {
      throw error;
    }
  }
});

Deno.test("Server.listenAndServe should throw an error if the server is already closed", async () => {
  const handler = () => new Response();
  const server = new Server({ handler });
  server.close();

  await assertThrowsAsync(
    () => server.listenAndServe(),
    Deno.errors.Http,
    "Server closed",
  );
});

Deno.test("Server.listenAndServeTls should throw an error if the server is already closed", async () => {
  const handler = () => new Response();
  const server = new Server({ handler });
  server.close();

  const certFile = join(testdataDir, "tls/localhost.crt");
  const keyFile = join(testdataDir, "tls/localhost.key");

  await assertThrowsAsync(
    () => server.listenAndServeTls(certFile, keyFile),
    Deno.errors.Http,
    "Server closed",
  );
});

Deno.test("serve should not throw if abort when the server is already closed", () => {
  const listenOptions = {
    hostname: "localhost",
    port: 4505,
  };
  const listener = Deno.listen(listenOptions);
  const handler = () => new Response();
  const abortController = new AbortController();

  serve(listener, handler, { signal: abortController.signal });

  abortController.abort();

  try {
    abortController.abort();
  } catch {
    unreachable();
  }
});

Deno.test("listenAndServe should not throw if abort when the server is already closed", () => {
  const addr = "localhost:4505";
  const handler = () => new Response();
  const abortController = new AbortController();

  listenAndServe(addr, handler, { signal: abortController.signal });

  abortController.abort();

  try {
    abortController.abort();
  } catch {
    unreachable();
  }
});

Deno.test("listenAndServeTls should not throw if abort when the server is already closed", () => {
  const addr = "localhost:4505";
  const certFile = join(testdataDir, "tls/localhost.crt");
  const keyFile = join(testdataDir, "tls/localhost.key");
  const handler = () => new Response();
  const abortController = new AbortController();

  listenAndServeTls(addr, certFile, keyFile, handler, {
    signal: abortController.signal,
  });

  abortController.abort();

  try {
    abortController.abort();
  } catch {
    unreachable();
  }
});

["get", "post", "put", "delete", "patch"].forEach(
  (method) => {
    Deno.test(`Server.serve should handle ${method} requests`, async () => {
      const listenOptions = {
        hostname: "localhost",
        port: 4505,
      };
      const listener = Deno.listen(listenOptions);

      const url = `http://${listenOptions.hostname}:${listenOptions.port}`;
      const status = 418;
      const body = `${method}: ${url} - Hello Deno on HTTP!`;

      const handler = () => new Response(body, { status });

      const server = new Server({ handler });
      server.serve(listener);

      try {
        const response = await fetch(url, { method });
        assertEquals(await response.text(), body);
        assertEquals(response.status, status);
      } catch {
        unreachable();
      } finally {
        server.close();
      }
    });

    Deno.test(`Server.listenAndServe should handle ${method} requests`, async () => {
      const addr = "localhost:4505";
      const url = `http://${addr}`;
      const status = 418;
      const body = `${method}: ${url} - Hello Deno on HTTP!`;

      const handler = () => new Response(body, { status });

      const server = new Server({ addr, handler });
      server.listenAndServe();

      try {
        const response = await fetch(url, { method });
        assertEquals(await response.text(), body);
        assertEquals(response.status, status);
      } catch {
        unreachable();
      } finally {
        server.close();
      }
    });

    Deno.test({
      // PermissionDenied: Permission denied (os error 13)
      ignore: true,
      name:
        `Server.listenAndServe should handle ${method} requests on the default HTTP port`,
      fn: async () => {
        const addr = "localhost";
        const url = `http://${addr}`;
        const status = 418;
        const body = `${method}: ${url} - Hello Deno on HTTP!`;

        const handler = () => new Response(body, { status });

        const server = new Server({ addr, handler });
        server.listenAndServe();

        try {
          const response = await fetch(url, { method });
          assertEquals(await response.text(), body);
          assertEquals(response.status, status);
        } catch {
          unreachable();
        } finally {
          server.close();
        }
      },
    });

    Deno.test(`Server.listenAndServeTls should handle ${method} requests`, async () => {
      const hostname = "localhost";
      const port = 4505;
      const addr = `${hostname}:${port}`;
      const certFile = join(testdataDir, "tls/localhost.crt");
      const keyFile = join(testdataDir, "tls/localhost.key");
      const url = `http://${addr}`;
      const status = 418;
      const body = `${method}: ${url} - Hello Deno on HTTPS!`;

      const handler = () => new Response(body, { status });

      const server = new Server({ addr, handler });
      server.listenAndServeTls(certFile, keyFile);

      try {
        // Invalid certificate, connection should throw on first read or write
        // but should not crash the server.
        const badConn = await Deno.connectTls({
          hostname,
          port,
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
          hostname,
          port,
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
          response.includes(`HTTP/1.0 ${status}`),
          "Status code not correct",
        );
        assert(
          response.includes(body),
          "Response body not correct",
        );
      } finally {
        server.close();
      }
    });

    Deno.test({
      ignore: true,
      name:
        `Server.listenAndServeTls should handle ${method} requests on the default HTTPS port`,
      fn: async () => {
        const hostname = "localhost";
        const port = 443;
        const addr = hostname;
        const certFile = join(testdataDir, "tls/localhost.crt");
        const keyFile = join(testdataDir, "tls/localhost.key");
        const url = `http://${addr}`;
        const status = 418;
        const body = `${method}: ${url} - Hello Deno on HTTPS!`;

        const handler = () => new Response(body, { status });

        const server = new Server({ addr, handler });
        server.listenAndServeTls(certFile, keyFile);

        try {
          // Invalid certificate, connection should throw on first read or write
          // but should not crash the server.
          const badConn = await Deno.connectTls({
            hostname,
            port,
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
            hostname,
            port,
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
            response.includes(`HTTP/1.0 ${status}`),
            "Status code not correct",
          );
          assert(
            response.includes(body),
            "Response body not correct",
          );
        } finally {
          server.close();
        }
      },
    });

    Deno.test(`serve should handle ${method} requests`, async () => {
      const listenOptions = {
        hostname: "localhost",
        port: 4505,
      };
      const listener = Deno.listen(listenOptions);

      const url = `http://${listenOptions.hostname}:${listenOptions.port}`;
      const status = 418;
      const body = `${method}: ${url} - Hello Deno on HTTP!`;

      const handler = () => new Response(body, { status });
      const abortController = new AbortController();

      serve(listener, handler, { signal: abortController.signal });

      try {
        const response = await fetch(url, { method });
        assertEquals(await response.text(), body);
        assertEquals(response.status, status);
      } catch {
        unreachable();
      } finally {
        abortController.abort();
      }
    });

    Deno.test(`listenAndServe should handle ${method} requests`, async () => {
      const addr = "localhost:4505";
      const url = `http://${addr}`;
      const status = 418;
      const body = `${method}: ${url} - Hello Deno on HTTP!`;

      const handler = () => new Response(body, { status });
      const abortController = new AbortController();

      listenAndServe(addr, handler, { signal: abortController.signal });

      try {
        const response = await fetch(url, { method });
        assertEquals(await response.text(), body);
        assertEquals(response.status, status);
      } catch {
        unreachable();
      } finally {
        abortController.abort();
      }
    });

    Deno.test(`Server.listenAndServeTls should handle ${method} requests`, async () => {
      const hostname = "localhost";
      const port = 4505;
      const addr = `${hostname}:${port}`;
      const certFile = join(testdataDir, "tls/localhost.crt");
      const keyFile = join(testdataDir, "tls/localhost.key");
      const url = `http://${addr}`;
      const status = 418;
      const body = `${method}: ${url} - Hello Deno on HTTPS!`;

      const handler = () => new Response(body, { status });
      const abortController = new AbortController();

      listenAndServeTls(addr, certFile, keyFile, handler, {
        signal: abortController.signal,
      });

      try {
        // Invalid certificate, connection should throw on first read or write
        // but should not crash the server.
        const badConn = await Deno.connectTls({
          hostname,
          port,
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
          hostname,
          port,
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
          response.includes(`HTTP/1.0 ${status}`),
          "Status code not correct",
        );
        assert(
          response.includes(body),
          "Response body not correct",
        );
      } finally {
        abortController.abort();
      }
    });
  },
);

Deno.test("Server should not reject when the listener is closed (though the server will continually try and fail to accept connections on the listener until it is closed)", async () => {
  const listener = Deno.listen({ port: 4505 });
  const handler = () => new Response();
  const server = new Server({ handler });
  listener.close();
  server.serve(listener);
  await delay(10);
  server.close();
});

Deno.test("Server should not reject when there is a tls handshake with tcp corruption", async () => {
  const conn = createMockConn();
  const error = new Deno.errors.InvalidData("test-tcp-corruption-error");
  const listener = new MockListener(conn, error);
  const handler = () => new Response();
  const server = new Server({ handler });
  server.serve(listener);
  await delay(10);
  server.close();
});

Deno.test("Server should not reject when the tls session is aborted", async () => {
  const conn = createMockConn();
  const error = new Deno.errors.ConnectionReset(
    "test-tls-session-aborted-error",
  );
  const listener = new MockListener(conn, error);
  const handler = () => new Response();
  const server = new Server({ handler });
  server.serve(listener);
  await delay(10);
  server.close();
});

Deno.test("Server should not reject when the socket is closed", async () => {
  const conn = createMockConn();
  const error = new Deno.errors.NotConnected("test-socket-closed-error");
  const listener = new MockListener(conn, error);
  const handler = () => new Response();
  const server = new Server({ handler });
  server.serve(listener);
  await delay(10);
  server.close();
});

Deno.test("Server should reject if the listener throws an unexpected error accepting a connection", () => {
  const conn = createMockConn();
  const error = new Error("test-unexpected-error");
  const listener = new MockListener(conn, error);
  const handler = () => new Response();
  const server = new Server({ handler });
  assertThrowsAsync(() => server.serve(listener), Error, error.message);
});

Deno.test("Server should not reject when the connection is closed before the message is complete", async () => {
  const listenOptions = {
    hostname: "localhost",
    port: 4505,
  };
  const listener = Deno.listen(listenOptions);

  const onRequest = deferred();
  const postRespondWith = deferred();

  const handler = async () => {
    onRequest.resolve();

    await delay(0);

    try {
      return new Response("test-response");
    } finally {
      postRespondWith.resolve();
    }
  };

  const server = new Server({ handler });
  server.serve(listener);

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
});

Deno.test("Server should not reject when the handler throws", async () => {
  const listenOptions = {
    hostname: "localhost",
    port: 4505,
  };
  const listener = Deno.listen(listenOptions);

  const postRespondWith = deferred();

  const handler = () => {
    try {
      throw new Error("test-error");
    } finally {
      postRespondWith.resolve();
    }
  };

  const server = new Server({ handler });
  server.serve(listener);

  const conn = await Deno.connect(listenOptions);

  await writeAll(
    conn,
    new TextEncoder().encode(
      `GET / HTTP/1.0\r\n\r\n`,
    ),
  );

  await postRespondWith;
  conn.close();
  server.close();
});

Deno.test("Server should be able to parse IPV6 addresses", async () => {
  const addr = "[::1]:4505";
  const url = `http://${addr}`;
  const method = "GET";
  const status = 418;
  const body = `${method}: ${url} - Hello Deno on HTTP!`;

  const handler = () => new Response(body, { status });
  const abortController = new AbortController();

  listenAndServe(addr, handler, { signal: abortController.signal });

  try {
    const response = await fetch(url, { method });
    assertEquals(await response.text(), body);
    assertEquals(response.status, status);
  } catch {
    unreachable();
  } finally {
    abortController.abort();
  }
});
