// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertInstanceOf } from "../testing/asserts.ts";
import { delay } from "../async/delay.ts";
import { deferred } from "../async/deferred.ts";
import { fromFileUrl, join } from "./path.ts";
import { serveTls } from "../http/server.ts";
import * as tls from "./tls.ts";
import * as net from "./net.ts";
import * as stream from "./stream.ts";

const tlsTestdataDir = fromFileUrl(
  new URL("../http/testdata/tls", import.meta.url),
);
const keyFile = join(tlsTestdataDir, "localhost.key");
const certFile = join(tlsTestdataDir, "localhost.crt");
const key = await Deno.readTextFile(keyFile);
const cert = await Deno.readTextFile(certFile);
const rootCaCert = await Deno.readTextFile(join(tlsTestdataDir, "RootCA.pem"));

Deno.test("tls.connect makes tls connection", async () => {
  const ctl = new AbortController();
  const serve = serveTls(() => new Response("hello"), {
    port: 8443,
    keyFile,
    certFile,
    signal: ctl.signal,
  });

  await delay(200);

  const conn = tls.connect({
    port: 8443,
    host: "localhost",
    secureContext: {
      ca: rootCaCert,
    },
  });

  conn.write(`GET / HTTP/1.1
Host: localhost
Connection: close

`);
  conn.on("data", (chunk) => {
    const text = new TextDecoder().decode(chunk);
    assertEquals(text, "hello");
  });
  conn.on("end", () => {
    ctl.abort();
  });

  await serve;
});

Deno.test("tls.createServer creates a TLS server", async () => {
  const p = deferred();
  const server = tls.createServer(
    { hostname: "localhost", key, cert },
    (socket: net.Socket) => {
      socket.write("welcome!\n");
      socket.setEncoding("utf8");
      socket.pipe(socket);
    },
  );
  server.listen(8443, async () => {
    const conn = await Deno.connectTls({
      hostname: "localhost",
      port: 8443,
      caCerts: [rootCaCert],
    });

    const buf = new Uint8Array(100);
    await Deno.read(conn.rid, buf);
    let text: string;
    text = new TextDecoder().decode(buf);
    assertEquals(text.replaceAll("\0", ""), "welcome!\n");
    buf.fill(0);

    Deno.write(conn.rid, new TextEncoder().encode("hey\n"));
    await Deno.read(conn.rid, buf);
    text = new TextDecoder().decode(buf);
    assertEquals(text.replaceAll("\0", ""), "hey\n");
    buf.fill(0);

    Deno.write(conn.rid, new TextEncoder().encode("goodbye\n"));
    await Deno.read(conn.rid, buf);
    text = new TextDecoder().decode(buf);
    assertEquals(text.replaceAll("\0", ""), "goodbye\n");

    Deno.close(conn.rid);
    server.close();
    p.resolve();
  });
  await p;
});

Deno.test("tlssocket._handle._parentWrap is set", () => {
  // Note: This feature is used in popular 'http2-wrapper' module
  // https://github.com/szmarczak/http2-wrapper/blob/51eeaf59ff9344fb192b092241bfda8506983620/source/utils/js-stream-socket.js#L6
  const parentWrap =
    // deno-lint-ignore no-explicit-any
    (new tls.TLSSocket(new stream.PassThrough(), {})._handle as any)!
      ._parentWrap;
  assertInstanceOf(parentWrap, stream.PassThrough);
});
