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

  add<AddedRequires extends Request, AddedAdds>(
    middleware: Middleware<AddedRequires, AddedAdds>,
  ): MiddlewareStack<
    Requires & Omit<AddedRequires, keyof Adds>,
    Adds & AddedAdds
  >;
};

export function addMiddleware<
  FirstRequires extends Request,
  FirstAdd,
  SecondRequires extends Request,
  SecondAdd,
>(
  first: Middleware<FirstRequires, FirstAdd>,
  second: Middleware<SecondRequires, SecondAdd>,
): Middleware<
  FirstRequires & Omit<SecondRequires, keyof FirstAdd>,
  FirstAdd & SecondAdd
> {
  return (req, con, next) =>
    first(
      req,
      con,
      (r) =>
        second(
          //@ts-ignore: TS does not know about the middleware magic here
          r,
          con,
          next,
        ),
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
