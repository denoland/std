# async

async is a module to provide help with asynchronous tasks.

# Usage

The following functions and class are exposed in `mod.ts`:

## debounce

Debounces a given function by a given time.

```typescript
import { debounce } from "https://deno.land/std/async/mod.ts";

const p = debounce((value: string) => console.log("Function debounced after 200ms with %s", value), 200);
p("foo");
p("bar");
p("baz");
// wait 200ms ...
// output: Function debounced after 200ms with baz
```

## deferred

Create a Promise with the `reject` and `resolve` functions.

```typescript
import { deferred } from "https://deno.land/std/async/mod.ts";

const p = deferred<number>();
// ...
p.resolve(42);
```

## delay

Resolve a Promise after a given amount of milliseconds.

```typescript
import { delay } from "https://deno.land/std/async/mod.ts";

// ...
const delayedPromise = delay(100);
const result = await delayedPromise;
// ...
```

## MuxAsyncIterator

The MuxAsyncIterator class multiplexes multiple async iterators into a single
stream.

The class makes an assumption that the final result (the value returned and not
yielded from the iterator) does not matter. If there is any result, it is
discarded.

```typescript
import { MuxAsyncIterator } from "https://deno.land/std/async/mod.ts";

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
import { pooledMap } from "https://deno.land/std/async/mod.ts";

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
import { tee } from "https://deno.land/std/async/tee.ts";

const gen = async function* gen() {
  yield 1;
  yield 2;
  yield 3;
};

const [branch1, branch2] = tee(gen());

(async () => {
  for await (const n of branch1) {
    console.log(n); // => 1, 2, 3
  }
})();

(async () => {
  for await (const n of branch2) {
    console.log(n); // => 1, 2, 3
  }
})();
```
