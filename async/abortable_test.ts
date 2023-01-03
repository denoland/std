// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "../testing/asserts.ts";
import { deferred } from "./deferred.ts";
import { abortable } from "./abortable.ts";

Deno.test("[async] abortable (Promise)", async () => {
  const c = new AbortController();
  const p = deferred();
  const t = setTimeout(() => p.resolve("Hello"), 100);
  const result = await abortable(p, c.signal);
  assertEquals(result, "Hello");
  clearTimeout(t);
});

Deno.test("[async] abortable (Promise) with signal aborted after delay", async () => {
  const c = new AbortController();
  const p = deferred();
  const t = setTimeout(() => p.resolve("Hello"), 100);
  setTimeout(() => c.abort(), 50);
  await assertRejects(
    async () => {
      await abortable(p, c.signal);
    },
    DOMException,
    "AbortError",
  );
  clearTimeout(t);
});

Deno.test("[async] abortable (Promise) with already aborted signal", async () => {
  const c = new AbortController();
  const p = deferred();
  const t = setTimeout(() => p.resolve("Hello"), 100);
  c.abort();
  await assertRejects(
    async () => {
      await abortable(p, c.signal);
    },
    DOMException,
    "AbortError",
  );
  clearTimeout(t);
});

Deno.test("[async] abortable (AsyncIterable)", async () => {
  const c = new AbortController();
  const p = deferred();
  const t = setTimeout(() => p.resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await p;
    yield "World";
  };
  const items: string[] = [];
  for await (const item of abortable(a(), c.signal)) {
    items.push(item);
  }
  assertEquals(items, ["Hello", "World"]);
  clearTimeout(t);
});

Deno.test("[async] abortable (AsyncIterable) with signal aborted after delay", async () => {
  const c = new AbortController();
  const p = deferred();
  const t = setTimeout(() => p.resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await p;
    yield "World";
  };
  setTimeout(() => c.abort(), 50);
  const items: string[] = [];
  await assertRejects(
    async () => {
      for await (const item of abortable(a(), c.signal)) {
        items.push(item);
      }
    },
    DOMException,
    "AbortError",
  );
  assertEquals(items, ["Hello"]);
  clearTimeout(t);
});

Deno.test("[async] abortable (AsyncIterable) with already aborted signal", async () => {
  const c = new AbortController();
  const p = deferred();
  const t = setTimeout(() => p.resolve("Hello"), 100);
  const a = async function* () {
    yield "Hello";
    await p;
    yield "World";
  };
  c.abort();
  const items: string[] = [];
  await assertRejects(
    async () => {
      for await (const item of abortable(a(), c.signal)) {
        items.push(item);
      }
    },
    DOMException,
    "AbortError",
  );
  assertEquals(items, []);
  clearTimeout(t);
});
