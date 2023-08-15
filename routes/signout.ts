// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { RouteContext } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";
import { deleteUserBySession } from "@/utils/db.ts";
import { signOut } from "kv_oauth";

export default async function SignOutPage(
  req: Request,
  ctx: RouteContext<undefined, State>,
) {
  if (ctx.state.sessionId) await deleteUserBySession(ctx.state.sessionId);
  return await signOut(req);
}
