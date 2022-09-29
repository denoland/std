// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This is an example of a server that responds with an empty body
import { serve } from "../server.ts";

await serve(() => new Response(), { port: 4504 });
