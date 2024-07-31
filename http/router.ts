export type Handler = (
  request: Request,
  info?: Deno.ServeHandlerInfo,
) => Response | Promise<Response>;

export interface StaticRoute {
  path: string;
  method: string;
}

export interface DynamicRoute {
  pattern: URLPattern;
  method: string;
}

export type Route = StaticRoute | DynamicRoute;
