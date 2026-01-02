// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Request handler for {@linkcode Route}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * Extends {@linkcode Deno.ServeHandlerInfo} by adding adding a `params` argument.
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
   *
   * @default {"GET"}
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
 *     pattern: new URLPattern({ pathname: "/about" }),
 *     handler: () => new Response("About page"),
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/users/:id" }),
 *     handler: (_req, params) => new Response(params?.pathname.groups.id),
 *   },
 *   {
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
  defaultHandler: (
    request: Request,
    info?: Deno.ServeHandlerInfo,
  ) => Response | Promise<Response>,
): (
  request: Request,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response> {
  // TODO(iuioiua): Use `URLPatternList` once available (https://github.com/whatwg/urlpattern/pull/166)
  return (request: Request, info?: Deno.ServeHandlerInfo) => {
    for (const route of routes) {
      const match = route.pattern.exec(request.url);
      if (
        match &&
        (Array.isArray(route.method)
          ? route.method.includes(request.method)
          : request.method === (route.method ?? "GET"))
      ) {
        return route.handler(request, match, info);
      }
    }
    return defaultHandler(request, info);
  };
}
