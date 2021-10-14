// deno-lint-ignore-file ban-types

import { HttpRequest } from "./request.ts";
import type { Expand, SafeOmit } from "../_util/types.ts";

/**
* Middleware Handler that is expected to call the `next` Middleware at some
* point, adding its own logic, request context and transformations befor or
* after it. Can express the request context (see `HttpRequest.context`) it
* requires to work and any request context extensions it will add to be
* available to the `next` middleware.
*
* @typeParam Needs - Request context required by this Middleware, defaults to
* empty context `{}`
*
* @typeParam Adds - Request context this Middleware will add and thus make
* available to the `next` Middleware, defaults to empty context `{}`
*
* Example:
*
* ```ts import { Middleware } from "https://deno.land/std@$STD_VERSION/http/mod.ts";
*
* // Log response time, method and path for requests going through this middleware
* const log: Middleware = (req, next) => {
*   const start = performance.now();
*   const response = await next!(req);
*   const end = performance.now();

*   console.log(
*     `${req.method} ${new URL(req.url).pathname} ${response.status} ${end - start}ms`
*   );

*   return response;
* };
* ```
*/
export type Middleware<
  Needs extends {} = {},
  Adds = {},
> = (
  req: HttpRequest<Needs>,
  next?: Middleware<Expand<Needs & Adds>>,
) => Promise<Response>;

/**
 * A `Middleware` that can be chained onto with `.add()`. Use `chain()` to wrap
 * a `Middleware` as a `MiddlewareChain`. */
export type MiddlewareChain<
  Needs extends {},
  Adds = {},
> = {
  (
    ...args: Parameters<Middleware<Needs, Adds>>
  ): ReturnType<Middleware<Needs, Adds>>;

  /**
   * Chain a given middleware to this middleware, returning a new
   * `MiddlewareChain`.
   *
   * Example:
   *
   * ```ts
   * const first: Middleware = (req, next) => {
   *   console.log("Hey");
   *   return await next!(req);
   * };
   *
   * const second: Middleware = (req, next) => {
   *   console.log("there!");
   *   return await next!(req);
   * };
   *
   * const helloWorld = (req) => new Response("Hello world");
   *
   * // This Handler will log "Hey", log "there!" and then respond with "Hello World"
   * const handler = chain(first)
   *   .add(second)
   *   .add(helloWorld)
   * ```
   */
  add<AddedNeeds, AddedAdds>(
    middleware: Middleware<AddedNeeds, AddedAdds>,
  ): MiddlewareChain<
    Expand<Needs & SafeOmit<AddedNeeds, Adds>>,
    Expand<Adds & AddedAdds>
  >;
};

/**
 * Builds a new `Middleware` out of two given ones, chaining them.
 *
 * Example:
 *
 * ```ts
 * const findUser: Middleware<{}, { user: string }> = (req, next) => {
 *   return await next!(
 *     req.addContext({ user: "Kim" });
 *   );
 * };
 *
 * const hello = (req: HttpRequest<{ user: string }>) => new Response(`Hello ${req.context.user}`);
 *
 * // This Handler will respond with "Hello Kim"
 * const handler = composeMiddleware(findUser, hello)
 * ``` */
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
      req as HttpRequest<FirstNeeds>,
      (r) =>
        second(
          // @ts-ignore This will bubble up for insufficient middlware chains
          r,
          next,
        ),
    );
}

/** Wraps the given middleware in a `MiddlewareChain` so it can be `.add()`ed onto */
export function chain<Needs extends {}, Adds = {}>(
  middleware: Middleware<Needs, Adds>,
): MiddlewareChain<Needs, Adds> {
  const copy = middleware.bind({}) as MiddlewareChain<Needs, Adds>;

  copy.add = (m) =>
    chain(
      composeMiddleware(
        middleware,
        m,
      ),
    );

  return copy;
}
