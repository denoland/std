# `std/http/middleware` Concept

## Goals

- **Establish a middleware concept that enables `std/http` to be used for actual
  applications** directly in the future. Once a pattern is established, there
  are already some modules in `std` that could easily be wrapped into
  out-of-the-box middleware
- **Allow middleware and composed middleware stacks to just be a function** that
  takes some form of request and returns a response, optionally calling the next
  middleware. This ensures that we deal with normal call stacks, allows errors
  to bubble up as expected and reduces the amount of black magic happening at
  runtime
- **Be completely type safe, including middleware order and arbitrary middleware
  composition.** This means I want the type checker to stop me from registering
  a handler on the server that assumes that certain information is available
  from previous middlewares (e.g. auth info, parsed and validated bodies...),
  even though that middleware is not present in that handler's chain. Just
  having a global state that can be typed and is assumed to always be present in
  every function is not good enough - we are dealing with a chain of functions
  here, we should leverage Typescript and make sure that that chain actually
  works type-wise.
- The middleware signature should **be compatible to the `Server`s `Handler`
  signature**. Composing middleware should always just return a new middleware,
  so that compositions can be modularized and passed around opaquely

## POC

[Here is a branch](https://github.com/LionC/deno_std/tree/middleware-experiment/http) in
which I have built a small dirty POC fullfiling the goals above. **This is just
to show the idea**. It is not fleshed out, very rough around a lot of edges,
has subpar ergonomics and several straight up bugs. All of them are solvable in
several ways and their solution is not vital to the concept, so I left them as
they are for the sake of starting a conversation.

I stopped writing as soon as I was sure enough that this can be done
reasonably. There are many ways to do this basic concept and a lot of them are
viable - I did not want to invest into one of them, just have something to
start talking.

### API

The POC contains three components. Their actual runtime code is really small -
most of the code around it (and most todos to fix the bugs / ergonomics issues)
is just types.

The components are:

- A `Middleware` function type with two important generic type parameters:
  - What type the middleware expects (e.g. it needs a semantic auth field on top
    of the normal request)
  - Optionally, what information the middleware adds to the request "context"
    (e.g. validating the body to be a valid `Animal` and adding an
    `animal: Animal` property) It could be used like this (lots of abstracted
    ideas in there to show the idea):

  ```typescript
  const validateAnimal: Middleware<Request, { animal: Animal }> = async (
    req,
    con,
    next,
  ) => {
    const body = extractBody(req);

    if (!isAnimal(body)) {
      return new Response(
        "Invalid Animal",
        { status: 422 },
      );
    }

    const nextReq = extend(req, { animal: body });

    return await next!(nextReq, con);
  };
  ```
- A `composeMiddleware` function that takes two `Middleware`s and returns a new
  `Middleware` that is a composition of both in the given order. The resulting
  `Middleware` adds a union of what both arguments add and requires a union of
  what both arguments require, except the intersection between what the first
  one adds and the second one requires, as that has already been satisfied
  within the composition.

  It could be used like that:

  ```typescript
  declare const authenticate: Middleware<Request, { auth: AuthInfo }>;
  declare const authorize: Middleware<Request & { auth: AuthInfo }>;

  const checkAccess = composeMiddleware(authenticate, authorize);

  assertType<Middleware<Request, { auth: AuthInfo }>>(checkAccess);
  ```

  `composeMiddleware` is the atomic composition and type checking step but not
  very ergonomic to use, as it can only handle two middlewares being combined.
- A `stack` helper that wraps a given `Middleware` in an object thas has a
  chainable `.add()` method. This allows for nicer usage and follows the usual
  `.use()` idea in spirit. It can used like this:

  ```typescript
  declare const authenticate: Middleware<Request, { auth: AuthInfo }>;
  declare const authorize: Middleware<Request & { auth: AuthInfo }>;
  declare const validateAnimal: Middleware<Request, { animal: Animal }>;

  const authAndValidate = stack(authenticate)
    .add(authorize)
    .add(validateAnimal)
    .handler;

  assertType<Middleware<Request, { auth: AuthInfo; animal: Animal }>>(
    authAndValidate,
  );
  ```

  This essentially just wraps `composeMiddleware` to be chainable with correct
  typing.

  Notice the `.handler` at the end - this extracts the actual function again.
  There might be nicer ways to do it, but the concept works for the sake of
  discussion.

The components above fulfill the goals mentioned above:

- `Middleware` is just a function, including the result of an arbitrary
  `stack().add().add().add().handler` chain
- `Middleware<Request> is assignable to`std/http``Handler` - meaning there is no
  additional wrapping necessary
- Middleware composition is completely type safe and order-aware. This means
  that all requirements that are present but not fulfilled by previous
  middleware "bubbles up" and will type error when trying to register it on the
  `Server`, stating which properties are missing

  To be fair, it makes some assumptions. It assumes that you always add the same
  type to your `next` call, so if you have conditional calls, you need to
  "flatten" the types. It also assumes that you do not throw away the previous
  request context. However, I think those are reasonable assumptions and they
  are also present (and a lot less safe) in the current TS middleware concepts
  e.g. in koa / oak.

### Play around with it

To run a small server with some middleware from the POC branch, follow the steps
below. **The implemented middleware is just for presentation purposes**, it's
implementation is very bad, but it works to show the idea.

1. Check out the branch, e.g. with
   `$ git remote add lionc git@github.com:LionC/deno_std.git && git fetch && git switch middleware-experiment`
2. Start the server with `$ deno run --allow-net http/middleware/poc/server.ts`
3. Throw some requests at it, here are some `httpie` example commands:

- Succeed (without any animals): `http --json 0.0.0.0:5000/ name=My entryFee:=10 animals:='[{"name": "Kim", "kind": "Tiger"}, {"name": "Flippo", "kind": "Hippo"}, {"name": "Jasmin", "kind": "Tiger"}]'`
- Fail validation: `$ http --json 0.0.0.0:5000/ name=My entryFee:=10`
- Fail JSON content type: `$ http --form 0.0.0.0:5000/ name=My entryFee:=10`

`http/middleware/poc/server.ts` is also a good place to play around with the type safe composition - try changing the order of middleware, leave a vital one out and see how LSP / tsc react.

## What now?

There are two questions to answer here:

- What have I missed? Is this something we want to go deeper on? I did not want
  to invest more time into figuring out all the details before there is some
  input on the core idea
- How do we want the API for application and middleware authors to look like?
  See my take on `Request` below. The pattern above works either way, but I
  think we should take a look at that.

### On `Request` and API ergonomic

While working on this and trying to write some middlewares, I really felt that
the current `Handler` signature is quite...weird. I get why it looks that way,
but from an API perspective, it does not make a lot of sense that two arbitrary
fields about the incoming request are separated into their own argument. It also
does not make a lot of sense that some arbitrary functionality that would be
expected on the request parameter needs to be separately `import`ed as a
function and called on that object. There is also not really a nice way to add
new things to a request in a type safe way.

Following `Request` makes a lot of sense, it being a Web standard and all. But I
think it could make sense to `extend` `Request` in `std/http` to have one
central API for everything concerning the incoming request - including
`connInfo`, a simple helper to add to some kind of request context, helpers to
get common info like parsed content types, get cookies etc while still following
`Request` for everything it offers.
