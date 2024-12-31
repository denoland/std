// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Request handler for {@linkcode Route}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * Extends {@linkcode Deno.ServeHandlerInfo} by adding a `params` argument.
 *
 * @param request Request
 * @param info Request info
 * @param params URL pattern result
 */
export type Handler = (
  request: Request,
  params?: URLPatternResult,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response>;

/**
 * Error handler for {@linkcode route}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * Extends {@linkcode Handler} by adding a first `error` argument.
 *
 * @param error Error thrown by a handler
 * @param request Request
 * @param info Request info
 * @param params URL pattern result
 */
export type ErrorHandler = (
  error: unknown,
  request: Request,
  params?: URLPatternResult,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response>;

/**
 * RouteWithDefaultHandler subtype of {@linkcode Route}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param pattern Request URL pattern
 * @param handler Default request handler that runs for any method
 */
export type RouteWithDefaultHandler = {
  pattern: URLPattern;
  handler: Handler;
  handlers?: never;
};

/**
 * HandlersByMethods for {@linkcode RouteWithHandlersByMethods}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type HandlersByMethods = { [k in string]: Handler };

/**
 * RouteWithHandlersByMethods subtype of {@linkcode Route}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param pattern Request URL pattern
 * @param handlers An object with method keys and Handler values
 */
export type RouteWithHandlersByMethods = {
  pattern: URLPattern;
  handler?: never;
  handlers: HandlersByMethods;
};

/**
 * Route configuration for {@linkcode route}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type Route = RouteWithDefaultHandler | RouteWithHandlersByMethods;

/**
 * Routes requests to different handlers based on the request path and method.
 * Iterates over the elements of the provided routes array and handles requests
 * using the first Route that has a matching URLPattern. When Route is of type
 * RouteWithMethodHandlers and no handler is defined for the requested method,
 * then returns a 405 Method Not Allowed response. Returns a generic 404 Not Found
 * response when no route matches. Catches errors thrown by a handler and returns
 * a generic 500 Internal Server Error response, or handles the error with the
 * provided errorHandler when available.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore
 * import { route, type Route } from "@std/http/unstable-route";
 * import { serveDir } from "@std/http/file-server";
 *
 * const routes: Route[] = [
 *   {
 *     pattern: new URLPattern({ pathname: "/about" }),
 *     handlers: { GET: () => new Response("About page") },
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/users/:id" }),
 *     handlers: {
 *       GET: (_req: Request, params?: URLPatternResult) =>
 *         new Response(params?.pathname.groups.id),
 *     },
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/static/*" }),
 *     handlers: { GET: (req: Request) => serveDir(req) },
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/api" }),
 *     handlers: {
 *       GET: (_req: Request) => new Response("Ok"),
 *       HEAD: (_req: Request) => new Response(null),
 *     },
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/unavailable" }),
 *     handler: (_req: Request) => {
 *       return new Response(null, {
 *         status: 307,
 *         headers: { Location: "http://localhost:8000/api" },
 *       });
 *     },
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/will-fail" }),
 *     handler: (_req: Request) => {
 *       throw new Error("oops");
 *       return new Response("Ok", { status: 200 });
 *     },
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/*" }),
 *     handler: (_req: Request) => {
 *       return new Response("Custom Not Found", { status: 404 });
 *     },
 *   },
 * ];
 *
 * function errorHandler(err: unknown) {
 *   console.error(err);
 *   return new Response("Custom Error Handler", {
 *     status: 500,
 *   });
 * }
 *
 * Deno.serve(route(routes, errorHandler));
 * ```
 *
 * @param routes Route configurations
 * @param errorHandler Optional error handler
 * @returns Request handler
 */
export function route(
  routes: Route[],
  errorHandler: ErrorHandler = () => {
    return new Response("Internal Server Error", { status: 500 });
  },
): (
  request: Request,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response> {
  // TODO(iuioiua): Use `URLPatternList` once available (https://github.com/whatwg/urlpattern/pull/166)
  return (request: Request, info?: Deno.ServeHandlerInfo) => {
    for (const route of routes) {
      const match = route.pattern.exec(request.url);
      if (match === null) {
        continue;
      }

      let handler: Handler;
      if (route.handler) {
        handler = route.handler;
      } else if (!(request.method in route.handlers)) {
        /**
         * @see {@link https://www.iana.org/go/rfc2616 | RFC2616, Section 14.7}
         */
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: Object.keys(route.handlers).join(", ") },
        });
      } else {
        handler = route.handlers[request.method] as Handler;
      }

      try {
        return handler(request, match, info);
      } catch (error) {
        return errorHandler(error, request, match, info);
      }
    }

    return new Response("Not Found", { status: 404 });
  };
}
