#!/usr/bin/env -S deno run -A --watch=static/,routes/
// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

await dev(import.meta.url, "./main.ts", config);
