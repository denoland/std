/**
 * Request handler for {@linkcode route}.
 *
 * > [!WARNING]
 * > **UNSTABLE**: New API, yet to be vetted.
 *
 * @experimental
 *
 * Extends {@linkcode Handler} by adding a `params` argument.
 *
 * @param request Request
 * @param info Request info
 * @param params URL pattern result
 */
export type Handler = (
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
  handler: Handler;
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
  path: URLPattern;
  /**
   * Request method.
   *
   * @default {"GET"}
   */
  method?: string;
  /**
   * Request handler.
   */
  handler: Handler;
}

function isDynamicRoute(route: Route): route is DynamicRoute {
  return route.path instanceof URLPattern;
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
 *
 * const routes: Route[] = [
 *   {
 *     path: "/about",
 *     handler: (_request) => new Response("About page"),
 *   },
 *   {
 *     path: "/users/:id",
 *     method: "GET",
 *     handler: (_request, _info, params) => new Response(params?.pathname.groups.id),
 *   }
 * ];
 *
 * function defaultHandler(request: Request) {
 *   return new Response("Not found", { status: 404 });
 * }
 *
 * Deno.serve(route(routes, defaultHandler));
 * ```
 *
 * @param routes Route configurations
 * @param defaultHandler Default request handler that's returned when no route
 * matches the given request.
 * @returns Request handler
 */
export function route(
  routes: Route[],
  defaultHandler: Handler,
): Handler {
  const staticRoutes = new Map<string, Handler>();
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
    if (handler !== undefined) return handler(request, info);

    for (const route of dynamicRoutes) {
      const match = route.path.exec(href);
      if (match) return route.handler(request, info, match);
    }

    return defaultHandler(request, info);
  };
}
