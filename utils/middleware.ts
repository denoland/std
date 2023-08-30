// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { State } from "@/routes/_middleware.ts";
import type { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getUserBySession, User } from "@/utils/db.ts";
import { redirect } from "@/utils/redirect.ts";

export interface SignedInState extends State {
  sessionId: string;
  user: User;
}

export async function ensureSignedInMiddleware(
  _req: Request,
  ctx: MiddlewareHandlerContext<SignedInState>,
) {
  if (ctx.state.sessionId === undefined) return redirect("/signin");

  const user = await getUserBySession(ctx.state.sessionId);
  if (user === null) return redirect("/signin");

  ctx.state.user = user;
  return await ctx.next();
}
