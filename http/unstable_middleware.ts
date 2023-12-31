// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** Options for {@linkcode MiddlewareHandler}. */
export interface MiddlewareOptions<T = undefined> {
  /** Information for a HTTP request. */
  info: Deno.ServeHandlerInfo;
  /** Calls the next middleware handler in the middleware chain. */
  next: () => Response | Promise<Response>;
  /** State that gets passed down through each middleware handler. */
  state: T;
}

/**
 * Middleware handler which extends {@linkcode Deno.ServeHandlerInfo}. Used
 * in {@linkcode composeMiddleware}.
 */
export type MiddlewareHandler<T = undefined> = (
  request: Request,
  options: MiddlewareOptions<T>,
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
 *   composeMiddleware,
 * } from "https://deno.land/std@$STD_VERSION/http/unstable_middleware.ts";
 *
 * const middleware1: MiddlewareHandler = async (_request, { next }) => {
 *   const start = performance.now();
 *   const response = await next();
 *   const duration = performance.now() - start;
 *   response.headers.set("x-request-time", duration.toString());
 *   return response;
 * };
 *
 * const middleware2: MiddlewareHandler = (request) => {
 *   return Response.json({ request });
 * };
 *
 * const handler = composeMiddleware([middleware1, middleware2])
 * ```
 */
export function composeMiddleware<T = undefined>(
  middlewares: MiddlewareHandler<T>[],
  initialState?: T,
): Deno.ServeHandler {
  return (request, info) => {
    const state = initialState as T;

    function chainMiddleware(index: number): Response | Promise<Response> {
      if (index >= middlewares.length) {
        throw new RangeError("Middleware chain exhausted");
      }
      return middlewares[index](
        request,
        {
          info,
          next: () => chainMiddleware(index + 1),
          state,
        },
      );
    }
    return chainMiddleware(0);
  };
}
