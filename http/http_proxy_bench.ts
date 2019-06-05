// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { serve } from "./server.ts";

const addr = Deno.args[1] || "127.0.0.1:4500";
const server = serve(addr);

async function main(): Promise<void> {
  console.log(`http://${addr}/`);
  for await (const req of server) {
    const url = `http://127.0.0.1:4545${req.url}`;
    const resp = await fetch(url, {
      method: req.method,
      headers: req.headers
    });
    req.respond({
      headers: resp.headers,
      status: resp.status,
      body: resp.body
    });
  }
}

main();
