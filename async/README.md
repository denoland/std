# async

async is a module to provide help with asynchronous tasks.

# Usage

The following functions and class are exposed in `mod.ts`:

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

## debounce

Debounces a given function by a given time.

```typescript
import { debounce } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

const p = debounce(
  (value: string) =>
    console.log("Function debounced after 200ms with %s", value),
  200,
);
p("foo");
p("bar");
p("baz");
// wait 200ms ...
// output: Function debounced after 200ms with baz
```

## deferred

Create a Promise with the `reject` and `resolve` functions.

```typescript
import { deferred } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

const p = deferred<number>();
// ...
p.resolve(42);
```

## delay

Resolve a Promise after a given amount of milliseconds.

```typescript
import { delay } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

// ...
const delayedPromise = delay(100);
const result = await delayedPromise;
// ...
```

To allow the process to continue to run as long as the timer exists. Requires
`--unstable` flag.

```typescript
import { delay } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

// ...
await delay(100, { persistent: false });
// ...
```

## MuxAsyncIterator

The MuxAsyncIterator class multiplexes multiple async iterators into a single
stream.

The class makes an assumption that the final result (the value returned and not
yielded from the iterator) does not matter. If there is any result, it is
discarded.

```typescript
import { MuxAsyncIterator } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

async function* gen123(): AsyncIterableIterator<number> {
  yield 1;
  yield 2;
  yield 3;
}

async function* gen456(): AsyncIterableIterator<number> {
  yield 4;
  yield 5;
  yield 6;
}

const mux = new MuxAsyncIterator<number>();
mux.add(gen123());
mux.add(gen456());
for await (const value of mux) {
  // ...
}
// ..
```

## pooledMap

Transform values from an (async) iterable into another async iterable. The
transforms are done concurrently, with a max concurrency defined by the
poolLimit.

```typescript
import { pooledMap } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

const results = pooledMap(
  2,
  [1, 2, 3],
  (i) => new Promise((r) => setTimeout(() => r(i), 1000)),
);

for await (const value of results) {
  // ...
}
```

## tee

Branches the given async iterable into the n branches.

```typescript
import { tee } from "https://deno.land/std@$STD_VERSION/async/tee.ts";

const gen = async function* gen() {
  yield 1;
  yield 2;
  yield 3;
};

const [branch1, branch2] = tee(gen());

for await (const n of branch1) {
  console.log(n); // => 1, 2, 3
}

for await (const n of branch2) {
  console.log(n); // => 1, 2, 3
}
```

## deadline

Create a promise which will be rejected with `DeadlineError` when a given delay
is exceeded.

```typescript
import { deadline } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
import { delay } from "https://deno.land/std@$STD_VERSION/async/mod.ts";

const delayedPromise = delay(1000);
// Below throws `DeadlineError` after 10 ms
const result = await deadline(delayedPromise, 10);
```
