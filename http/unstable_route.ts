// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * A handler for HTTP requests.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type RequestHandler = (
  request: Request,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response>;

/**
 * Request handler for {@linkcode Route}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * Extends {@linkcode Deno.ServeHandlerInfo} by adding a `params` argument.
 *
 * @param request Request
 * @param params URL pattern result
 * @param info Request info
 */
export type Handler = (
  request: Request,
  params: URLPatternResult,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response>;

/**
 * Route configuration for {@linkcode route}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface Route {
  /**
   * Request URL pattern.
   */
  pattern: URLPattern;
  /**
   * Request method. This can be a string or an array of strings.
   * Method matching is case-insensitive.
   *
   * If not specified, all HTTP methods are matched.
   */
  method?: string | string[];
  /**
   * Request handler.
   */
  handler: Handler;
}

/**
 * Routes requests to different handlers based on the request path and method.
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
 *     // Matches all HTTP methods
 *     pattern: new URLPattern({ pathname: "/about" }),
 *     handler: () => new Response("About page"),
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/users/:id" }),
 *     method: "GET",
 *     handler: (_req, params) => new Response(params.pathname.groups.id),
 *   },
 *   {
 *     // Matches any method — serves static files
 *     pattern: new URLPattern({ pathname: "/static/*" }),
 *     handler: (req: Request) => serveDir(req)
 *   },
 *   {
 *     method: ["GET", "HEAD"],
 *     pattern: new URLPattern({ pathname: "/api" }),
 *     handler: (req: Request) => new Response(req.method === 'HEAD' ? null : 'ok'),
 *   },
 * ];
 *
 * function defaultHandler(_req: Request) {
 *   return new Response("Not found", { status: 404 });
 * }
 *
 * Deno.serve(route(routes, defaultHandler));
 * ```
 *
 * @param routes Route configurations
 * @param defaultHandler Default request handler that's returned when no route
 * matches the given request. Serving HTTP 404 Not Found or 405 Method Not
 * Allowed response can be done in this function.
 * @returns Request handler
 */
export function route(
  routes: Route[],
  defaultHandler: RequestHandler,
): RequestHandler {
  // TODO(iuioiua): Use `URLPatternList` once available (https://github.com/whatwg/urlpattern/pull/166)
  return (request: Request, info?: Deno.ServeHandlerInfo) => {
    for (const route of routes) {
      const match = route.pattern.exec(request.url);
      if (!match) continue;
      if (!methodMatches(route.method, request.method)) continue;
      return route.handler(request, match, info);
    }
    return defaultHandler(request, info);
  };
}

function methodMatches(
  routeMethod: string | string[] | undefined,
  requestMethod: string,
): boolean {
  if (!routeMethod) return true;
  if (Array.isArray(routeMethod)) {
    return routeMethod.some((m) => m.toUpperCase() === requestMethod);
  }
  return routeMethod.toUpperCase() === requestMethod;
}
