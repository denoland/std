# `std/http/` Request API and Middleware

After delaying this again and again to polish it, here is a (evolved) review-ready version
of POC in the linked issue #1295 .

Bedore I go into the ideas and changes here, I want to give some credt. Even though
I wrote the code, I want to explicitly mention and thank:

- @keithamus for constant sparring and brainstorming during the process of writing this
- @happenslol for several feedback rounds on the API and inspiration from other languages
- @Hakizu , @Andreu and @grian for feedback on the docs

## Goals

- Make the `std/http` API ergonomic and powerful enough to be ready to drive actual applications
  reasonably out of the box at some point
  - Similar to most http frameworks, there should be an ergonomic central
    `req => res` API offering all information needed regarding a specific
    request
  - Establish a minimal but complete middleware pattern that can be used to build
    out-of-the-box and third-party middleware in the future to cover very common
    use cases like CORS, compresison, deserialization, logging etc. Middleware
    should be...
    - ...just a function, there should be no magic and no additional IOC style runtime stuff, just a straight callstack
    - ...as composable and modularizable as possible
    - ...able to handle Errors with normal JS constructs
    - ...type(script) safe to use and combine, ensuring correct middleware
      context, order and termination. Middleware should not be less safe than
      combining normal functions

## Changes

I try to summarize the changes in the PR below, but I would highly encourage reading the docs - they
are an important part of the module and should be good at explaining the concepts.

### `HttpRequest` Delegate Wrapper

Adds an `HttpRequest`-class (got a better name? please say so!) that wraps a
`Request` object, delegating to it (and thus implementing the `Request` API
interface itself) and adding convenience methods and properties to have a
unified API:

- A `connInfo` property, holding the `connInfo` that was passed separately
  before
- A lazy `parsedUrl` property to access a `URL` object for the request url (as a start for convenience APIs)
- A `context` object to hold (initally empty) request context with an `.addContext()` method to
  add onto it

Note that there should probably be a lot more convenience methods here - like a
(`CookieStore` compatible?) lazy cookie reading API, maybe a way to access
parsed content types lazily etc - I just wanted to create a space where that is
possible and clean up the API without bloating the PR too much.

### **BREAKING**: `Handler` Signature

The `Handler` signature has been reduced to just `req: HttpRequest => Response`.

**This only breaks code that relies on the positional `connInfo` argument that was
removed**. Code that just depends on the request will continue to work, as
`HttpRequest implements Request`.

This cleans up the API, creating a place to add more request information onto in
`HttpRequest` instead of adding more parameters while also enabling the
established middleware signature in the change below.

### `Middleware` & `chain()`

Adds a `chain()` utiltiy that allows to chain
`(req: HttpRequest, next: Handler) => Response` middleware together with very 
little actual runtime code in a type safe, order aware manner. Chains can be arbitrarily nested,
understand when they are terminated and will generally stop you from running into runtime errors.

Terminated chains are actual `Handler`s and thus cann be passed to `serve`:

```typescript
const handler = chain(parseMiddleware)
  .add(validateMiddleware)
  .add(dataHandler);

await serve(handler);
```

The actual runtime code of `chain()` is very small (like 20 lines in total), but
the type safety and resulting DX is made possible by typing code around the
`Middleware` type, which is the TS way to write middleware, enforcing middleware
authors to be type safe. The typing code mostly constraints what one can do
to provide maximum safety and instant LSP feedback.

### README Docs

Adds a table of contents to the `README`, and a section about Middleware,
while integrating the other changes and lightly touching up some of the other
docs.

Removes docs about the legacy server.

## Try it out

Under `http/middleware/example.ts` you find a server using the middleware
examples from the docs.
