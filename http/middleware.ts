// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Middleware handler based on {@linkcode Deno.ServeHandlerInfo} but an added
 * `next()` function which calls the next middleware handler in the middleware
 * chain.
 */
export type MiddlewareHandler = (
  request: Request,
  info: Deno.ServeHandlerInfo,
  next: () => Response | Promise<Response>,
) => Response | Promise<Response>;

/**
 * Creates a {@linkcode Deno.ServeHandler} from the given middleware chain,
 * which can then be passed to {@linkcode Deno.serve}.
 *
 * @param middlewares Middleware chain
 *
 * @example
 * ```ts
 * import {
 *   type MiddlewareHandler,
 *   composeHandler,
 * } from "https://deno.land/std@$STD_VERSION/http/middleware.ts";
 *
 * const middleware1: MiddlewareHandler = async (_request, _info, next) => {
 *   const start = performance.now();
 *   const response = await next();
 *   const duration = performance.now() - start;
 *   response.headers.set("x-request-time", duration.toString());
 *   return response;
 * };
 *
 * const middleware2: MiddlewareHandler = (request, info) => {
 *   return Response.json({ request, info });
 * };
 *
 * const handler = composeHandler([middleware1, middleware2])
 * ```
 */
export function composeHandler(
  middlewares: MiddlewareHandler[],
): Deno.ServeHandler {
  return (request, info) => {
    function chainMiddleware(index: number): Response | Promise<Response> {
      if (index >= middlewares.length) {
        throw new RangeError("Middleware chain exhausted");
      }
      return middlewares[index](
        request,
        info,
        () => chainMiddleware(index + 1),
      );
    }
    return chainMiddleware(0);
  };
}
