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

/**
 * @todo Remove at v1. This is a quick way to reset Deno KV, as database changes are likely to occur and require reset.
 */
import { resetKv } from "./tools/reset_kv.ts";

if (Deno.env.get("RESET_DENO_KV") === "1") {
  await resetKv();
}

await start(manifest, { plugins: [twindPlugin(twindConfig)] });
