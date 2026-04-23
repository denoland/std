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
 * Route configuration for {@linkcode routeRadix}.
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

/**
 * Routes requests to handlers using a linear scan over all routes.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * Routes are matched in insertion order; the first matching route wins.
 * Prefer {@linkcode routeRadix} for better performance on larger route tables.
 *
 * @example Usage
 * ```ts ignore
 * import { routeLinear, type Route } from "@std/http/unstable-route";
 *
 * const routes: Route[] = [
 *   {
 *     pattern: new URLPattern({ pathname: "/about" }),
 *     handler: () => new Response("About page"),
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/users/:id" }),
 *     method: "GET",
 *     handler: (_req, params) => new Response(params.pathname.groups.id),
 *   },
 * ];
 *
 * function defaultHandler(_req: Request) {
 *   return new Response("Not found", { status: 404 });
 * }
 *
 * Deno.serve(routeLinear(routes, defaultHandler));
 * ```
 *
 * @param routes Route configurations
 * @param defaultHandler Default request handler
 * @returns Request handler
 */
export function routeLinear(
  routes: Route[],
  defaultHandler: RequestHandler,
): RequestHandler {
  // TODO(iuioiua): Use `URLPatternList` once available (https://github.com/whatwg/urlpattern/pull/166)
  return (request: Request, info?: Deno.ServeHandlerInfo) => {
    for (const route of routes) {
      if (!methodMatches(route.method, request.method)) continue;
      const match = route.pattern.exec(request.url);
      if (match) return route.handler(request, match, info);
    }
    return defaultHandler(request, info);
  };
}

// ---------------------------------------------------------------------------
// Radix tree router
// ---------------------------------------------------------------------------

// Internal: Route with its original registration index for stable ordering.
interface IndexedRoute {
  route: Route;
  index: number;
}

interface RouteNode {
  staticChildren: Record<string, RouteNode>;
  paramChild: RouteNode | null;
  wildcardChild: RouteNode | null;
  routes: IndexedRoute[];
}

/**
 * Extract pathname from a URL string without allocating a URL object.
 * Handles both `http://host/path?query` and `http://host/path` forms.
 */
function parsePathname(url: string): string {
  const authorityStart = url.indexOf("//");
  const pathStart = url.indexOf("/", authorityStart + 2);
  if (pathStart === -1) return "/";
  const qmark = url.indexOf("?", pathStart);
  const hash = url.indexOf("#", pathStart);
  let end = url.length;
  if (qmark !== -1) end = qmark;
  if (hash !== -1 && hash < end) end = hash;
  return url.slice(pathStart, end);
}

/**
 * Returns true if a pathname segment contains URLPattern syntax that the
 * radix tree cannot model structurally — i.e. it is not a plain static
 * string, a bare `:param`, or a standalone `*`.
 *
 * Affected syntax:
 *   - Optional / non-capturing groups:  `{.ext}?`  `{foo}`
 *   - Regex-constrained params:         `:id(\d+)`  `:lang(en|fr)`
 *   - Inline wildcards:                 `*.js`  `prefix*`
 */
function isComplexSegment(segment: string): boolean {
  if (segment.includes("{") || segment.includes("(")) return true;
  if (segment.includes("*") && segment !== "*") return true;
  if (segment.endsWith("?") || segment.endsWith("+")) return true;
  return false;
}

function createNode(): RouteNode {
  return {
    staticChildren: Object.create(null) as Record<string, RouteNode>,
    paramChild: null,
    wildcardChild: null,
    routes: [],
  };
}

/**
 * Routes requests to different handlers based on the request path and method.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * Uses a radix tree for O(segments) dispatch on static and parametric routes.
 * Routes with complex URLPattern syntax (regex constraints, optional/non-capturing
 * groups, inline wildcards) fall back to linear matching while preserving
 * insertion order relative to tree-indexed routes.
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
export function routeRadix(
  routes: Route[],
  defaultHandler: RequestHandler,
): RequestHandler {
  const root = createNode();
  const fallbackRoutes: IndexedRoute[] = [];
  let insertionCounter = 0;

  function parseSegments(pathname: string): string[] {
    return pathname.split("/").filter(Boolean);
  }

  function insert(r: Route): void {
    const indexed: IndexedRoute = { route: r, index: insertionCounter++ };
    const segments = parseSegments(r.pattern.pathname);

    // If any pathname segment uses URLPattern syntax the radix tree cannot
    // model, fall back to linear matching. Insertion order is preserved via
    // `index`.
    if (segments.some(isComplexSegment)) {
      fallbackRoutes.push(indexed);
      return;
    }

    let node = root;

    for (const segment of segments) {
      if (segment === "*") {
        if (!node.wildcardChild) node.wildcardChild = createNode();
        node = node.wildcardChild;
        break; // Wildcards terminate the path
      } else if (segment.startsWith(":")) {
        if (!node.paramChild) node.paramChild = createNode();
        node = node.paramChild;
      } else {
        if (!(segment in node.staticChildren)) {
          node.staticChildren[segment] = createNode();
        }
        node = node.staticChildren[segment]!;
      }
    }

    node.routes.push(indexed);
  }

  function collectCandidates(
    node: RouteNode,
    segments: string[],
    index: number,
    results: IndexedRoute[],
  ): void {
    if (index === segments.length) {
      for (const r of node.routes) results.push(r);
      if (node.wildcardChild) {
        for (const r of node.wildcardChild.routes) results.push(r);
      }
      return;
    }

    const segment = segments[index]!;

    // Explore ALL matching branches so insertion order can break ties.
    if (segment in node.staticChildren) {
      collectCandidates(
        node.staticChildren[segment]!,
        segments,
        index + 1,
        results,
      );
    }

    if (node.paramChild) {
      collectCandidates(node.paramChild, segments, index + 1, results);
    }

    if (node.wildcardChild) {
      for (const r of node.wildcardChild.routes) results.push(r);
    }
  }

  // Build the tree
  for (const r of routes) insert(r);

  const isEmptyTree = fallbackRoutes.length === routes.length;

  // If every route fell through to fallbackRoutes, skip all radix machinery
  // on each request and delegate directly to routeLinear.
  if (isEmptyTree) {
    return routeLinear(routes, defaultHandler);
  }

  return (request: Request, info?: Deno.ServeHandlerInfo) => {
    const pathname = parsePathname(request.url);
    const segments = parseSegments(pathname);
    const radixCandidates: IndexedRoute[] = [];
    collectCandidates(root, segments, 0, radixCandidates);
    radixCandidates.sort((a, b) => a.index - b.index);

    // When the tree found no candidates and there are no fallback routes,
    // go straight to defaultHandler.
    if (radixCandidates.length === 0 && fallbackRoutes.length === 0) {
      return defaultHandler(request, info);
    }

    // Merge radix candidates with fallback routes by insertion order.
    // Fast path: skip merge if one side is empty.
    let candidates: IndexedRoute[];
    if (fallbackRoutes.length === 0) {
      candidates = radixCandidates;
    } else if (radixCandidates.length === 0) {
      candidates = fallbackRoutes;
    } else {
      candidates = [];
      let r = 0;
      let f = 0;
      while (r < radixCandidates.length && f < fallbackRoutes.length) {
        if (radixCandidates[r]!.index < fallbackRoutes[f]!.index) {
          candidates.push(radixCandidates[r++]!);
        } else {
          candidates.push(fallbackRoutes[f++]!);
        }
      }
      while (r < radixCandidates.length) candidates.push(radixCandidates[r++]!);
      while (f < fallbackRoutes.length) candidates.push(fallbackRoutes[f++]!);
    }

    for (const { route: r } of candidates) {
      if (!methodMatches(r.method, request.method)) continue;
      const params = r.pattern.exec(request.url);
      if (params) return r.handler(request, params, info);
    }

    return defaultHandler(request, info);
  };
}

export { routeRadix as route };
