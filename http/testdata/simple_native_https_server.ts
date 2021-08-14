// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This is an example of a https server
import { listenAndServeTls } from "../native_server.ts";

const tlsOptions = {
  hostname: "localhost",
  port: 4503,
  certFile: "./testdata/tls/localhost.crt",
  keyFile: "./testdata/tls/localhost.key",
};
console.log(
  `Simple HTTPS server listening on ${tlsOptions.hostname}:${tlsOptions.port}`,
);
const body = new TextEncoder().encode("Hello HTTPS");
await listenAndServeTls(tlsOptions, () => new Response(body));
