// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function ensureLoggedInMiddleware(
  req: Request,
  ctx: MiddlewareHandlerContext,
) {
  if (!ctx.state.session) {
    return new Response(null, {
      headers: {
        location: `/login?redirect_url=${encodeURIComponent(req.url)}`,
      },
      /** @todo Confirm whether this HTTP redirect status code is correct */
      status: 302,
    });
  }

  return await ctx.next();
}
