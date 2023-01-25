// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { serve } from "./server.ts";

const DEFAULT_PORT = 4500;
const addr = Deno.args[0] || `127.0.0.1:${DEFAULT_PORT}`;
const encoder = new TextEncoder();
const body = encoder.encode("Hello World");
const [hostname, p] = addr.split(":");
serve(() => new Response(body), { port: (+p || DEFAULT_PORT), hostname });
