// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This is an example of a server that responds with an empty body
import { listenAndServe } from "../server.ts";

const addr = "0.0.0.0:4504";

console.log(`Simple server listening on http://localhost:4504`);

await listenAndServe(addr, () => new Response());
