import type { Handlers } from "$fresh/server.ts";
import { AUTHENTICATED_REDIRECT_PATH } from "@/constants.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { assert } from "std/testing/asserts.ts";

export const handler: Handlers = {
  async POST(request) {
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");

    assert(typeof email === "string");
    assert(typeof password === "string");

    const headers = new Headers();
    const { error } = await createSupabaseClient(request.headers, headers)
      .auth.signUp({ email, password });

    let redirectUrl: string;
    if (error) {
      redirectUrl = `/signup?error=${encodeURIComponent(error.message)}`;
    } else {
      redirectUrl = new URL(request.url).searchParams.get("redirect_url") ??
        AUTHENTICATED_REDIRECT_PATH;
    }

    return new Response(null, {
      headers: { location: redirectUrl },
      status: 302,
    });
  },
};
