// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Request handler for {@linkcode StaticRoute}.
 *
 * > [!WARNING]
 * > **UNSTABLE**: New API, yet to be vetted.
 *
 * @experimental
 *
 * Extends {@linkcode Deno.ServeHandlerInfo} by adding making `info` optional.
 *
 * @param request Request
 * @param info Request info
 * @param params URL pattern result
 */
export type StaticRouteHandler = (
  request: Request,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response>;

/**
 * Request handler for {@linkcode DynamicRoute}.
 *
 * > [!WARNING]
 * > **UNSTABLE**: New API, yet to be vetted.
 *
 * @experimental
 *
 * Extends {@linkcode Deno.ServeHandlerInfo} by adding making `info` optional
 * and adding a `params` argument.
 *
 * @param request Request
 * @param info Request info
 * @param params URL pattern result
 */
export type DynamicRouteHandler = (
  request: Request,
  info?: Deno.ServeHandlerInfo,
  params?: URLPatternResult | null,
) => Response | Promise<Response>;

/**
 * Static route configuration for {@linkcode route}.
 *
 * > [!WARNING]
 * > **UNSTABLE**: New API, yet to be vetted.
 *
 * @experimental
 */
export interface StaticRoute {
  /**
   * Request path.
   */
  path: string;
  /**
   * Request method.
   *
   * @default {"GET"}
   */
  method?: string;
  /**
   * Request handler.
   */
  handler: StaticRouteHandler;
}

/**
 * Dynamic configuration for {@linkcode route}.
 *
 * > [!WARNING]
 * > **UNSTABLE**: New API, yet to be vetted.
 *
 * @experimental
 */
export interface DynamicRoute {
  /**
   * Request path.
   */
  pattern: URLPattern;
  /**
   * Request method.
   *
   * @default {"GET"}
   */
  method?: string;
  /**
   * Request handler.
   */
  handler: DynamicRouteHandler;
}

function isDynamicRoute(route: Route): route is DynamicRoute {
  return "pattern" in route;
}

/**
 * Route configuration for {@linkcode route}.
 *
 * > [!WARNING]
 * > **UNSTABLE**: New API, yet to be vetted.
 *
 * @experimental
 */
export type Route = StaticRoute | DynamicRoute;

/**
 * Routes requests to different handlers based on the request path and method.
 *
 * > [!WARNING]
 * > **UNSTABLE**: New API, yet to be vetted.
 *
 * @experimental
 *
 * @example Usage
 * ```ts no-eval
 * import { route, type Route } from "@std/http/route";
 * import { serveDir } from "@std/http/file-server";
 *
 * const routes: Route[] = [
 *   {
 *     path: "/about",
 *     handler: () => new Response("About page"),
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/users/:id" }),
 *     handler: (_req, _info, params) => new Response(params?.pathname.groups.id),
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/static/*" }),
 *     handler: (req: Request) => serveDir(req)
 *   }
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
  defaultHandler: StaticRouteHandler,
): StaticRouteHandler {
  const staticRoutes = new Map<string, StaticRouteHandler>();
  const dynamicRoutes: DynamicRoute[] = [];

  for (const route of routes) {
    if (isDynamicRoute(route)) {
      dynamicRoutes.push(route);
    } else {
      staticRoutes.set(`${route.method ?? "GET"} ${route.path}`, route.handler);
    }
  }

  return (request: Request, info?: Deno.ServeHandlerInfo) => {
    const { pathname, href } = new URL(request.url);
    const handler = staticRoutes.get(`${request.method} ${pathname}`);
    if (handler) return handler(request, info);

    for (const route of dynamicRoutes) {
      const match = route.pattern.exec(href);
      if (match) return route.handler(request, info, match);
    }

    return defaultHandler(request, info);
  };
}
