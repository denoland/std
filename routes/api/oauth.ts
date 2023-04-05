// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import type { Provider } from "@supabase/supabase-js";

export const handler: Handlers = {
  async POST(request) {
    const form = await request.formData();
    const provider = form.get("provider");

    if (typeof provider !== "string") {
      return new Response(null, { status: 400 });
    }

    const headers = new Headers();
    const supabaseClient = createSupabaseClient(request.headers, headers);
    const { origin } = new URL(request.url);
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: origin + "/login/success",
      },
    });

    if (error) throw error;

    headers.set("location", data.url);

    return new Response(null, { headers, status: 302 });
  },
};
