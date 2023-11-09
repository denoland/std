// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Middleware function based on {@linkcode Deno.ServeHandlerInfo} but an added
 * `next()` function which calls the next middleware function in the middleware
 * chain.
 */
export type MiddlewareFunction = (
  request: Request,
  info: Deno.ServeHandlerInfo,
  next: () => Response | Promise<Response>,
) => Response | Promise<Response>;

/**
 * Creates a {@linkcode Deno.ServeHandler} from the given middleware chain.
 *
 * @param middlewares Middleware chain
 *
 * @see {@linkcode Deno.serve}
 *
 * @example
 * ```ts
 * import {
 *   type MiddlewareFunction,
 *   createHandler,
 * } from "https://deno.land/std@$STD_VERSION/http/middleware.ts";
 *
 * const middleware1: MiddlewareFunction = async (_request, _info, next) => {
 *   const start = performance.now();
 *   const response = await next();
 *   const duration = performance.now() - start;
 *   response.headers.set("x-request-time", duration.toString());
 *   return response;
 * };
 *
 * const middleware2: MiddlewareFunction = (request, info) => {
 *   return Response.json({ request, info });
 * };
 *
 * const handler = createHandler([])
 * ```
 */
export function createHandler(
  middlewares: MiddlewareFunction[],
): Deno.ServeHandler {
  return (request, info) => {
    function compose(index: number): Response | Promise<Response> {
      if (index >= middlewares.length) {
        throw new RangeError("Middleware chain exhausted");
      }
      return middlewares[index](request, info, () => compose(index + 1));
    }
    return compose(0);
  };
}
