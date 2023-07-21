// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { State } from "@/routes/_middleware.ts";
import type { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getUserBySession, User } from "@/utils/db.ts";
import { redirectToLogin } from "@/utils/redirect.ts";

export interface SignedInState extends State {
  sessionId: string;
  user: User;
}

export async function ensureSignedInMiddleware(
  req: Request,
  ctx: MiddlewareHandlerContext<SignedInState>,
) {
  const redirectResponse = redirectToLogin(req.url);
  if (ctx.state.sessionId === undefined) return redirectResponse;

  const user = await getUserBySession(ctx.state.sessionId);
  if (user === null) return redirectResponse;

  ctx.state.user = user;
  return await ctx.next();
}
