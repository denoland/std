import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { createSupabaseClient } from "@/utils/supabase.ts";
import type { State } from "@/routes/_middleware.ts";

export interface DashboardState extends State {
  supabaseClient: ReturnType<typeof createSupabaseClient>;
}

export function getLoginPath(redirectUrl: string) {
  const params = new URLSearchParams({ redirect_url: redirectUrl });
  return `/login?${params}`;
}

export async function handler(
  request: Request,
  ctx: MiddlewareHandlerContext<DashboardState>,
) {
  if (ctx.state.isLoggedIn) {
    ctx.state.supabaseClient = createSupabaseClient(request.headers);
    return await ctx.next();
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: getLoginPath(request.url),
    },
  });
}
