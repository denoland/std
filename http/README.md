# http

Deno's standard HTTP server based on the
[blazing fast native http API](https://deno.land/manual/runtime/http_server_apis#http-server-apis).

## Table of Contents

- [Minimal Server](#minimal-server)
- [Handling Requests](#handling-requests)
  - [HTTP Status Codes and Methods](#http-status-codes-and-methods)
- [Middleware](#middleware)
  - [Writing Simple Middleware]()
  - [Request Context]()
  - [Using Middleware]()

## Minimal Server

Run this file with `--allow-net` and try requesting `http://localhost:8000`:

```ts
import { listenAndServe } from "https://deno.land/std@$STD_VERSION/http/mod.ts";

await listenAndServe(":8000", () => new Response("Hello World"));
```

## Handling Requests

`listenAndServe` expects a `Handler`, which is a function that receives an
[`HttpRequest`](https://doc.deno.land/https/deno.land/std/http/mod.ts#HttpRequest)
and returns a [`Response`](https://doc.deno.land/builtin/stable#Response):

```typescript
export type Handler = (request: HttpRequest) => Response | Promise<Response>;
```

`std/http` follows web standards, specifically parts of the Fetch API.

`HttpRequest` is an extension of the
[`Request` web standard](https://developer.mozilla.org/en-US/docs/Web/API/Request),
adding connection information and some helper functions to make it more
convenient to use on servers. The expected return value follows the same Fetch
standard and is expected to be a
[`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

Here is an example handler that echoes the request body:

```typescript
const handle: Handler = (req) => {
  return new Response(
    req.body,
    { status: 200 },
  );
};
```

## HTTP Status Codes and Methods

The `Status` and `Method` enums offer helper constants for standard HTTP status
codes and methods:

```ts
import {
  Handler,
  listenAndServe,
  Method,
  Status,
} from "https://deno.land/std@$STD_VERSION/http/mod.ts";

const handle: Handler = (req) => {
  if (req.method !== Method.Get) {
    // Will respond with an empty 404
    return new Reponse(null, { status: Status.NotFound });
  }

  return new Response("Hello!");
};

await listenAndServe(":8000", handle);
```

## Middleware

Middleware is a common pattern to include recurring logic done on requests and
responses like deserialization, compression, validation, CORS etc.

A middleware is a special kind of `Handler` that can pass control on to a next
handler during its flow, allowing it to only solve a specific part of handling
the request without needing to know about the rest. The next handler can also be
middleware itself, enabling to build chains like this:

```
Request ----------------------------------------->

log - authenticate - parseJson - validate - handle

<-----------------------------------------Response
```

Middleware is just a handler that **can** call the next handler to pass on
control.

Middleware will sometimes be used to ensure that some condition is met before
passing the request on (e.g. authentication, validation), to pre-process
requests in some way to make handling them simpler and less repetitive
(deserialization, database preloading) or to format responses in some way (CORS,
compression).

`std/http` has a simple, yet powerful, strongly typed middleware system.

### Writing Middleware

Writing middleware is the same as writing a `Handler`, except that it gets
passed an additional argument - canonically called `next` - which is a handler
representing the rest of the chain after our middleware. `std/http` exports a
`Middleware` function type that can be used to write Middleware.

Let's look at an example. A simple middleware that logs requests could be
written like this:

```typescript
import { Middleware } from "https://deno.land/std@$STD_VERSION/http/mod.ts";

export const log: Middleware = async (req, next) => {
  const start = performance.now();
  const res = await next(req);
  const duration = performance.now() - start;

  console.log(
    `${req.method} ${req.url} - ${res.status}, ${duration.toFixed(1)}ms`,
  );

  return res;
};
```

This will log a message to stdout for every request, noting how long it took to
respond, the requests method and url and the response's status code.

Note that we choose when or even if we call `next` and what to do with its
result. `next` is just a handler function and as long as our middleware returns
a `Response`, it does not matter how we produced it.

### Request Context

Sometimes you want your middleware to pass information onto the handlers after
it. The way to do that is request context.

Each `HttpRequest`s has an attached `context` object. Arbitrary properties with
arbitrary data can be added to the context via the `.addContext()` method to
later be read by other functions handling the same request.

Contexts are very strictly typed to prevent runtime errors.

To write middleware in typescript, there are two things to decide upfront:

### Adding Context

The `Middleware` type actually takes two optional type arguments:

- Context of previous middleware we need
- Context we add for handlers after us to consume

Both default to the `EmptyContext`. Let's look at an example on how to add
context:

Assume our server wants to accept data in the YAML format. To deal with the YAML
parsing and error handling, we could write a middleware like this:

```typescript
import {
  EmptyContext,
  Middleware,
  Status,
} from "https://deno.land/std@$STD_VERSION/http/mod.ts";
import { parse } from "https://deno.land/std@$STD_VERSION/encoding/yaml.ts";

export const yaml: Middleware<EmptyContext, { data: unknown }> = async (
  req,
  next,
) => {
  let data: unknown;

  try {
    const rawBody = await req.text();
    data = parse(rawBody);
  } catch {
    return new Response(
      "Could not parse input. Please provide valid YAML",
      { status: Status.UnsupportedMediaType },
    );
  }

  const newReq = req.addContext({ data });

  return await next(newReq);
};
```

This will respond early with an error if the request does not contain a valid
YAML body and will otherwise parse that YAML, add the parsed Javascript value to
the request context and pass that on to the rest of the chain.

The Typescript compiler will ensure that we actually pass the promised `data`
property in the context to the `next` handler, because we told it that we will
by setting `Middleware`s second type parameter.

### Reading Context

Assume our server only accepts a list of strings as an input and we want to
write a middleware that handles that validation.

To do that, we need to access the previously added `data` property on the
context:

```typescript
import { Middleware } from "../../../middleware.ts";

export const validate: Middleware<{ data: unknown }, { data: string[] }> = (
  req,
  next,
) => {
  const { data } = req.context;

  if (Array.isArray(data) && data.every((it) => typeof it === "string")) {
    const newReq = req.addContext({
      data: data as string[],
    });

    return next(newReq);
  }

  return new Response(
    "Invalid input, expected an array of string",
    { status: 422 },
  );
};
```

This will check if the parsed `data` value is an Array and if every element in
it is a string. If that is true, it will pass on to the rest of the chain. Note
that we actually change the context - we declare that after our middleware, the
`data` property has the type `string[]` instead of the previous `unknown`.

Without explicitly declaring in the `Middleware` type that we depend on `data`
in the context, Typescript would not have let us access it on the request
context.

### Chaining Middleware

To chain middleware, use the `chain()` function:

```typescript
import { chain } from "https://deno.land/std@$STD_VERSION/http/mod.ts";
import { auth, cors } from "./my_middleware.ts";

function sayHello() {
  return new Response("Hello");
}

const handler = chain(auth)
  .add(cors)
  .add(sayHello);

await listenAndServe(":8000", handler);
```

This will pass requests through `auth`, which passes on to `cors`, which passes
them on to `sayHello`, with the response from `sayHello` taking the reverse way.

A chain is itself just a middleware again, so you can pass around and nest
chains as much as you like. This (nonsensical) example does the exact same as
the one above:

```typescript
import { chain } from "https://deno.land/std@$STD_VERSION/http/mod.ts";
import { auth, cors } from "./my_middleware.ts";

function sayHello() {
  return new Response("Hello");
}

const core = chain(cors)
  .add(sayHello);

const handler = chain(auth)
  .add(core);

await listenAndServe(":8000", handler);
```

### Chain Type Safety

Middleware chains built with the `chain()` function are type safe and
order-aware regarding request context, even for arbitrary nesting.

This means that Typescript will error if you try to use a chain as a handler for
e.g. `listenAndServe` if that chain does not satisfy all its internal context
requirements itself in the right order. An example using the two middleares we
wrote above:

```typescript
const handle: Handler<{ data: string[] }> = (req) => {
  const { data } = req.context;

  return new Response(
    data
      .map((it) => `Hello ${it}!`)
      .join("\n"),
  );
};
```

This will not pass the type checker:

```typescript
const handleStringArray = chain(validate)
  .add(yaml)
  .add(handle);

await listenAndServe(":8000", handleStringArray);
```

But this will:

```typescript
const handleStringArray = chain(yaml)
  .add(validate)
  .add(handle);

await listenAndServe(":8000", handleStringArray);
```

## File Server

There is a small server that serves files from the folder it is running in using
this module:

```sh
deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts
> HTTP server listening on http://localhost:4507/
```

## Cookies

The module exports some helpers to read and write cookies:

### getCookies

`getCookies` reads cookies from a given `Headers` object:

```ts
import { getCookies } from "https://deno.land/std@$STD_VERSION/http/mod.ts";

const headers = new Headers();
headers.set("Cookie", "full=of; tasty=chocolate");

const cookies = getCookies(headers);
console.log(cookies); // { full: "of", tasty: "chocolate" }
```

### setCookie

`setCookie` will set a cookie on a given `Headers` object:

```ts
import {
  Cookie,
  setCookie,
} from "https://deno.land/std@$STD_VERSION/http/mod.ts";

const headers = new Headers();
const cookie: Cookie = { name: "Space", value: "Cat" };
setCookie(headers, cookie);

const cookieHeader = headers.get("set-cookie");
console.log(cookieHeader); // Space=Cat
```

### deleteCookie

`deleteCookie` will delete a cookie on a given `Headers` object:

> Note: Deleting a `Cookie` will set its expiration date before now. Forcing the
> browser to delete it.

```ts
import { deleteCookie } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

const headers = new Headers();
deleteCookie(headers, "deno");

const cookieHeader = headers.get("set-cookie");
console.log(cookieHeader); // deno=; Expires=Thus, 01 Jan 1970 00:00:00 GMT
```

> Note: It is possible to pass the exact same path and domain attributes that
> were used to set the cookie.

```ts
import { deleteCookie } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

const headers = new Headers();
deleteCookie(headers, "deno", { path: "/", domain: "deno.land" });
```

> Note: At the moment multiple `Set-Cookie` in a `Response` is not handled.
