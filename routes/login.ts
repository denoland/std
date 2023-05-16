// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { oauth2Client } from "@/utils/oauth2_client.ts";
import { redirectToOAuthLogin } from "@/utils/deno_kv_oauth.ts";
import type { State } from "./_middleware.ts";
import { redirect } from "@/utils/http.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  /**
   * Redirects the client to the authenticated redirect path if already login.
   * If not logged in, it continues to rendering the login page.
   */
  async GET(_req, ctx) {
    return ctx.state.sessionId
      ? redirect("/")
      : await redirectToOAuthLogin(oauth2Client);
  },
};
