// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import twindPlugin from "$fresh/plugins/twindv1.ts";
import twindConfig from "./twind.config.ts";
import kvOAuthPlugin from "./plugins/kv_oauth.ts";
import sessionPlugin from "./plugins/session.ts";
import errorHandling from "./plugins/error_handling.ts";
import securityHeaders from "./plugins/security_headers.ts";
import welcomePlugin from "./plugins/welcome.ts";
import { FreshOptions } from "$fresh/server.ts";

export default {
  plugins: [
    welcomePlugin,
    kvOAuthPlugin,
    sessionPlugin,
    twindPlugin(twindConfig),
    errorHandling,
    securityHeaders,
  ],
} as FreshOptions;
