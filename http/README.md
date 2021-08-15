# http

http is a module to provide HTTP client and server implementations.

## Server

Server APIs using a JavaScript HTTP server implementation.

```ts
import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";

const server = serve({ port: 8000 });
console.log("http://localhost:8000/");

for await (const req of server) {
  req.respond({ body: "Hello World\n" });
}
```

## Native Server

Server APIs utilizing Deno's
[native HTTP server APIs](https://deno.land/manual/runtime/http_server_apis#http-server-apis).

```ts
import { listenAndServe } from "https://deno.land/std@$STD_VERSION/http/native_server.ts";

listenAndServe(":8000", () => new Response("Hello World\n"));

console.log("http://localhost:8000/");
```

## File Server

A small program for serving local files over HTTP.

```sh
deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts
> HTTP server listening on http://0.0.0.0:4507/
```

## Cookie

Helper to manipulate `Cookie` through `ServerRequest` and `Response`.

```ts
import { ServerRequest } from "https://deno.land/std@$STD_VERSION/http/server.ts";
import { getCookies } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

let request = new ServerRequest();
request.headers = new Headers();
request.headers.set("Cookie", "full=of; tasty=chocolate");

const cookies = getCookies(request);
console.log("cookies:", cookies);
// cookies: { full: "of", tasty: "chocolate" }
```

To set a `Cookie` you can add `CookieOptions` to properly set your `Cookie`:

```ts
import { Response } from "https://deno.land/std@$STD_VERSION/http/server.ts";
import {
  Cookie,
  setCookie,
} from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

let response: Response = {};
const cookie: Cookie = { name: "Space", value: "Cat" };
setCookie(response, cookie);

const cookieHeader = response.headers!.get("set-cookie");
console.log("Set-Cookie:", cookieHeader);
// Set-Cookie: Space=Cat
```

Deleting a `Cookie` will set its expiration date before now. Forcing the browser
to delete it.

```ts
import { Response } from "https://deno.land/std@$STD_VERSION/http/server.ts";
import { deleteCookie } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

let response: Response = {};
deleteCookie(response, "deno");

const cookieHeader = response.headers!.get("set-cookie");
console.log("Set-Cookie:", cookieHeader);
// Set-Cookie: deno=; Expires=Thus, 01 Jan 1970 00:00:00 GMT
```

> Note: It is possible to pass the exact same path and domain attributes that
> were used to set the cookie.

```ts
import { Response } from "https://deno.land/std@$STD_VERSION/http/server.ts";
import { deleteCookie } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

let response: Response = {};
deleteCookie(response, "deno", { path: "/", domain: "deno.land" });
```

**Note**: At the moment multiple `Set-Cookie` in a `Response` is not handled.
