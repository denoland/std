// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";
import { deleteUserBySession } from "@/utils/db.ts";
import { redirect } from "@/utils/http.ts";
import { deleteSessionCookie } from "@/utils/deno_kv_oauth.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async GET(_req, ctx) {
    if (ctx.state.sessionId) {
      await deleteUserBySession(ctx.state.sessionId);
    }

    const response = redirect("/");
    deleteSessionCookie(response.headers);
    return response;
  },
};
