// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { serveTls } from "../http/server.ts";
import { dirname, fromFileUrl, join } from "../path/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { Agent } from "./https.ts";

const stdRoot = dirname(dirname(fromFileUrl(import.meta.url)));
const tlsDataDir = join(stdRoot, "http", "testdata", "tls");
const keyFile = join(tlsDataDir, "localhost.key");
const certFile = join(tlsDataDir, "localhost.crt");
const dec = new TextDecoder();

Deno.test("[node/https] request makes https request", async () => {
  const controller = new AbortController();
  const signal = controller.signal;

  const serveFinish = serveTls((_req) => {
    return new Response("abcd\n".repeat(1_000));
  }, { keyFile, certFile, port: 4505, hostname: "localhost", signal });

  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--unstable",
      "--allow-all",
      "--no-check",
      "node/testdata/https_request.ts",
    ],
    env: {
      NODE_EXTRA_CA_CERTS: join(tlsDataDir, "RootCA.pem"),
    },
  });
  const { stderr, stdout } = await command.output();
  assertEquals(dec.decode(stderr), "");
  assertEquals(dec.decode(stdout), "abcd\n".repeat(1_000) + "\n");
  controller.abort();
  await serveFinish;
});

Deno.test("[node/https] get makes https GET request", async () => {
  const controller = new AbortController();
  const signal = controller.signal;

  const serveFinish = serveTls((_req) => {
    return new Response("abcd\n".repeat(1_000));
  }, { keyFile, certFile, port: 4505, hostname: "localhost", signal });

  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--unstable",
      "--allow-all",
      "--no-check",
      "node/testdata/https_get.ts",
    ],
    env: {
      NODE_EXTRA_CA_CERTS: join(tlsDataDir, "RootCA.pem"),
    },
  });
  const { stdout, stderr } = await command.output();
  assertEquals(dec.decode(stderr), "");
  assertEquals(dec.decode(stdout), "abcd\n".repeat(1_000) + "\n");
  controller.abort();
  await serveFinish;
});

Deno.test("new Agent doesn't throw", () => {
  new Agent();
});
