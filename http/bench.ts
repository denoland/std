// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { listenAndServe } from "./server.ts";

const addr = Deno.args[0] || "127.0.0.1:4500";
const encoder = new TextEncoder();
const body = encoder.encode("Hello World");

listenAndServe(addr, () => new Response(body));

console.log("Server listening on", addr);
