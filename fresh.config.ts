// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
import tailwind from '$fresh/plugins/tailwind.ts'
import kvOAuthPlugin from './plugins/kv_oauth.ts'
import sessionPlugin from './plugins/session.ts'
import errorHandling from './plugins/error_handling.ts'
import securityHeaders from './plugins/security_headers.ts'
import welcomePlugin from './plugins/welcome.ts'
import type { FreshConfig } from '$fresh/server.ts'
import storiesPlugin from 'https://deno.land/x/fresh_stories@0.0.11/stories-plugin.ts'

export default {
  plugins: [
    // ga4Plugin(),
    welcomePlugin,
    kvOAuthPlugin,
    sessionPlugin,
    storiesPlugin(),
    tailwind(),
    errorHandling,
    securityHeaders,
  ],
} satisfies FreshConfig
