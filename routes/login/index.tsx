// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import type { State } from "@/routes/_middleware.ts";
import { redirectToOAuthLogin } from "../../utils/auth_kv.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  /**
   * Redirects the client to the authenticated redirect path if already login.
   * If not logged in, it continues to rendering the login page.
   */
  async GET() {
    return await redirectToOAuthLogin();
  },
};
