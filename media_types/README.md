# std/media_types

Provides an API for handling media (MIME) types.

These APIs are inspired by the GoLang [`mime`](https://pkg.go.dev/mime) package
and [jshttp/mime-types](https://github.com/jshttp/mime-types), and is designed
to integrate and improve the APIs from
[deno.land/x/media_types](https://deno.land/x/media_types).

## `contentType()`

Given a extension or media type, return a fully qualified header value for
setting a `Content-Type` or `Content-Disposition` header.

```ts
import { contentType } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";

contentType(".json"); // `application/json; charset=UTF-8`
contentType("text/html"); // `text/html; charset=UTF-8`
contentType("txt"); // `text/plain; charset=UTF-8`
contentType("foo"); // undefined
```

## `extension()`

Given a media type, return the most relevant extension. If no extension can be
determined `undefined` is returned.

```ts
import { extension } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";

extension("text/plain"); // `txt`
extension("application/json"); // `json`
extension("text/html; charset=UTF-8"); // `html`
extension("application/foo"); // undefined
```

## `extensionsByType()`

Given a media type, return an array of extensions that can be applied. If no
extension can be determined `undefined` is returned.

```ts
import { extensionsByType } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";

extensionsByType("application/json"); // ["js", "mjs"]
extensionsByType("text/html; charset=UTF-8"); // ["html", "htm", "shtml"]
extensionsByType("application/foo"); // undefined
```

## `formatMediaType()`

Given a media type and optional parameters, return a spec compliant value. If
the parameters result in a non-compliant value, an empty string (`""`) is
returned.

```ts
import { formatMediaType } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";

formatMediaType("text/plain", { charset: "UTF-8" }); // `text/plain; charset=UTF-8`
```

## `getCharset()`

Given a media type, return the charset encoding for the value.

```ts
import { getCharset } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";

getCharset("text/plain"); // `UTF-8`
getCharset("application/foo"); // undefined
getCharset("application/news-checkgroups"); // `US-ASCII`
getCharset("application/news-checkgroups; charset=UTF-8"); // `UTF-8`
```

## `parseMediaType()`

Given a header value string, parse a value into a media type and any optional
parameters. If the supplied value is invalid, the function will throw.

```ts
import { parseMediaType } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";
import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

assertEquals(
  parseMediaType("application/JSON"),
  [
    "application/json",
    undefined,
  ],
);

assertEquals(
  parseMediaType("text/html; charset=UTF-8"),
  [
    "application/json",
    { charset: "UTF-8" },
  ],
);
```

## `typeByExtension()`

Given an extension, return a media type. The extension can have a leading `.` or
not.

```ts
import { typeByExtension } from "https://deno.land/std@$STD_VERSION/media_types/mod.ts";

typeByExtension("js"); // `application/json`
typeByExtension(".HTML"); // `text/html`
typeByExtension("foo"); // undefined
```
