// Copyright 2010 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// Ported from
// https://github.com/golang/go/blob/master/src/net/http/responsewrite_test.go

import { Buffer, copy } from "deno";
import { assert, assertEqual, runTests, test } from "../testing/mod.ts";
import {
  createServer,
  readRequest,
  ServerResponse,
  writeResponse
} from "./server.ts";
import { encode } from "../strings/strings.ts";
import { StringReader } from "../io/readers.ts";
import { StringWriter } from "../io/writers.ts";
import { defer } from "../async/deferred.ts";

interface ResponseTest {
  response: ServerResponse;
  raw: string;
}

const responseTests: ResponseTest[] = [
  // Default response
  {
    response: {},
    raw: "HTTP/1.1 200 OK\r\n" + "\r\n"
  },
  // HTTP/1.1, chunked coding; empty trailer; close
  {
    response: {
      status: 200,
      body: new Buffer(encode("abcdef"))
    },

    raw:
      "HTTP/1.1 200 OK\r\n" +
      "transfer-encoding: chunked\r\n\r\n" +
      "6\r\nabcdef\r\n0\r\n\r\n"
  }
];

test(async function httpWriteResponse() {
  for (const { raw, response } of responseTests) {
    const buf = new Buffer();
    await writeResponse(buf, response);
    assertEqual(buf.toString(), raw);
  }
});

test(async function httpReadRequest() {
  const body = "0123456789";
  const lines = [
    "GET /index.html?deno=land HTTP/1.1",
    "Host: deno.land",
    "Content-Type: text/plain",
    `Content-Length: ${body.length}`,
    "\r\n"
  ];
  let msg = lines.join("\r\n");
  msg += body;
  const req = await readRequest(new StringReader(`${msg}`), null);
  assert.equal(req.url, "/index.html?deno=land");
  assert.equal(req.method, "GET");
  assert.equal(req.proto, "HTTP/1.1");
  assert.equal(req.headers.get("host"), "deno.land");
  assert.equal(req.headers.get("content-type"), "text/plain");
  assert.equal(req.headers.get("content-length"), `${body.length}`);
  const w = new StringWriter();
  await copy(w, req.body);
  assert.equal(w.toString(), body);
});

test(async function httpReadRequestChunkedBody() {
  const lines = [
    "GET /index.html?deno=land HTTP/1.1",
    "Host: deno.land",
    "Content-Type: text/plain",
    `Transfer-Encoding: chunked`,
    "\r\n"
  ];
  const hd = lines.join("\r\n");
  const buf = new Buffer();
  await buf.write(encode(hd));
  await buf.write(encode("4\r\ndeno\r\n"));
  await buf.write(encode("5\r\n.land\r\n"));
  await buf.write(encode("0\r\n\r\n"));
  const req = await readRequest(buf, null);
  assert.equal(req.url, "/index.html?deno=land");
  assert.equal(req.method, "GET");
  assert.equal(req.proto, "HTTP/1.1");
  assert.equal(req.headers.get("host"), "deno.land");
  assert.equal(req.headers.get("content-type"), "text/plain");
  assert.equal(req.headers.get("transfer-encoding"), `chunked`);
  const dest = new Buffer();
  await copy(dest, req.body);
  assert.equal(dest.toString(), "deno.land");
});

test(async function httpServer() {
  const server = createServer();
  server.handle("/", async req => {
    await req.respond({
      status: 200,
      body: encode("ok")
    });
  });
  server.handle("/foo/:id", async req => {
    await req.respond({
      status: 200,
      headers: new Headers({
        "content-type": "application/json"
      }),
      body: encode(JSON.stringify({ id: req.params.id }))
    });
  });
  const cancel = defer<void>();
  try {
    server.listen("127.0.0.1:8080", cancel);
    const res1 = await fetch("http://127.0.0.1:8080");
    const text = await res1.body.text();
    assert.equal(res1.status, 200);
    assert.equal(text, "ok");
    const res2 = await fetch("http://127.0.0.1:8080/foo/123");
    const json = await res2.body.json();
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get("content-type"), "application/json");
    assert.equal(json["id"], "123");
  } finally {
    cancel.resolve();
  }
});
