// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import { abortable } from "./abortable.ts";

Deno.test("abortable() handles promise", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  const result = await abortable(promise, c.signal);
  assertEquals(result, "Hello");
  clearTimeout(t);
});

Deno.test("abortable() handles promise with aborted signal after delay", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  setTimeout(() => c.abort(), 50);
  const error = await assertRejects(
    () => abortable(promise, c.signal),
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  clearTimeout(t);
});

Deno.test("abortable() handles promise with aborted signal after delay with reason", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  setTimeout(() => c.abort(new Error("This is my reason")), 50);
  await assertRejects(
    () => abortable(promise, c.signal),
    Error,
    "This is my reason",
  );
  clearTimeout(t);
});

Deno.test("abortable() handles promise with already aborted signal", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  c.abort();
  const error = await assertRejects(
    async () => {
      await abortable(promise, c.signal);
    },
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  clearTimeout(t);
});

Deno.test("abortable() handles promise with already aborted signal with reason", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  c.abort(new Error("This is my reason"));
  await assertRejects(
    () => abortable(promise, c.signal),
    Error,
    "This is my reason",
  );
  clearTimeout(t);
});

Deno.test("abortable.AsyncIterable()", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await promise;
    yield "World";
  };
  const items = await Array.fromAsync(abortable(a(), c.signal));
  assertEquals(items, ["Hello", "World"]);
  clearTimeout(t);
});

Deno.test("abortable.AsyncIterable() handles aborted signal after delay", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await promise;
    yield "World";
  };
  setTimeout(() => c.abort(), 50);
  const items: string[] = [];
  const error = await assertRejects(
    async () => {
      for await (const item of abortable(a(), c.signal)) {
        items.push(item);
      }
    },
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  assertEquals(items, ["Hello"]);
  clearTimeout(t);
});

Deno.test("abortable.AsyncIterable() handles already aborted signal", async () => {
  const c = new AbortController();
  const { promise, resolve } = Promise.withResolvers<string>();
  const t = setTimeout(() => resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await promise;
    yield "World";
  };
  c.abort();
  const items: string[] = [];
  const error = await assertRejects(
    async () => {
      for await (const item of abortable(a(), c.signal)) {
        items.push(item);
      }
    },
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(error.name, "AbortError");
  assertEquals(items, []);
  clearTimeout(t);
});

Deno.test("abortable.AsyncIterable() calls return before throwing", async () => {
  const c = new AbortController();
  let returnCalled = false;
  let timeoutId: number;
  const iterable: AsyncIterable<string> = {
    [Symbol.asyncIterator]: () => ({
      next: () =>
        new Promise((resolve) => {
          timeoutId = setTimeout(
            () => resolve({ value: "Hello", done: false }),
            1,
          );
        }),
      return: () => {
        returnCalled = true;
        return Promise.resolve({ value: undefined, done: true });
      },
    }),
  };
  setTimeout(() => c.abort(), 1);
  const items: string[] = [];
  const error = await assertRejects(
    async () => {
      for await (const item of abortable(iterable, c.signal)) {
        items.push(item);
      }
    },
    DOMException,
    "The signal has been aborted",
  );
  assertEquals(returnCalled, true);
  assertEquals(error.name, "AbortError");
  assertEquals(items, []);
  clearTimeout(timeoutId!);
});

Deno.test("abortable.AsyncIterable() behaves just like original when not aborted", async () => {
  async function* gen() {
    yield 1;
    yield await Promise.resolve(2);
    yield 3;
    return 4;
  }
  const normalIterator = gen();
  const abortController = new AbortController();
  const abortableIterator = abortable(gen(), abortController.signal);

  assertEquals(await abortableIterator.next(), await normalIterator.next());
  assertEquals(await abortableIterator.next(), await normalIterator.next());
  assertEquals(await abortableIterator.next(), await normalIterator.next());
  assertEquals(await abortableIterator.next(), await normalIterator.next());
  assertEquals(await abortableIterator.next(), await normalIterator.next());
});

Deno.test("abortable.AsyncIterable() behaves just like original when return is called", async () => {
  async function* gen() {
    yield 1;
    yield await Promise.resolve(2);
    yield 3;
    return 4;
  }
  const normalIterator = gen();
  const abortController = new AbortController();
  const abortableIterator = abortable(gen(), abortController.signal);

  assertEquals(
    await abortableIterator.next(123),
    await normalIterator.next(123),
  );
  assertEquals(
    await abortableIterator.return(321),
    await normalIterator.return(321),
  );
  assertEquals(await abortableIterator.next(), await normalIterator.next());
});

Deno.test("abortable() does not throw when the signal is already aborted and the promise is already rejected", async () => {
  const promise = Promise.reject(new Error("Rejected"));
  const signal = AbortSignal.abort();
  await assertRejects(
    () => abortable(promise, signal),
    DOMException,
    "The signal has been aborted",
  );
});
