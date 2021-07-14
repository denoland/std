// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { copy } from "../io/util.ts";
const hostname = "0.0.0.0";
const port = 8080;
const listener = Deno.listen({ hostname, port });
console.log(`Listening on ${hostname}:${port}`);
for await (const conn of listener) {
  copy(conn, conn);
}
