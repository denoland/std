export type Middleware<
  Requires extends Request,
  // deno-lint-ignore ban-types
  Adds = {},
> = <Gets extends Requires>(
  req: Gets,
  next?: Middleware<Gets & Adds>,
) => Promise<HttpResponse>;

type MiddlewareStack<
  Requires extends Request,
  // deno-lint-ignore ban-types
  Adds = {},
> = {
  handler: Middleware<Requires, Adds>;

  add<HandlerAdd>(
    middleware: Middleware<Request & Adds, HandlerAdd>,
  ): MiddlewareStack<Requires, Request & Adds & HandlerAdd>;
};

function addMiddleware<
  StackAdd,
  HandlerAdd,
>(
  stack: Middleware<Request, StackAdd>,
  middleware: Middleware<Request & StackAdd, HandlerAdd>,
): Middleware<Request, Request & StackAdd & HandlerAdd> {
  return (req, next) =>
    stack(
      req,
      (r) => middleware(r, next),
    );
}

// deno-lint-ignore ban-types
export function stack<Requires extends Request, Adds = {}>(
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
