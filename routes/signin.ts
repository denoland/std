// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";
import { redirect } from "@/utils/http.ts";
import { isSignedIn, signIn } from "deno_kv_oauth";
import { provider } from "@/utils/provider.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  /**
   * Redirects the client to the authenticated redirect path if already login.
   * If not logged in, it continues to rendering the login page.
   */
  async GET(req) {
    return isSignedIn(req) ? redirect("/") : await signIn(provider);
  },
};
