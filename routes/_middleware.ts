import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { hasSupabaseAuthToken } from "@/utils/supabase.ts";

export interface State {
  isLoggedIn: boolean;
}

export async function handler(
  request: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  ctx.state.isLoggedIn = hasSupabaseAuthToken(request.headers);
  return await ctx.next();
}
