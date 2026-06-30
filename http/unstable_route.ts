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
  /**
   * Whether `staticChildren` has at least one entry. Tracked as a flag so
   * dispatch can skip the substring slice when there are no static children
   * to look up.
   */
  hasStaticChildren: boolean;
  paramChild: RouteNode | null;
  wildcardChild: RouteNode | null;
  routes: IndexedRoute[];
  /**
   * Smallest insertion index reachable from this subtree (including its own
   * `routes`). Used to prune subtrees that cannot improve on the current
   * best match during dispatch.
   */
  minIndex: number;
}

/**
 * Extract pathname from a URL string without allocating a URL object.
 *
 * This is a fast path tailored for `request.url`, which is always a fully
 * normalized absolute URL with an authority component (e.g. `http://host/p`,
 * `https://host/p?q`). It is NOT a general-purpose URL parser:
 *
 *   - Assumes the URL contains `://` separating scheme and authority. URLs
 *     without an authority (e.g. `file:/path`, `mailto:x@y`) are not handled.
 *   - Relies on userinfo containing no literal `/` (per WHATWG URL parsing,
 *     `/` in userinfo is percent-encoded), so the first `/` after the
 *     authority delimiter unambiguously starts the path.
 *
 * Always call this with a `Request#url` value; do not export.
 */
function parsePathname(url: string): string {
  // Skip past the scheme delimiter `://`. Using indexOf with the full token
  // avoids the corner case where a scheme contains a colon-prefixed segment
  // before the authority.
  const schemeEnd = url.indexOf("://");
  const authorityStart = schemeEnd === -1 ? 0 : schemeEnd + 3;
  const pathStart = url.indexOf("/", authorityStart);
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
 *   - Optional / non-capturing groups:    `{.ext}?`  `{foo}`
 *   - Regex-constrained params:           `:id(\d+)`  `:lang(en|fr)`
 *   - Inline wildcards:                   `*.js`  `prefix*`
 *   - Modifier suffixes on params/groups: `:id?`  `:id+`  `:id*`  `(\d+)?`
 *   - Backslash escapes for literals:     `\+`  `\?`  `\*`  `\:`  `\(`  `\{`
 *
 * Note that URLPattern's parser treats `?`, `+`, and `*` as modifier tokens
 * in pathnames; literal occurrences (e.g. `/c++`) must be backslash-escaped
 * (e.g. `/c\+\+`). The `pathname` property preserves the escape sequence,
 * which the radix tree cannot match against an unescaped request path —
 * so any segment containing `\` is routed to the linear fallback to keep
 * URLPattern as the authoritative matcher.
 *
 * The `:id*` "zero-or-more" modifier is caught by the inline-wildcard branch
 * (`includes("*")` with `segment !== "*"`), not by an explicit `endsWith("*")`
 * clause. This is intentional — the two checks subsume each other for `*`.
 */
function isComplexSegment(segment: string): boolean {
  if (segment.includes("{") || segment.includes("(")) return true;
  if (segment.includes("*") && segment !== "*") return true;
  if (segment.endsWith("?") || segment.endsWith("+")) return true;
  if (segment.includes("\\")) return true;
  return false;
}

function createNode(): RouteNode {
  return {
    staticChildren: Object.create(null) as Record<string, RouteNode>,
    hasStaticChildren: false,
    paramChild: null,
    wildcardChild: null,
    routes: [],
    minIndex: Number.POSITIVE_INFINITY,
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
 * The tree is keyed by pathname segments only. Other URLPattern components
 * (hostname, search, protocol, etc.) are not indexed; routes that constrain
 * those components are inserted in the tree under their pathname, and the
 * additional constraints are validated by `pattern.exec()` per request. As a
 * result, multiple routes sharing the same pathname but differing on
 * hostname/search/protocol receive no pruning from the tree — every
 * pathname-matching candidate is tested by the URLPattern matcher in
 * insertion order, just as `routeLinear` would.
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

  function insert(r: Route): void {
    const indexed: IndexedRoute = { route: r, index: insertionCounter++ };
    const segments = r.pattern.pathname.split("/").filter(Boolean);

    // If any pathname segment uses URLPattern syntax the radix tree cannot
    // model, fall back to linear matching. Insertion order is preserved via
    // `index`.
    if (segments.some(isComplexSegment)) {
      fallbackRoutes.push(indexed);
      return;
    }

    // Walk the tree, creating nodes as needed and updating `minIndex` along
    // the way so each ancestor remembers the lowest insertion index that
    // can be reached through it. This is what enables pruning at dispatch.
    let node = root;
    if (indexed.index < node.minIndex) node.minIndex = indexed.index;

    for (const segment of segments) {
      if (segment === "*") {
        if (!node.wildcardChild) node.wildcardChild = createNode();
        node = node.wildcardChild;
        if (indexed.index < node.minIndex) node.minIndex = indexed.index;
        break; // Wildcards terminate the path
      } else if (segment.startsWith(":")) {
        if (!node.paramChild) node.paramChild = createNode();
        node = node.paramChild;
      } else {
        if (!(segment in node.staticChildren)) {
          node.staticChildren[segment] = createNode();
          node.hasStaticChildren = true;
        }
        node = node.staticChildren[segment]!;
      }
      if (indexed.index < node.minIndex) node.minIndex = indexed.index;
    }

    node.routes.push(indexed);
  }

  // Build the tree
  for (const r of routes) insert(r);

  const isEmptyTree = fallbackRoutes.length === routes.length;

  // If every route fell through to fallbackRoutes, skip all radix machinery
  // on each request and delegate directly to routeLinear.
  if (isEmptyTree) {
    return routeLinear(routes, defaultHandler);
  }

  // Per-request mutable match state. Hoisted to a single object so the
  // recursive walker doesn't allocate a closure per request.
  interface MatchState {
    request: Request;
    pathname: string;
    bestRoute: Route | null;
    bestIndex: number;
    bestParams: URLPatternResult | null;
  }

  /**
   * Try a single route as a candidate. Updates `state` in place when the
   * route matches and has a lower insertion index than the current best.
   */
  function tryRoute(state: MatchState, r: IndexedRoute): void {
    if (r.index >= state.bestIndex) return;
    if (!methodMatches(r.route.method, state.request.method)) return;
    const params = r.route.pattern.exec(state.request.url);
    if (!params) return;
    state.bestRoute = r.route;
    state.bestIndex = r.index;
    state.bestParams = params;
  }

  /**
   * Walk the tree in lockstep with the pathname. `from` is the index of the
   * current segment's first character in `pathname`. Each step finds the
   * segment slice [start, end) and recurses on matching children.
   *
   * No segments array is allocated; only the substrings needed for static
   * lookups are materialised.
   */
  function walk(node: RouteNode, state: MatchState, from: number): void {
    // Subtree pruning: if everything reachable here has a higher index than
    // the current best, skip the whole branch.
    if (node.minIndex >= state.bestIndex) return;

    const pathname = state.pathname;
    const len = pathname.length;

    // Skip leading '/'
    let start = from;
    while (start < len && pathname.charCodeAt(start) === 47 /* '/' */) {
      start++;
    }

    if (start >= len) {
      // End of pathname — try every route registered at this node, plus
      // any wildcard child's routes (matches an empty trailing segment).
      for (const r of node.routes) tryRoute(state, r);
      const wc = node.wildcardChild;
      if (wc !== null && wc.minIndex < state.bestIndex) {
        for (const r of wc.routes) tryRoute(state, r);
      }
      return;
    }

    // Find segment end.
    let end = start;
    while (end < len && pathname.charCodeAt(end) !== 47 /* '/' */) end++;

    // Static children: only allocate the substring if this node has any.
    if (node.hasStaticChildren) {
      const segment = pathname.slice(start, end);
      const child = node.staticChildren[segment];
      if (child !== undefined) {
        walk(child, state, end);
        if (state.bestIndex === 0) return; // can't do better
      }
    }

    if (node.paramChild) {
      walk(node.paramChild, state, end);
      if (state.bestIndex === 0) return;
    }

    const wc = node.wildcardChild;
    if (wc !== null && wc.minIndex < state.bestIndex) {
      // A wildcard child consumes the rest of the path; try its routes.
      for (const r of wc.routes) tryRoute(state, r);
    }
  }

  // Lowest insertion index reachable through the radix tree. Fallback
  // routes with a smaller index than this are guaranteed to come before
  // any radix candidate in insertion order, so we can scan them first
  // and let pruning skip the rest of the tree if one matches.
  const radixMinIndex = root.minIndex;

  return (request: Request, info?: Deno.ServeHandlerInfo) => {
    const state: MatchState = {
      request,
      pathname: parsePathname(request.url),
      bestRoute: null,
      bestIndex: Number.POSITIVE_INFINITY,
      bestParams: null,
    };

    // Scan fallback routes registered before any radix route first.
    // This preserves insertion order without a merge step and lets the
    // tree walk prune itself if one of these earlier fallbacks matches.
    let fbCursor = 0;
    while (
      fbCursor < fallbackRoutes.length &&
      fallbackRoutes[fbCursor]!.index < radixMinIndex
    ) {
      tryRoute(state, fallbackRoutes[fbCursor]!);
      fbCursor++;
    }

    walk(root, state, 0);

    // Remaining fallback routes (those whose index is >= radixMinIndex).
    // Stop as soon as the next fallback can't improve on the current best.
    for (let i = fbCursor; i < fallbackRoutes.length; i++) {
      const fb = fallbackRoutes[i]!;
      if (fb.index >= state.bestIndex) break;
      tryRoute(state, fb);
    }

    if (state.bestRoute !== null) {
      return state.bestRoute.handler(request, state.bestParams!, info);
    }
    return defaultHandler(request, info);
  };
}

export { routeLinear as route };
