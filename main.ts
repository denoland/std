// Copyright 2023 the Deno authors. All rights reserved. MIT license.
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twindv1.ts";
import twindConfig from "./twind.config.ts";

// Note: this is a one-off database reset as such functionality doesn't exist in Deno Deploy.
import { resetKv } from "./tools/reset_kv.ts";
await resetKv();

await start(manifest, { plugins: [twindPlugin(twindConfig)] });
