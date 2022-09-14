## abortable

The `abortable` is a wrapper function that makes `Promise` and `AsyncIterable`
cancelable.

For example, in the case of `Promise`, it looks like this

```typescript
import { abortable } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
import { delay } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

const p = delay(1000);
const c = new AbortController();
setTimeout(() => c.abort(), 100);

// Below throws `DOMException` after 100 ms
await abortable(p, c.signal);
```

and for `AsyncIterable` as follows

```typescript
import { abortable } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
import { delay } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

const p = async function* () {
  yield "Hello";
  await delay(1000);
  yield "World";
};
const c = new AbortController();
setTimeout(() => c.abort(), 100);

// Below throws `DOMException` after 100 ms
// and items become `["Hello"]`
const items: string[] = [];
for await (const item of abortable(p(), c.signal)) {
  items.push(item);
}
```

## abortablePromise

`abortablePromise` takes the promise and `AbortSignal` and returns the
cancelable version of the promise.

```typescript
import { abortablePromise } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

const request = fetch("https://example.com");

const c = new AbortController();
setTimeout(() => c.abort(), 100);

const p = abortablePromise(request, c.signal);

// The below throws if the request didn't resolve in 100ms
await p;
```

## abortableAsyncIterable

`abortableAsyncIterable` takes the async iterable and `AbortSignal` and returns
the cancelable version of the async iterable.

```typescript
import { abortableAsyncIterable } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
import { delay } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

const p = async function* () {
  yield "Hello";
  await delay(1000);
  yield "World";
};
const c = new AbortController();
setTimeout(() => c.abort(), 100);

// Below throws `DOMException` after 100 ms
// and items become `["Hello"]`
const items: string[] = [];
for await (const item of abortableAsyncIterable(p(), c.signal)) {
  items.push(item);
}
```
