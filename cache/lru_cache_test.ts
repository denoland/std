// Copyright 2018-2025 the Deno authors. MIT license.
import { assert, assertEquals } from "@std/assert";
import { LruCache } from "./lru_cache.ts";

Deno.test("LruCache deletes least-recently-used", () => {
  const cache = new LruCache<number, string>(3);

  cache.set(1, "!");
  cache.set(2, "!");
  cache.set(1, "updated");
  cache.set(3, "!");
  cache.set(4, "!");

  assertEquals(cache.size, 3);
  assert(!cache.has(2));
  assertEquals(cache.get(2), undefined);
  assertEquals([...cache.keys()], [1, 3, 4]);
  assertEquals(cache.get(3), "!");
  assertEquals(cache.get(1), "updated");

  cache.delete(3);
  assertEquals(cache.size, 2);
  assertEquals(cache.get(3), undefined);
});

Deno.test("LruCache onEject()", () => {
  let called = 0;
  const cache = new LruCache<number, string>(3, { onEject: () => called++ });

  cache.set(1, "!");
  cache.set(2, "!");
  cache.set(3, "!");
  cache.set(4, "!");
  cache.set(5, "!");

  assertEquals(cache.size, 3);
  assertEquals(called, 2);
  cache.delete(3);

  assertEquals(called, 3);
  assertEquals(cache.size, 2);
  assertEquals(cache.get(3), undefined);
});
