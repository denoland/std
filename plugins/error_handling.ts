// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import type { Plugin } from "$fresh/server.ts";
import type { State } from "@/plugins/session.ts";
import { Status } from "$fresh/server.ts";
import { BadRequestError, redirect, UnauthorizedError } from "@/utils/http.ts";
import { STATUS_TEXT } from "std/http/status.ts";

/**
 * Returns the HTTP status code corresponding to a given runtime error. By
 * default, a HTTP 500 status code is returned.
 *
 * @example
 * ```ts
 * import { toErrorStatus } from "@/plugins/error_handling.ts";
 *
 * toErrorStatus(new Deno.errors.NotFound) // Returns 404
 * ```
 */
export function toErrorStatus(error: Error) {
  if (error instanceof Deno.errors.NotFound) return Status.NotFound;
  if (error instanceof UnauthorizedError) return Status.Unauthorized;
  if (error instanceof BadRequestError) return Status.BadRequest;
  return Status.InternalServerError;
}

export default {
  name: "error-handling",
  middlewares: [
    {
      path: "/",
      middleware: {
        async handler(_req, ctx) {
          try {
            return await ctx.next();
          } catch (error) {
            if (error instanceof UnauthorizedError) {
              return redirect("/signin");
            }
            throw error;
          }
        },
      },
    },
    {
      path: "/api",
      middleware: {
        async handler(_req, ctx) {
          try {
            return await ctx.next();
          } catch (error) {
            const status = toErrorStatus(error);
            return new Response(error.message, {
              statusText: STATUS_TEXT[status],
              status,
            });
          }
        },
      },
    },
  ],
} as Plugin<State>;
