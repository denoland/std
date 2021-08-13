// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { listenAndServe } from "./native_server.ts";

const addr = Deno.args[0] || "127.0.0.1:4500";
const body = new TextEncoder().encode("Hello World");

listenAndServe(addr, () => {
  const resInit = { headers: new Headers() };
  resInit.headers.set("Date", new Date().toUTCString());
  resInit.headers.set("Connection", "keep-alive");

  return new Response(body, resInit);
});

console.log(`http://${addr}/`);
