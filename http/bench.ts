// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { listenAndServe } from "./server.ts";

const DEFAULT_PORT = 4500;
const addr = Deno.args[0] || `127.0.0.1:${DEFAULT_PORT}`;
const encoder = new TextEncoder();
const body = encoder.encode("Hello World");
const [hostname, p] = addr.split(":");
listenAndServe({
  hostname,
  port: parseInt(p ?? DEFAULT_PORT),
}, () => new Response(body));

console.log("Server listening on", addr);
