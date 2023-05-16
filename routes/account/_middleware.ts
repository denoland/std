// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { State } from "@/routes/_middleware.ts";
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { redirect } from "@/utils/http.ts";
import { getUserBySessionId, User } from "@/utils/db.ts";

export interface AccountState extends State {
  sessionId: string;
  user: User;
}

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const redirectResponse = redirect("/login");

  if (!ctx.state.sessionId) return redirectResponse;
  const user = await getUserBySessionId(ctx.state.sessionId);
  if (!user) return redirectResponse;
  return await ctx.next();
}
