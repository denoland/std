// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";

export const handler: Handlers = {
  async GET(request) {
    const headers = new Headers({ location: "/" });
    const { error } = await createSupabaseClient(request.headers, headers)
      .auth.signOut();
    if (error) throw error;

    return new Response(null, { headers, status: 302 });
  },
};
