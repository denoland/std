#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import { load } from "std/dotenv/mod.ts";

load({ export: true });

await dev(import.meta.url, "./main.ts");
