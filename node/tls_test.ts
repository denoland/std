// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { delay } from "../async/delay.ts";
import { fromFileUrl, join } from "./path.ts";
import { serveTls } from "../http/server.ts";
import { connect } from "./tls.ts";

const tlsTestdataDir = fromFileUrl(
  new URL("../http/testdata/tls", import.meta.url),
);
const keyFile = join(tlsTestdataDir, "localhost.key");
const certFile = join(tlsTestdataDir, "localhost.crt");
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

  const conn = connect({
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
    console.log(text);
    assertEquals(text, "hello");
  });
  conn.on("end", () => {
    ctl.abort();
  });

  await serve;
});
