// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { listenAndServe } from "./native_server.ts";
import { _parseAddrFromStr } from "./server.ts";

const address = Deno.args[0] || "127.0.0.1:4500";
const httpOptions = _parseAddrFromStr(address);

const encoder = new TextEncoder();
const body = encoder.encode("Hello World");

listenAndServe(httpOptions, () => new Response(body));

console.log("Server listening on", address);
