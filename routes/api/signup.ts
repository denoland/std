// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { AUTHENTICATED_REDIRECT_PATH } from "@/constants.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";

export const handler: Handlers = {
  async POST(request) {
    const form = await request.formData();
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const headers = new Headers();
    const { error } = await createSupabaseClient(request.headers, headers)
      .auth.signUp({
        email,
        password,
      });

    let redirectUrl = new URL(request.url).searchParams.get("redirect_url") ??
      AUTHENTICATED_REDIRECT_PATH;
    if (error) {
      redirectUrl = `/signup?error=${encodeURIComponent(error.message)}`;
    }

    headers.set("location", redirectUrl);
    return new Response(null, { headers, status: 302 });
  },
};
