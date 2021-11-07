# `std/http/middleware`

## Goals

- Make `std/http` API ergonomic and powerful enough to drive actual applications out of the box
  - Similar to most http frameworks, there should be an ergonomic central `req => res` API
    offering all information needed in the context of a single request
  - Establish minimal but complete middleware pattern that can be used to build out-of-the-box
    and third-party middleware in the future to cover very common use cases like CORS, compresison,
    deserialization, logging etc. Middleware should be...
    - ...just a function, there should be no magic, just a straight callstack
    - ...as composable and modularizable as possible
    - ...type(script) safe to use and combine, ensuring correct middleware context and order

## Changes

This PR contains the following changes:

### `HttpRequest` Delegate Wrapper

Adds an `HttpRequest`-class (got a better name? please say so!) that wraps a `Request` object,
delegating to it (and thus implementing the `Request` API interface itself) and adding convenience
methods and properties to have a unified API:

- A `connInfo` property, holding the `connInfo` that was passed separately before
- A lazy `parsedUrl` property to access a `URL` object for the request url
- A `context` object to hold request context with an `.addContext()` method to add onto it

Note that there should probably be a lot more convenience methods here - like a (`CookieStore` compatible?) lazy cookie reading
API, maybe a way to access parsed content types lazily etc - I just wanted to create a space where that is possible and clean up
the API without bloating the PR too much.

### **BREAKING**: `Handler` Signature

The `Handler` signature has been reduced to just `req: HttpRequest => Response`.

**This only breaks code that relies on the second `connInfo` argument that was removed**. Code that just depends on the request
will continue to work, as `HttpRequest implements Request`.

This cleans up the API, creating a place to add more request information onto in `HttpRequest` instead of adding more parameters
while also enabling the established middleware signature in the change below.

### `Middleware` & `chain()`

Adds a `chain()` utiltiy that allows to chain `(req: HttpRequest, next: Handler) => Response` middleware together with very little
code in a type safe, order aware manner. Chains can be arbitrarily nested and, given that their request context types are sound,
are directly assignable as `Handler`s:

```typescript
const handler = chain(parseMiddleware)
    .add(validateMiddleware)
    .add(dataHandler);

await listenAndServe(":8000", handler);
```

The actual runtime code of `chain()` is very small (like 20 lines in total), but the type safety and resulting DX is made possible
by typing code around the `Middleware` type, which helps users to write middleware by infering the correct types for parameters
as well as forcing middleware authors to explicitly declare their type impact on request context, allowing consumers to get LSP
/ compiler feedback when using their middleware.

### README Docs

Adds brief docs on what middleware is in general, how to use it and how to write it.

Adds brief docs on `HttpRequest`.

Also expands the other sections a bit, trying to streamline a storyline.

Removes docs about the legacy server.

## Try it out

Under `http/middleware/example/ts` you find a server using the middleware examples from the docs.
