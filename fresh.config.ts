// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { defineConfig } from "$fresh/server.ts";
import twindPlugin from "$fresh/plugins/twindv1.ts";
import twindConfig from "./twind.config.ts";

export default defineConfig({
  plugins: [twindPlugin(twindConfig)],
});
