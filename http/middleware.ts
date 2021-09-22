import { HttpRequest } from "./request.ts";

export type Middleware<
  Requires extends {} = {},
  // deno-lint-ignore ban-types
  Adds = {},
> = <Gets extends HttpRequest<Requires>>(
  req: Gets,
  next?: Middleware<Requires & Adds>,
) => Promise<Response>;

type MiddlewareStack<
  Requires extends {},
  // deno-lint-ignore ban-types
  Adds = {},
> = {
  handler: Middleware<Requires, Adds>;

  add<AddedRequires extends {}, AddedAdds = {}>(
    middleware: Middleware<AddedRequires, AddedAdds>,
  ): MiddlewareStack<
    Requires & Omit<AddedRequires, keyof Adds>,
    Adds & AddedAdds
  >;
};

export function composeMiddleware<
  FirstRequires extends {},
  FirstAdd extends {},
  SecondRequires extends {},
  SecondAdd extends {},
>(
  first: Middleware<FirstRequires, FirstAdd>,
  second: Middleware<SecondRequires, SecondAdd>,
): Middleware<
  FirstRequires & Omit<SecondRequires, keyof FirstAdd>,
  FirstAdd & SecondAdd
> {
  return (req, next) =>
    first(
      req,
      (r) =>
        second(
          //@ts-ignore: TS does not know about the middleware magic here
          r,
          next,
        ),
    );
}

// deno-lint-ignore ban-types
export function stack<Requires extends {}, Adds = {}>(
  middleware: Middleware<Requires, Adds>,
): MiddlewareStack<Requires, Adds> {
  return {
    handler: middleware,
    add: (m) =>
      stack(
        composeMiddleware(
          middleware,
          m,
        ),
      ),
  };
}
