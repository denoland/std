// Copyright 2018-2026 the Deno authors. MIT license.
import { TtlCache } from "./ttl_cache.ts";
import { assertEquals } from "@std/assert";
import { FakeTime } from "@std/testing/time";

const UNSET = Symbol("UNSET");

// check `has()`, `get()`, `forEach()`
function assertEntries<K, V>(
  cache: TtlCache<K, V>,
  entries: [key: K, value: V | typeof UNSET][],
) {
  for (const [key, value] of entries) {
    assertEquals(cache.has(key), value !== UNSET);
    assertEquals(cache.get(key), value === UNSET ? undefined : value);
  }

  cache.forEach((v, k) => assertEquals(v, entries.find(([x]) => x === k)![1]));
  assertContentfulEntries(
    cache as TtlCache<K, V | typeof UNSET>,
    entries.filter(([, v]) => v !== UNSET),
  );
}

// check `size`, `entries()`, `keys()`, `values()`, `[Symbol.iterator]()`
function assertContentfulEntries<K, V>(
  cache: TtlCache<K, V>,
  entries: [key: K, value: V][],
) {
  const keys = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);

  assertEquals(cache.size, entries.length);

  assertEquals([...cache.entries()], entries);
  assertEquals([...cache.keys()], keys);
  assertEquals([...cache.values()], values);
  assertEquals([...cache], entries);
}

Deno.test("TtlCache deletes entries", async (t) => {
  await t.step("after the default TTL, passed in constructor", () => {
    using time = new FakeTime(0);

    const cache = new TtlCache<number, string>(10);

    cache.set(1, "one");
    cache.set(2, "two");

    time.now = 1;
    assertEntries(cache, [[1, "one"], [2, "two"]]);

    time.now = 5;
    assertEntries(cache, [[1, "one"], [2, "two"]]);
    // setting again resets TTL countdown for key 1
    cache.set(1, "one");

    time.now = 10;
    assertEntries(cache, [[1, "one"], [2, UNSET]]);

    time.now = 15;
    assertEntries(cache, [[1, UNSET], [2, UNSET]]);
  });

  await t.step("after a custom TTL, passed in set()", () => {
    using time = new FakeTime(0);

    const cache = new TtlCache<number, string>(10);

    cache.set(1, "one");
    cache.set(2, "two", 3);

    time.now = 1;
    assertEntries(cache, [[1, "one"], [2, "two"]]);

    time.now = 3;
    assertEntries(cache, [[1, "one"], [2, UNSET]]);

    time.now = 10;
    assertEntries(cache, [[1, UNSET], [2, UNSET]]);
  });

  await t.step("after manually calling delete()", () => {
    const cache = new TtlCache<number, string>(10);

    cache.set(1, "one");
    assertEntries(cache, [[1, "one"]]);
    assertEquals(cache.delete(1), true);
    assertEntries(cache, [[1, UNSET]]);
    assertEquals(cache.delete(1), false);
    assertEntries(cache, [[1, UNSET]]);
  });

  await t.step("after manually calling clear()", () => {
    const cache = new TtlCache<number, string>(10);

    cache.set(1, "one");
    assertEntries(cache, [[1, "one"]]);
    cache.clear();
    assertEntries(cache, [[1, UNSET]]);
  });

  // this test will fail with `error: Leaks detected` if the timeouts are not cleared
  await t.step("[Symbol.dispose]() clears all remaining timeouts", () => {
    using cache = new TtlCache<number, string>(10);
    cache.set(1, "one");
  });
});

Deno.test("TtlCache onEject()", () => {
  using time = new FakeTime(0);
  let called = 0;
  const cache = new TtlCache<number, string>(10, { onEject: () => called++ });

  cache.set(1, "one");
  cache.set(2, "two");

  cache.delete(2);
  assertEquals(called, 1);

  cache.set(3, "three");
  time.now = 10;
  assertEquals(called, 3);
  assertEquals(cache.get(3), undefined);
});
