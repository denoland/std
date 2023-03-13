import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import { assert } from "std/testing/asserts.ts";
import type { Session } from "@supabase/supabase-js";

export interface DashboardState {
  session: Session;
}

export function getLoginPath(redirectUrl: string) {
  const params = new URLSearchParams({ redirect_url: redirectUrl });
  return `/login?${params}`;
}

export async function handler(
  request: Request,
  ctx: MiddlewareHandlerContext<DashboardState>,
) {
  try {
    const headers = new Headers();
    const supabaseClient = createSupabaseClient(request.headers, headers);
    const { data } = await supabaseClient.auth.getSession();
    assert(data.session);
    ctx.state.session = data.session;

    const response = await ctx.next();
    /**
     * Note: ensure that a `new Response()` with a `location` header is used when performing redirects.
     * Using `Response.redirect()` will throw as its headers are immutable.
     */
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  } catch (error) {
    console.error(error);

    return new Response(null, {
      status: 302,
      headers: {
        location: getLoginPath(request.url),
      },
    });
  }
}
