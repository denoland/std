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

type MiddlewareChain<
  Needs extends {},
  Adds = {},
> = {
  (...args: Parameters<Middleware<Needs, Adds>>): ReturnType<Middleware<Needs, Adds>>

  add<AddedNeeds, AddedAdds>(
    middleware: Middleware<AddedNeeds, AddedAdds>,
  ): MiddlewareChain<
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

export function chain<Needs extends {}, Adds = {}>(
  middleware: Middleware<Needs, Adds>,
): MiddlewareChain<Needs, Adds> {
    const copy = middleware.bind({}) as MiddlewareChain<Needs, Adds>

    copy.add = (m) =>
      chain(
        composeMiddleware(
          middleware,
          m,
        ),
      )

    return copy
}

