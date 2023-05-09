// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";
import type { State } from "./_middleware.ts";

// deno-lint-ignore no-explicit-any
export const handler: Handlers<any, State> = {
  async GET(_req, ctx) {
    const { error } = await ctx.state.supabaseClient.auth.signOut();
    if (error) throw error;

    return redirect("/");
  },
};
