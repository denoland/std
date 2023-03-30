import type { Handlers } from "$fresh/server.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { assert } from "std/testing/asserts.ts";
import { AUTHENTICATED_REDIRECT_PATH } from "@/constants.ts";

export const handler: Handlers = {
  async POST(request) {
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");
    assert(typeof email === "string");
    assert(typeof password === "string");

    const headers = new Headers();
    const { error } = await createSupabaseClient(request.headers, headers)
      .auth.signInWithPassword({
        email,
        password,
      });

    let redirectUrl = new URL(request.url).searchParams.get("redirect_url") ??
      AUTHENTICATED_REDIRECT_PATH;
    if (error) {
      redirectUrl = `/login?error=${encodeURIComponent(error.message)}`;
    }

    headers.set("location", redirectUrl);
    return new Response(null, { headers, status: 302 });
  },
};
