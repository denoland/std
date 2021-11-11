import type { Handler } from "./server.ts";
import type { EmptyContext, HttpRequest } from "./request.ts";
import type { CommonKeys, Expand, SafeOmit } from "../_util/types.ts";

/**
* Middleware to deal with some part of handling a request. It will be paseed a
* `next` handler that it can call at any point point, adding its own logic,
* request context and transformations befor or after it. Can express the
* request context (see `HttpRequest.context`) it requires to work and any
* request context it will add to be available to the `next` handler.
*
* @typeParam Needs - Request context required by this Middleware, defaults to
* `EmptyContext` which is the empty object
*
* @typeParam Adds - Request context this Middleware will add and thus make
* available to the `next` Middleware, defaults to `EmptyContext` which is the empty object
*
* Example:
*
* ```ts
* import { Middleware } from "https://deno.land/std@$STD_VERSION/http/mod.ts";
*
* // Log response time, method and path for requests going through this middleware
* const log: Middleware = async (req, next) => {
*   const start = performance.now();
*   const response = await next(req);
*   const end = performance.now();

*   console.log(
*     `${req.method} ${new URL(req.url).pathname} ${response.status} ${end - start}ms`
*   );

*   return response;
* };
* ```
*/
export type Middleware<
  Needs extends EmptyContext = EmptyContext,
  Adds extends EmptyContext = EmptyContext,
> = (
  req: HttpRequest<Needs>,
  next: Handler<Expand<MergeContext<Needs, Adds>>>,
) => Response | Promise<Response>;

/**
 * A `Middleware` that can be chained onto with `.add()`. Use `chain()` to start
 * a `MiddlewareChain`.
 */
export type MiddlewareChain<
  Needs extends EmptyContext,
  Adds extends EmptyContext = EmptyContext,
> = {
  (
    req: Parameters<Middleware<Needs, Adds>>[0],
    next: Parameters<Middleware<Needs, Adds>>[1],
  ): ReturnType<Middleware<Needs, Adds>>;

  /**
   * Append a given handler to this chain, terminating it, returning a new handler.
   *
   * Example:
   *
   * ```ts
   * import { Middleware, Handler, chain } from "https://deno.land/std@$STD_VERSION/http/mod.ts";
   *
   * const first: Middleware = async (req, next) => {
   *   console.log("Hey");
   *   return await next(req);
   * };
   *
   * const second: Middleware = async (req, next) => {
   *   console.log("there!");
   *   return await next(req);
   * };
   *
   * const helloWorld: Handler = (req) => new Response("Hello world");
   *
   * // This Handler will log "Hey", log "there!" and then respond with "Hello World"
   * const handler = chain(first)
   *   .add(second)
   *   .add(helloWorld);
   * ```
   */
  add<AddedNeeds>(
    handler: Handler<AddedNeeds>,
  ): Handler<
    Expand<Needs & SafeOmit<AddedNeeds, Adds>>
  >;

  /**
   * Append a given middleware to this chain, returning a new
   * `MiddlewareChain`.
   *
   * Example:
   *
   * ```ts
   * import { Middleware, chain } from "https://deno.land/std@$STD_VERSION/http/mod.ts";
   *
   * const first: Middleware = async (req, next) => {
   *   console.log("Hey");
   *   return await next(req);
   * };
   *
   * const second: Middleware = async (req, next) => {
   *   console.log("there!");
   *   return await next(req);
   * };
   *
   * // This middleware will log "Hey", log "there!" and pass on to whatever is appended to it
   * const middleware = chain(first)
   *   .add(second);
   * ```
   */
  add<AddedNeeds, AddedAdds>(
    middleware: Middleware<AddedNeeds, AddedAdds>,
  ): MiddlewareChain<
    Expand<Needs & SafeOmit<AddedNeeds, Adds>>, // todo does safeomit handle assignability? e.g. require string, provide 'a'
    Expand<MergeContext<Adds, AddedAdds>>
  >;
};

function composeMiddleware<
  FirstNeeds extends EmptyContext,
  FirstAdd extends EmptyContext,
  SecondNeeds extends EmptyContext,
  SecondAdd extends EmptyContext = EmptyContext,
>(
  first: Middleware<FirstNeeds, FirstAdd>,
  second: Middleware<SecondNeeds, SecondAdd> | Handler<SecondNeeds>,
): Middleware<
  Expand<FirstNeeds & SafeOmit<SecondNeeds, FirstAdd>>,
  Expand<MergeContext<FirstAdd, SecondAdd>>
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

/** Wraps the given handler, doing nothing and returning a copy */
export function chain<Needs extends EmptyContext>(
  handler: Handler<Needs>,
): Handler<Needs>;

/** Wraps the given middleware in a `MiddlewareChain` so it can be `.add()`ed onto */
export function chain<
  Needs extends EmptyContext,
  Adds extends EmptyContext = EmptyContext,
>(
  middleware: Middleware<Needs, Adds>,
): MiddlewareChain<Needs, Adds>;

export function chain<
  Needs extends EmptyContext,
  Adds extends EmptyContext = EmptyContext,
>(
  middleware: Middleware<Needs, Adds> | Handler<Needs>,
): MiddlewareChain<Needs, Adds> | Handler<Needs> {
  const copy = middleware.bind({}) as typeof middleware;

  // @ts-ignore the type is already defined and the implementation is the same
  copy.add = (m) =>
    chain(
      composeMiddleware(
        middleware,
        m,
      ),
    );

  return copy as MiddlewareChain<Needs, Adds> | Handler<Needs>;
}

type LeftDistinct<
  Left extends EmptyContext,
  Right extends EmptyContext,
> = {
  [Prop in keyof Omit<Left, keyof Right>]: Left[Prop];
};

type CommonMerge<
  Left extends EmptyContext,
  Right extends EmptyContext,
> = {
  [Prop in CommonKeys<Left, Right>]: Right[Prop] extends never ? Left[Prop]
    : Right[Prop];
};

type MergeContext<
  Left extends EmptyContext,
  Right extends EmptyContext,
> =
  & CommonMerge<Left, Right>
  & LeftDistinct<Left, Right>
  & LeftDistinct<Right, Left>;
