export type HttpRequest = { path: string };
export type HttpResponse = { body: string };

export type Middleware<
  Requires extends HttpRequest,
  // deno-lint-ignore ban-types
  Adds = {},
> = <Gets extends Requires>(
  req: Gets,
  next?: Middleware<Gets & Adds>,
) => Promise<HttpResponse>;

type MiddlewareStack<
  Requires extends HttpRequest,
  // deno-lint-ignore ban-types
  Adds = {},
> = {
  handler: Middleware<Requires, Adds>;

  add<HandlerAdd>(
    middleware: Middleware<HttpRequest & Adds, HandlerAdd>,
  ): MiddlewareStack<Requires, HttpRequest & Adds & HandlerAdd>;
};

function addMiddleware<
  StackAdd,
  HandlerAdd,
>(
  stack: Middleware<HttpRequest, StackAdd>,
  middleware: Middleware<HttpRequest & StackAdd, HandlerAdd>,
): Middleware<HttpRequest, HttpRequest & StackAdd & HandlerAdd> {
  return (req, next) =>
    stack(
      req,
      (r) => middleware(r, next),
    );
}

// deno-lint-ignore ban-types
export function stack<Requires extends HttpRequest, Adds = {}>(
  middleware: Middleware<Requires, Adds>,
): MiddlewareStack<Requires, Adds> {
  return {
    handler: middleware,
    add: (m) =>
      stack(
        addMiddleware(
          middleware,
          m,
        ),
      ),
  };
}
