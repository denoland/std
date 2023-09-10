// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import twindPlugin from "$fresh/plugins/twindv1.ts";
import twindConfig from "./twind.config.ts";
import kvOAuthPlugin from "./plugins/kv_oauth.ts";
import protectedRoutes from "./plugins/protected_routes.ts";
import errorHandling from "./plugins/error_handling.ts";
import { FreshOptions } from "$fresh/server.ts";

export default {
  plugins: [
    kvOAuthPlugin,
    protectedRoutes,
    twindPlugin(twindConfig),
    errorHandling,
  ],
} as FreshOptions;
