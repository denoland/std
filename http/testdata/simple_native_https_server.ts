// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This is an example of a https server
import { listenAndServeTls } from "../native_server.ts";
import { dirname, fromFileUrl, join } from "../../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));
const tlsOptions = {
  hostname: "localhost",
  port: 4505,
  certFile: join(moduleDir, "tls/localhost.crt"),
  keyFile: join(moduleDir, "tls/localhost.key"),
};
console.log(
  `Simple HTTPS server listening on https://${tlsOptions.hostname}:${tlsOptions.port}/`,
);
const body = new TextEncoder().encode("Hello HTTPS");
await listenAndServeTls(tlsOptions, () => new Response(body));
