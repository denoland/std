import type { Handlers } from "$fresh/server.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";

export const handler: Handlers = {
  async GET(request) {
    const headers = new Headers({ location: "/" });
    const supabaseClient = createSupabaseClient(request.headers, headers);
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    return new Response(null, { headers, status: 302 });
  },
};
