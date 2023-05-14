// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";
import { deleteCookie } from "std/http/cookie.ts";
import { kv } from "@/utils/db.ts";
import { redirect } from "../utils/http.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async GET(_req, ctx) {
    if (ctx.state.session) {
      await await kv.delete(["users_by_session", ctx.state.session]);
    }

    const response = redirect("/");
    deleteCookie(response.headers, "session");
    return response;
  },
};
