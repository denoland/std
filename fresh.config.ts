// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import twindPlugin from "$fresh/plugins/twindv1.ts";
import twindConfig from "./twind.config.ts";
import kvOAuthPlugin from "./plugins/kv_oauth.ts";
import sessionPlugin from "./plugins/session.ts";
import errorHandling from "./plugins/error_handling.ts";
import { FreshOptions } from "$fresh/server.ts";

export default {
  plugins: [
    kvOAuthPlugin,
    sessionPlugin,
    twindPlugin(twindConfig),
    errorHandling,
  ],
} as FreshOptions;
