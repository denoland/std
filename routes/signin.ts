// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";
import { redirect } from "@/utils/redirect.ts";
import { signIn } from "deno_kv_oauth";
import { client } from "@/utils/kv_oauth.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  /**
   * Redirects the client to the authenticated redirect path if already login.
   * If not logged in, it continues to rendering the login page.
   */
  async GET(req, ctx) {
    return ctx.state.sessionId ? redirect("/") : await signIn(req, client);
  },
};
