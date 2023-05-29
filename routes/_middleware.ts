// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { isSignedIn } from "deno_kv_oauth";

export interface State {
  isSignedIn: boolean;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  ctx.state.isSignedIn = isSignedIn(req);
  return await ctx.next();
}
