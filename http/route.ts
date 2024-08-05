export type Handler = (
  request: Request,
  params?: URLPatternResult | null,
) => Response | Promise<Response>;

export interface Route<T extends (string | URLPattern)> {
  path: T;
  /**
   * @default {"GET"}
   */
  method?: string;
  handler: Handler;
}

/**
 * @example Usage
 * ```ts
 * import { route, type Route } from "@std/http/route";
 *
 * const routes: Route[] = [
 *   {
 *     path: "/about",
 *     method: "GET",
 *     handler: (request) => new Response("About page"),
 *   },
 *   {
 *     path: "/users/:id",
 *     method: "GET",
 *     handler: (request, params) => new Response(params?.pathname.groups.id),
 *   }
 * ];
 * function defaultHandler(request: Request) {
 *   return new Response("Not found", { status: 404 });
 * }
 *
 * Deno.serve(route(routes, defaultHandler));
 * ```
 *
 * @param routes
 * @returns
 */
export function route(
  routes: Route<string | URLPattern>[],
  defaultHandler: Handler,
): Handler | undefined {
  const staticRoutes = new Map();
  const dynamicRoutes: Route<URLPattern>[] = [];

  for (const route of routes) {
    if (route.path instanceof URLPattern) {
      dynamicRoutes.push(route as Route<URLPattern>);
    } else {
      staticRoutes.set(`${route.method ?? "GET"} ${route.path}`, route.handler);
    }
  }

  return (request: Request) => {
    const { pathname } = new URL(request.url);
    const handler = staticRoutes.get(`${request.method} ${pathname}`);
    if (handler !== undefined) return handler(request);

    const route = dynamicRoutes
      .find((route) =>
        (route.method ?? "GET") === request.method &&
        route.path.test(request.url)
      );

    return route?.handler(request, route.path.exec(request.url)) ??
      defaultHandler(request);
  };
}
