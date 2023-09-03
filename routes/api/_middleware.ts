// Copyright 2023 the Deno authors. All rights reserved. MIT license.

import { type MiddlewareHandlerContext, Status } from "$fresh/server.ts";
import { isHttpError } from "std/http/http_errors.ts";

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext,
) {
  try {
    return await ctx.next();
  } catch (error) {
    return isHttpError(error)
      ? new Response(error.message, {
        status: error.status,
        headers: error.headers,
      })
      : new Response(error.message, { status: Status.InternalServerError });
  }
}
