// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any

import * as https from "./https.ts";
import { serveTls } from "../http/server.ts";
import { dirname, fromFileUrl, join } from "../path/mod.ts";
import { assertEquals } from "../testing/asserts.ts";

const stdRoot = dirname(dirname(fromFileUrl(import.meta.url)));
const tlsDataDir = join(stdRoot, "http", "testdata", "tls");
const keyFile = join(tlsDataDir, "localhost.key");
const certFile = join(tlsDataDir, "localhost.crt");

Deno.test("[node/https] request makes https request", async () => {
  const controller = new AbortController();
  const signal = controller.signal;

  const serveFinish = serveTls((_req) => {
    return new Response("abcd\n".repeat(1_000));
  }, { keyFile, certFile, port: 4505, hostname: "localhost", signal });

  https.request("https://localhost:4505", (res: any) => {
    let data = "";
    res.on("data", (chunk: any) => {
      data += chunk;
    });
    res.on("end", () => {
      assertEquals(data.length, 5_000);
      controller.abort();
    });
  }).end();

  await serveFinish;
});

Deno.test("[node/https] get makes https GET request", async () => {
  const controller = new AbortController();
  const signal = controller.signal;

  const serveFinish = serveTls((_req) => {
    return new Response("abcd\n".repeat(1_000));
  }, { keyFile, certFile, port: 4505, hostname: "localhost", signal });

  https.get("https://localhost:4505", (res: any) => {
    let data = "";
    res.on("data", (chunk: any) => {
      data += chunk;
    });
    res.on("end", () => {
      assertEquals(data.length, 5_000);
      controller.abort();
    });
  }).end();

  await serveFinish;
});
