// Copyright 2018-2026 the Deno authors. MIT license.
import { TtlCache } from "./ttl_cache.ts";
import { assertEquals, assertThrows } from "@std/assert";
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
    cache.set(2, "two", { ttl: 3 });

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

Deno.test("TtlCache onEject()", async (t) => {
  await t.step("calls onEject on delete and TTL expiry", () => {
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

  await t.step("calls onEject for falsy values", () => {
    const ejected: [number, unknown][] = [];
    using cache = new TtlCache<number, unknown>(1000, {
      onEject: (k, v) => ejected.push([k, v]),
    });

    cache.set(1, 0);
    cache.set(2, "");
    cache.set(3, false);
    cache.set(4, null);

    cache.delete(1);
    cache.delete(2);
    cache.delete(3);
    cache.delete(4);

    assertEquals(ejected, [[1, 0], [2, ""], [3, false], [4, null]]);
  });

  await t.step("calls onEject on clear()", () => {
    const ejected: [number, string][] = [];
    using cache = new TtlCache<number, string>(1000, {
      onEject: (k, v) => ejected.push([k, v]),
    });

    cache.set(1, "one");
    cache.set(2, "two");
    cache.set(3, "three");
    cache.clear();

    assertEquals(ejected, [[1, "one"], [2, "two"], [3, "three"]]);
  });

  await t.step("calls onEject on [Symbol.dispose]()", () => {
    const ejected: [number, string][] = [];
    {
      using cache = new TtlCache<number, string>(1000, {
        onEject: (k, v) => ejected.push([k, v]),
      });
      cache.set(1, "one");
      cache.set(2, "two");
    }

    assertEquals(ejected, [[1, "one"], [2, "two"]]);
  });

  await t.step("does not call onEject when overwriting a key", () => {
    const ejected: [string, number][] = [];
    using cache = new TtlCache<string, number>(1000, {
      onEject: (k, v) => ejected.push([k, v]),
    });

    cache.set("a", 1);
    cache.set("a", 2);

    assertEquals(ejected, []);
    assertEquals(cache.get("a"), 2);
  });

  await t.step("entry is fully removed before onEject fires", () => {
    let sizeInCallback = -1;
    let hasInCallback = true;
    using cache = new TtlCache<string, number>(1000, {
      onEject: (k) => {
        sizeInCallback = cache.size;
        hasInCallback = cache.has(k);
      },
    });

    cache.set("a", 1);
    cache.delete("a");

    assertEquals(sizeInCallback, 0);
    assertEquals(hasInCallback, false);
  });
});

Deno.test("TtlCache validates TTL", async (t) => {
  await t.step("constructor rejects negative defaultTtl", () => {
    assertThrows(
      () => new TtlCache(-1),
      RangeError,
      "defaultTtl must be a finite, non-negative number",
    );
  });

  await t.step("constructor rejects NaN defaultTtl", () => {
    assertThrows(
      () => new TtlCache(NaN),
      RangeError,
      "defaultTtl must be a finite, non-negative number",
    );
  });

  await t.step("constructor rejects Infinity defaultTtl", () => {
    assertThrows(
      () => new TtlCache(Infinity),
      RangeError,
      "defaultTtl must be a finite, non-negative number",
    );
  });

  await t.step("constructor accepts 0", () => {
    using _cache = new TtlCache(0);
  });

  await t.step("set() rejects negative ttl", () => {
    using cache = new TtlCache<string, number>(1000);
    assertThrows(
      () => cache.set("a", 1, { ttl: -1 }),
      RangeError,
      "ttl must be a finite, non-negative number",
    );
  });

  await t.step("set() rejects NaN ttl", () => {
    using cache = new TtlCache<string, number>(1000);
    assertThrows(
      () => cache.set("a", 1, { ttl: NaN }),
      RangeError,
      "ttl must be a finite, non-negative number",
    );
  });

  await t.step("set() rejects Infinity ttl", () => {
    using cache = new TtlCache<string, number>(1000);
    assertThrows(
      () => cache.set("a", 1, { ttl: Infinity }),
      RangeError,
      "ttl must be a finite, non-negative number",
    );
  });

  await t.step("set() accepts 0 ttl", () => {
    using cache = new TtlCache<string, number>(1000);
    cache.set("a", 1, { ttl: 0 });
    assertEquals(cache.get("a"), 1);
  });
});

Deno.test("TtlCache clear() calls all onEject callbacks even if one throws", () => {
  const ejected: string[] = [];
  using cache = new TtlCache<string, number>(1000, {
    onEject: (k) => {
      ejected.push(k);
      if (k === "a") throw new Error("boom");
    },
  });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);
  assertThrows(() => cache.clear(), Error, "boom");
  assertEquals(ejected, ["a", "b", "c"]);
  assertEquals(cache.size, 0);
});
