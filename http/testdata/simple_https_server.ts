// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This is an example of a https server
import { dirname, fromFileUrl, join } from "../../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

const port = 4505;
const certFile = join(moduleDir, "tls/localhost.crt");
const keyFile = join(moduleDir, "tls/localhost.key");
const encoder = new TextEncoder();
const body = encoder.encode("Hello HTTPS!");

console.log(`Simple HTTPS server listening on https://localhost:${port}`);

Deno.serve({
  port,
  cert: Deno.readTextFileSync(certFile),
  key: Deno.readTextFileSync(keyFile),
}, () => new Response(body));
