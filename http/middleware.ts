// deno-lint-ignore-file ban-types

import { HttpRequest } from "./request.ts";
import { Expand, SafeOmit } from "../_util/types.ts";

export type Middleware<
  Needs extends {} = {},
  Adds = {},
> = (
  req: HttpRequest<Needs>,
  next?: Middleware<Expand<Needs & Adds>>,
) => Promise<Response>;

type MiddlewareStack<
  Needs extends {},
  Adds = {},
> = {
  handler: Middleware<Needs, Adds>;

  add<AddedNeeds, AddedAdds>(
    middleware: Middleware<AddedNeeds, AddedAdds>,
  ): MiddlewareStack<
    Expand<Needs & SafeOmit<AddedNeeds, Adds>>,
    Expand<Adds & AddedAdds>
  >;
};

export function composeMiddleware<
  FirstNeeds extends {},
  FirstAdd extends {},
  SecondNeeds extends {},
  SecondAdd extends {},
>(
  first: Middleware<FirstNeeds, FirstAdd>,
  second: Middleware<SecondNeeds, SecondAdd>,
): Middleware<
  Expand<FirstNeeds & SafeOmit<SecondNeeds, FirstAdd>>,
  Expand<FirstAdd & SecondAdd>
> {
  return (req, next) =>
    first(
      //@ts-ignore asdf
      req,
      (r) =>
        second(
          //@ts-ignore: TS does not know about the middleware magic here
          r,
          next,
        ),
    );
}

export function stack<Needs extends {}, Adds = {}>(
  middleware: Middleware<Needs, Adds>,
): MiddlewareStack<Needs, Adds> {
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
