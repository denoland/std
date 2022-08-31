# http

`http` is a module to provide HTTP client and server implementations.

## Server

Server APIs utilizing Deno's
[HTTP server APIs](https://deno.land/manual/runtime/http_server_apis#http-server-apis).

```ts
import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";

serve(() => new Response("Hello World\n"));

console.log("http://localhost:8000/");
```

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
console.log(STATUS_TEXT[Status.NotFound]); //=> "Not Found"
```

## HTTP errors

Provides error classes for each HTTP error status code as well as utility
functions for handling HTTP errors in a structured way.

For example throwing an error and detecting thrown errors as HTTP errors, and
setting values in a response.

```ts
import {
  errors,
  isHttpError,
} from "https://deno.land/std@$STD_VERSION/http/http_errors.ts";

try {
  throw new errors.NotFound();
} catch (e) {
  if (isHttpError(e)) {
    const response = new Response(e.message, { status: e.status });
  } else {
    throw e;
  }
}
```

Also the `createHttpError()` function can be used to create errors:

```ts
import { createHttpError } from "https://deno.land/std@$STD_VERSION/http/http_errors.ts";
import { Status } from "https://deno.land/std@$STD_VERSION/http/http_status.ts";

try {
  throw createHttpError(
    Status.BadRequest,
    "The request was bad.",
    { expose: false },
  );
} catch (e) {
  // handle errors
}
```

### `errors`

A namespace that contains each error constructor. Each error extends `HTTPError`
and provides `.status` and `.expose` properties, where the `.status` will be an
error `Status` value and `.expose` indicates if information, like a stack trace,
should be shared in the response.

By default, `.expose` is set to false in server errors, and true for client
errors.

### `HttpError`

The base case for all other HTTP errors, which extends `Error`.

### `createHttpError()`

A factory function which provides a way to create errors. It takes up to 3
arguments, the error `Status`, an message, which defaults to the status text and
error options, which incudes the `expose` property to set the `.expose` value on
the error.

### `isHttpError()`

A type guard that checks if a value is an HTTP error.

## Negotiation

A set of functions which can be used to negotiate content types, encodings and
languages when responding to requests.

> Note: some libraries include accept charset functionality by analyzing the
> `Accept-Charset` header. This is a legacy header that
> [clients omit and servers should ignore](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Charset)
> therefore is not provided.

### accepts()

Used to determine what content type the requestor supports via analyzing the
`Accept` header. Just passing a request to the accept function will return the
clients accepted content in order of preference:

```ts
import { accepts } from "https://deno.land/std@$STD_VERSION/http/negotiation.ts";

const req = new Request("https://example.com/", {
  headers: {
    "accept":
      "text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, */*;q=0.8",
  },
});

console.log(accepts(req));
// [
//   "text/html",
//   "application/xhtml+xml",
//   "image/webp",
//   "application/xml",
//   "*/*",
// ]
```

Providing supported content types will cause the function to return the "best"
match:

```ts
import { accepts } from "https://deno.land/std@$STD_VERSION/http/negotiation.ts";

const req = new Request("https://example.com/", {
  headers: {
    "accept":
      "text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, */*;q=0.8",
  },
});

accepts(req, "text/html", "image/webp"); // "text/html";
```

### acceptsEncodings()

Used to determine what content encoding the requestor supports via analyzing the
`Accept-Encoding` header. Just passing a request to the function will return the
clients accepted content encodings in order of preference:

```ts
import { acceptsEncodings } from "https://deno.land/std@$STD_VERSION/http/negotiation.ts";

const req = new Request("https://example.com/", {
  headers: { "accept-encoding": "deflate, gzip;q=1.0, *;q=0.5" },
});

acceptsEncodings(req); // ["deflate", "gzip", "*"]
```

Providing the supported content encodings will cause the function to return the
"best" match. Note that `"indentity"` should always be included as it is the
_base_ encoding:

```ts
import { acceptsEncodings } from "https://deno.land/std@$STD_VERSION/http/negotiation.ts";

const req = new Request("https://example.com/", {
  headers: { "accept-encoding": "deflate, gzip;q=1.0, *;q=0.5" },
});

acceptsEncodings(req, "gzip", "identity"); // "gzip"
```

### acceptsLanguages()

Used to determine what content languages the requestor supports via analyzing
the `Accept-Language` header. Just passing a request to the function will return
the clients accepted content languages in order of preference:

```ts
import { acceptsLanguages } from "https://deno.land/std@$STD_VERSION/http/negotiation.ts";

const req = new Request("https://example.com/", {
  headers: {
    "accept-language": "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5",
  },
});

acceptsLanguages(req); // ["fr-CH", "fr", "en", "de", "*"]
```

Providing the supported content languages will cause the function to return the
"best" match:

```ts
import { acceptsLanguages } from "https://deno.land/std@$STD_VERSION/http/negotiation.ts";

const req = new Request("https://example.com/", {
  headers: {
    "accept-language": "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5",
  },
});

acceptsLanguages(req, "en-gb", "en-us", "en"); // "en"
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

### getSetCookies

```ts
import { getSetCookies } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";

const headers = new Headers([
  ["Set-Cookie", "lulu=meow; Secure; Max-Age=3600"],
  ["Set-Cookie", "booya=kasha; HttpOnly; Path=/"],
]);

const cookies = getSetCookies(headers);
console.log(cookies); // [{ name: "lulu", value: "meow", secure: true, maxAge: 3600 }, { name: "booya", value: "kahsa", httpOnly: true, path: "/ }]
```

## Cookie maps

An alternative to `cookie.ts` is `cookie_map.ts` which provides `CookieMap`,
`SecureCookieMap`, and `mergeHeaders` to manage request and response cookies
with the familiar `Map` interface.

### CookieMap

Provides methods that are aligned to the JavaScript `Map` interface to manage
cookies:

```ts
import {
  CookieMap,
  mergeHeaders,
} from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";

const request = new Request("https://localhost/", {
  headers: { "cookie": "foo=bar; bar=baz;" },
});

const cookies = new CookieMap(request);
console.log(cookies.get("foo")); // logs "bar"
cookies.set("session", "1234567");
cookies.delete("bar");

const response = new Response("test", {
  headers: mergeHeaders({
    "content-type": "text/plain",
  }, cookies),
});
```

If the headers or the response are available at the time of the construction of
the `CookieMap`, they can be passed to the constructor and will have the cookies
set on them directly, thereby not requiring use of `mergeHeaders`:

```ts
import { CookieMap } from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";

const request = new Request("https://localhost/", {
  headers: { "cookie": "foo=bar; bar=baz;" },
});

const headers = new Headers({ "content-type": "text/plain" });

const cookies = new CookieMap(request, { response: headers });
console.log(cookies.get("foo")); // logs "bar"
cookies.set("session", "1234567");
cookies.delete("bar");

const response = new Response("test", { headers });
```

### SecureCookieMap

Provides methods that are aligned to the JavaScript `Map` interface to manage
cookies. The biggest difference is that `SecureCookieMap` supports the use of a
key ring adhering to the `KeyRing` interface to sign and verify cookies. This
helps prevent client side tampering of cookies.

While passing keys is optional to `SecureCookieMap`, if you are not using keys,
consider just using `CookieMap` as all methods are synchronous and therefore
more straight forward to use.

```ts
import {
  type KeyRing,
  mergeHeaders,
  SecureCookieMap,
} from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";

const request = new Request("https://localhost/", {
  headers: {
    "cookie": "bar=foo; bar.sig=S7GhXzJF3n4j8JwTupr7H-h25qtt_vs0stdETXZb-Ro",
  },
});

declare const keys: KeyRing;

const cookies = new SecureCookieMap(request, { keys });
console.log(await cookies.get("bar")); // logs "foo", with the signature being verified
await cookies.set("session", "1234567"); // this will be automatically signed

const response = new Response("test", {
  headers: mergeHeaders({
    "content-type": "text/plain",
  }, cookies),
});
```

```ts
import {
  type KeyRing,
  SecureCookieMap,
} from "https://deno.land/std@$STD_VERSION/http/cookie_map.ts";

const request = new Request("https://localhost/", {
  headers: {
    "cookie": "bar=foo; bar.sig=S7GhXzJF3n4j8JwTupr7H-h25qtt_vs0stdETXZb-Ro",
  },
});

const headers = new Headers({ "content-type": "text/plain" });

declare const keys: KeyRing;

const cookies = new SecureCookieMap(request, { keys });
console.log(await cookies.get("bar")); // logs "foo", with the signature being verified
await cookies.set("session", "1234567"); // this will be automatically signed

const response = new Response("test", { headers });
```

### mergeHeaders

A function which takes various sources of headers and returns a single `Headers`
instance. Intended to merge `CookieMap` and `SecureCookieMap` set cookie headers
into a final response.

Sources can be of type `HeadersInit`, `CookieMap`, `SecureCookieMap` or objects
which have a `headers` property with a value of `Headers` (like a `Response`
object).
