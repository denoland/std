// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { serve, ServerRequest } from "./server.ts";

const addr = Deno.args[1] || "127.0.0.1:4501";
const server = serve(addr);

const body = new TextEncoder().encode("Hello 1\n");
const body2 = new TextEncoder().encode("World 2\n");

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

async function delayedRespond(request: ServerRequest): Promise<void> {
  await sleep(3000);
  await request.respond({ status: 200, body });
}

async function main(): Promise<void> {
  let isFirst = true;
  for await (const request of server) {
    if (isFirst) {
      isFirst = false;
      delayedRespond(request);
    } else {
      request.respond({ status: 200, body: body2 });
    }
  }
}

main();

console.log("Racing server listening...\n");
