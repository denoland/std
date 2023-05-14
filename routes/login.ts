// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import {
  oauth2Client,
  OAUTH_SESSION_COOKIE_NAME,
  OAUTH_SESSION_KV_PREFIX,
} from "@/utils/auth.ts";
import { kv } from "@/utils/db.ts";
import { setCookie } from "std/http/cookie.ts";

export const handler: Handlers = {
  /**
   * Redirects the client to the authenticated redirect path if already login.
   * If not logged in, it continues to rendering the login page.
   */
  async GET() {
    // Generate a random state
    const state = crypto.randomUUID();
    const { uri, codeVerifier } = await oauth2Client.code
      .getAuthorizationUri({ state });

    // Associate the state and PKCE code verifier with a session cookie
    const oauthSessionId = crypto.randomUUID();
    await kv.set([OAUTH_SESSION_KV_PREFIX, oauthSessionId], {
      state,
      codeVerifier,
    });

    const headers = new Headers({ location: uri.toString() });
    setCookie(headers, {
      name: OAUTH_SESSION_COOKIE_NAME,
      value: oauthSessionId,
      // httpOnly: true,
    });

    // Redirect to the authorization endpoint
    return new Response(null, { status: 302, headers });
  },
};
