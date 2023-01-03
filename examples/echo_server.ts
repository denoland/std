// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** A simple echo server which listens on port `:8080`.
 *
 * @module
 */

import { copy } from "../streams/copy.ts";

const hostname = "0.0.0.0";
const port = 8080;
const listener = Deno.listen({ hostname, port });

console.log(`Listening on http://localhost:${port}`);

for await (const conn of listener) {
  copy(conn, conn);
}
