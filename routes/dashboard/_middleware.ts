// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { createOrGetCustomer, createSupabaseClient } from "@/utils/supabase.ts";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/utils/supabase_types.ts";
import { stripe } from "@/utils/stripe.ts";

export interface DashboardState {
  session: Session;
  supabaseClient: SupabaseClient<Database>;
  createOrGetCustomer: () => Promise<
    Database["public"]["Tables"]["customers"]["Row"]
  >;
}

export async function handler(
  request: Request,
  ctx: MiddlewareHandlerContext<DashboardState>,
) {
  const headers = new Headers();
  const supabaseClient = createSupabaseClient(request.headers, headers);

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    const params = new URLSearchParams({ redirect_url: request.url });
    return new Response(null, {
      status: 302,
      headers: {
        location: `/login?${params}`,
      },
    });
  }

  ctx.state.session = session;
  ctx.state.supabaseClient = supabaseClient;
  ctx.state.createOrGetCustomer = async () =>
    await createOrGetCustomer(supabaseClient, stripe);

  const response = await ctx.next();
  /**
   * Note: ensure that a `new Response()` with a `location` header is used when performing server-side redirects.
   * Using `Response.redirect()` will throw as its headers are immutable.
   */
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}
