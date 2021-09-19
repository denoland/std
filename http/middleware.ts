import { ConnInfo } from "./server.ts";

export type Middleware<
  Requires extends Request,
  // deno-lint-ignore ban-types
  Adds = {},
> = <Gets extends Requires>(
  req: Gets,
  con: ConnInfo,
  next?: Middleware<Gets & Adds>,
) => Promise<Response>;

type MiddlewareStack<
  Requires extends Request,
  // deno-lint-ignore ban-types
  Adds = {},
> = {
  handler: Middleware<Requires, Adds>;

  add<HandlerAdd>(
    middleware: Middleware<Request & Adds, HandlerAdd>,
  ): MiddlewareStack<Requires, Adds & HandlerAdd>;
};

export function addMiddleware<
  StackAdd,
  HandlerAdd,
>(
  first: Middleware<Request, StackAdd>,
  second: Middleware<Request & StackAdd, HandlerAdd>,
): Middleware<Request, Request & StackAdd & HandlerAdd> {
  return (req, con, next) =>
    first(
      req,
      con,
      (r) => second(r, con, next),
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
