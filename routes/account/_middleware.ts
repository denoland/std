// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { State } from "@/routes/_middleware.ts";
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";

export interface AccountState extends State {
  sessionId: string;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  return ctx.state.sessionId
    ? await ctx.next()
    : redirect(`/login?redirect_url=${encodeURIComponent(req.url)}`);
}
