// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This is an example of a server that responds with an empty body
import { listenAndServe } from "../native_server.ts";

const options = { hostname: "0.0.0.0", port: 4504 };
console.log(`Simple server listening on http://${options.hostname}:${options.port}/`);
await listenAndServe(options, () => new Response());
