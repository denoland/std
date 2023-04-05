import type { Handlers } from "$fresh/server.ts";
import { assert } from "std/testing/asserts.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import type { Provider } from "@supabase/supabase-js";

export const handler: Handlers = {
  async POST(request) {
    const form = await request.formData();
    const provider = form.get("provider");

    assert(typeof provider === "string");

    const headers = new Headers();
    const supabaseClient = createSupabaseClient(request.headers, headers);
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: new URL(request.url).origin +
          "/login-success",
      },
    });

    if (error) throw error;

    headers.set("location", data.url);

    return new Response(null, { headers, status: 302 });
  },
};
