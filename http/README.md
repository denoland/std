- Minimal server
- Handlers
- Middleware
- Remove Legacy Server

# PR

- Wrap Request
  - Why
    - Have single API
    - Allows for cookies, comtext, lazy utilities…

# http

Deno's standard HTTP server based on the [blazing fast native http API](https://deno.land/manual/runtime/http_server_apis#http-server-apis) under the hood.

## Minimal Server

Run this file with `--allow-net` and try requesting `http://localhost:8000`:

```ts
import { listenAndServe } from "https://deno.land/std@$STD_VERSION/http/mod.ts";

await listenAndServe(":8000", () => new Response("Hello World"));
```

## Handling Requests

`listenAndServe` expects a `Handler`, which is a function that receives an `HttpRequest` and returns a `Response`:

```typescript
export type Handler = (request: HttpRequest) => Response | Promise<Response>;
```

`std/http` follows web standards, specifically parts of the Fetch API. `HttpRequest` is an extenstion of the
[`Request` web standard](TODO MDN LINK), adding connection information and some helper functions to make it
more convenient to use on servers. The expected return value follows the same standard and is expected to be
a [`Response`](TODO MDN LINK).

Here is an example handler that echoes the request body 

## File Server

A small program for serving local files over HTTP.

```sh
deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts
> HTTP server listening on http://localhost:4507/
```

## HTTP Status Code and Status Text

Helper for processing status code and status text.

```ts
import {
  Status,
  STATUS_TEXT,
} from "https://deno.land/std@$STD_VERSION/http/http_status.ts";

console.log(Status.NotFound); //=> 404
console.log(STATUS_TEXT.get(Status.NotFound)); //=> "Not Found"
```

## Cookie

Helpers to manipulate the `Cookie` header.

### getCookies

```ts
import { getCookies } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

const headers = new Headers();
headers.set("Cookie", "full=of; tasty=chocolate");

const cookies = getCookies(headers);
console.log(cookies); // { full: "of", tasty: "chocolate" }
```

### setCookie

```ts
import {
  Cookie,
  setCookie,
} from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

const headers = new Headers();
const cookie: Cookie = { name: "Space", value: "Cat" };
setCookie(headers, cookie);

const cookieHeader = headers.get("set-cookie");
console.log(cookieHeader); // Space=Cat
```

### deleteCookie

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
