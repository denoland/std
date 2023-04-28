// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { createSupabaseClient } from "@/utils/auth.ts";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

export interface State {
  session: Session | null;
  supabaseClient: SupabaseClient;
  isLoggedIn: boolean;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const { pathname } = new URL(req.url);
  if (["_frsh", ".ico", "logo"].some((part) => pathname.includes(part))) {
    return await ctx.next();
  }

  const headers = new Headers();
  const supabaseClient = createSupabaseClient(req.headers, headers);

  const { data: { session } } = await supabaseClient.auth.getSession();

  ctx.state.session = session;
  ctx.state.supabaseClient = supabaseClient;
  ctx.state.isLoggedIn = Boolean(session);

  const response = await ctx.next();
  /**
   * Note: ensure that a `new Response()` with a `location` header is used when performing server-side redirects.
   * Using `Response.redirect()` will throw as its headers are immutable.
   */
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}
