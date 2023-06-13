// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { State } from "@/routes/_middleware.ts";
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getUserBySessionId, User } from "@/utils/db.ts";
import { redirectToLogin } from "@/utils/redirect.ts";

export interface AccountState extends State {
  sessionId: string;
  user: User;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<AccountState>,
) {
  const redirectResponse = redirectToLogin(req.url);
  if (!ctx.state.sessionId) return redirectResponse;
  const user = await getUserBySessionId(ctx.state.sessionId);
  if (!user) return redirectResponse;
  ctx.state.user = user;
  return await ctx.next();
}
