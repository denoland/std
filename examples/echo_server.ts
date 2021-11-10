// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { copy } from "../streams/conversion.ts";

const hostname = "0.0.0.0";
const port = 8080;
const listener = Deno.listen({ hostname, port });

console.log(`Listening on http://localhost:${port}`);

for await (const conn of listener) {
  copy(conn, conn);
}
