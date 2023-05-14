// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { State } from "@/routes/_middleware.ts";
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";

export interface AccountState extends State {
  session: string;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  if (!ctx.state.session) {
    return redirect(`/login?redirect_url=${encodeURIComponent(req.url)}`);
  }

  return await ctx.next();
}
