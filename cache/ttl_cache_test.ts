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

Deno.test("TtlCache peek()", async (t) => {
  await t.step("returns value without resetting sliding TTL", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100, {
      slidingExpiration: true,
    });

    cache.set("a", 1);

    time.now = 80;
    assertEquals(cache.peek("a"), 1);

    // peek did not reset the TTL, so the entry still expires at t=100
    time.now = 100;
    assertEquals(cache.peek("a"), undefined);
  });

  await t.step("returns value for non-sliding cache", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100);

    cache.set("a", 1);

    time.now = 50;
    assertEquals(cache.peek("a"), 1);

    time.now = 100;
    assertEquals(cache.peek("a"), undefined);
  });

  await t.step("returns undefined for missing key", () => {
    using cache = new TtlCache<string, number>(100);
    assertEquals(cache.peek("missing"), undefined);
  });
});

Deno.test("TtlCache get() returns undefined for missing key with sliding expiration", () => {
  using cache = new TtlCache<string, number>(100, {
    slidingExpiration: true,
  });
  assertEquals(cache.get("missing"), undefined);
});

Deno.test("TtlCache sliding expiration", async (t) => {
  await t.step("get() resets TTL", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100, {
      slidingExpiration: true,
    });

    cache.set("a", 1);

    time.now = 80;
    assertEquals(cache.get("a"), 1);

    // TTL was reset at t=80, so entry lives until t=180
    time.now = 160;
    assertEquals(cache.get("a"), 1);

    // TTL was reset at t=160, so entry lives until t=260
    time.now = 250;
    assertEquals(cache.get("a"), 1);

    time.now = 350;
    assertEquals(cache.get("a"), undefined);
  });

  await t.step("has() does not reset TTL", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100, {
      slidingExpiration: true,
    });

    cache.set("a", 1);

    time.now = 80;
    assertEquals(cache.has("a"), true);

    // has() did not reset the TTL, so the entry still expires at t=100
    time.now = 100;
    assertEquals(cache.has("a"), false);
  });

  await t.step("does not reset TTL when slidingExpiration is false", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100);

    cache.set("a", 1);

    time.now = 80;
    assertEquals(cache.get("a"), 1);

    time.now = 100;
    assertEquals(cache.get("a"), undefined);
  });

  await t.step("absoluteExpiration caps sliding extension", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100, {
      slidingExpiration: true,
    });

    cache.set("a", 1, { absoluteExpiration: 150 });

    time.now = 80;
    assertEquals(cache.get("a"), 1);

    time.now = 140;
    assertEquals(cache.get("a"), 1);

    // Absolute deadline is t=150; sliding cannot extend past it
    time.now = 150;
    assertEquals(cache.get("a"), undefined);
  });

  await t.step("absoluteExpiration throws without slidingExpiration", () => {
    using cache = new TtlCache<string, number>(100);
    assertThrows(
      () => cache.set("a", 1, { absoluteExpiration: 50 }),
      TypeError,
      "absoluteExpiration requires slidingExpiration to be enabled",
    );
  });

  await t.step("per-entry TTL works with sliding expiration", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100, {
      slidingExpiration: true,
    });

    cache.set("a", 1, { ttl: 50 });

    time.now = 40;
    assertEquals(cache.get("a"), 1);

    // TTL reset to 50ms at t=40, so alive until t=90
    time.now = 80;
    assertEquals(cache.get("a"), 1);

    // TTL reset to 50ms at t=80, so alive until t=130
    time.now = 130;
    assertEquals(cache.get("a"), undefined);
  });

  await t.step("sliding expiration calls onEject on expiry", () => {
    using time = new FakeTime(0);
    const ejected: [string, number][] = [];
    const cache = new TtlCache<string, number>(100, {
      slidingExpiration: true,
      onEject: (k, v) => ejected.push([k, v]),
    });

    cache.set("a", 1);

    time.now = 80;
    cache.get("a");

    time.now = 180;
    assertEquals(ejected, [["a", 1]]);
  });

  await t.step("overwriting entry resets sliding metadata", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100, {
      slidingExpiration: true,
    });

    cache.set("a", 1, { ttl: 50, absoluteExpiration: 200 });

    time.now = 40;
    cache.get("a");

    // Overwrite with different TTL and no absoluteExpiration
    cache.set("a", 2, { ttl: 30 });

    time.now = 60;
    assertEquals(cache.get("a"), 2);

    // TTL reset to 30ms at t=60, alive until t=90
    time.now = 90;
    assertEquals(cache.get("a"), undefined);
  });

  await t.step("set() rejects negative absoluteExpiration", () => {
    using cache = new TtlCache<string, number>(1000, {
      slidingExpiration: true,
    });
    assertThrows(
      () => cache.set("a", 1, { absoluteExpiration: -1 }),
      RangeError,
      "absoluteExpiration must be a finite, non-negative number",
    );
  });

  await t.step("set() rejects NaN absoluteExpiration", () => {
    using cache = new TtlCache<string, number>(1000, {
      slidingExpiration: true,
    });
    assertThrows(
      () => cache.set("a", 1, { absoluteExpiration: NaN }),
      RangeError,
      "absoluteExpiration must be a finite, non-negative number",
    );
  });
});

Deno.test("TtlCache maxSize", async (t) => {
  await t.step("evicts oldest entry when full", () => {
    using _time = new FakeTime(0);
    const cache = new TtlCache<string, number>(1000, { maxSize: 3 });
    assertEquals(cache.maxSize, 3);

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    assertEquals(cache.size, 3);

    cache.set("d", 4);
    assertEquals(cache.size, 3);
    assertEquals(cache.has("a"), false);
    assertEntries(cache, [["a", UNSET], ["b", 2], ["c", 3], ["d", 4]]);
  });

  await t.step("overwriting existing key does not evict", () => {
    using _time = new FakeTime(0);
    const cache = new TtlCache<string, number>(1000, { maxSize: 2 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10);

    assertEquals(cache.size, 2);
    assertEquals(cache.get("a"), 10);
    assertEquals(cache.get("b"), 2);

    // "a" was overwritten so it moved to the newest position; "b" is now
    // the oldest and gets evicted next
    cache.set("c", 3);
    assertEquals(cache.size, 2);
    assertEquals(cache.has("b"), false);
    assertEquals(cache.get("a"), 10);
    assertEquals(cache.get("c"), 3);
  });

  await t.step("calls onEject for evicted entry", () => {
    using _time = new FakeTime(0);
    const ejected: [string, number][] = [];
    const cache = new TtlCache<string, number>(1000, {
      maxSize: 2,
      onEject: (k, v) => ejected.push([k, v]),
    });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    assertEquals(ejected, [["a", 1]]);
  });

  await t.step("evicted entries have their timeouts cleared", () => {
    using time = new FakeTime(0);
    const ejected: string[] = [];
    const cache = new TtlCache<string, number>(100, {
      maxSize: 1,
      onEject: (k) => ejected.push(k),
    });

    cache.set("a", 1);
    cache.set("b", 2);

    assertEquals(ejected, ["a"]);

    time.now = 100;
    assertEquals(ejected, ["a", "b"]);
    assertEquals(cache.size, 0);
  });

  await t.step("works with slidingExpiration", () => {
    using time = new FakeTime(0);
    const cache = new TtlCache<string, number>(100, {
      maxSize: 2,
      slidingExpiration: true,
    });

    cache.set("a", 1);
    cache.set("b", 2);

    time.now = 80;
    cache.get("a");

    // "a" is the oldest by insertion order, so it gets evicted
    cache.set("c", 3);
    assertEquals(cache.has("a"), false);
    assertEquals(cache.get("b"), 2);
    assertEquals(cache.get("c"), 3);
  });

  await t.step("eviction cleans up absoluteExpiration metadata", () => {
    using time = new FakeTime(0);
    const ejected: string[] = [];
    const cache = new TtlCache<string, number>(1000, {
      maxSize: 2,
      slidingExpiration: true,
      onEject: (k) => ejected.push(k),
    });

    cache.set("a", 1, { absoluteExpiration: 2000 });
    cache.set("b", 2);

    // Evicts "a" (oldest by insertion order), including its absoluteExpiration
    cache.set("c", 3);
    assertEquals(ejected, ["a"]);
    assertEquals(cache.has("a"), false);

    // "b" and "c" remain and eventually expire via TTL
    time.now = 1000;
    assertEquals(ejected, ["a", "b", "c"]);
    assertEquals(cache.size, 0);
  });

  await t.step("validates maxSize in constructor", () => {
    assertThrows(
      () => new TtlCache(1000, { maxSize: 0 }),
      RangeError,
      "maxSize must be a positive integer",
    );
    assertThrows(
      () => new TtlCache(1000, { maxSize: -1 }),
      RangeError,
      "maxSize must be a positive integer",
    );
    assertThrows(
      () => new TtlCache(1000, { maxSize: 1.5 }),
      RangeError,
      "maxSize must be a positive integer",
    );
    assertThrows(
      () => new TtlCache(1000, { maxSize: NaN }),
      RangeError,
      "maxSize must be a positive integer",
    );
    assertThrows(
      () => new TtlCache(1000, { maxSize: Infinity }),
      RangeError,
      "maxSize must be a positive integer",
    );
  });

  await t.step("maxSize of 1 always keeps only the latest entry", () => {
    using _time = new FakeTime(0);
    const cache = new TtlCache<string, number>(1000, { maxSize: 1 });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    assertEquals(cache.size, 1);
    assertEquals(cache.has("a"), false);
    assertEquals(cache.has("b"), false);
    assertEquals(cache.get("c"), 3);
  });
});

Deno.test("TtlCache is not re-entrant during onEject", async (t) => {
  await t.step("set() throws during onEject from delete()", () => {
    using cache = new TtlCache<string, number>(1000, {
      onEject: () => {
        assertThrows(
          () => cache.set("x", 99),
          TypeError,
          "cache is not re-entrant during onEject callbacks",
        );
      },
    });

    cache.set("a", 1);
    cache.delete("a");
  });

  await t.step("delete() throws during onEject", () => {
    using cache = new TtlCache<string, number>(1000, {
      onEject: () => {
        assertThrows(
          () => cache.delete("b"),
          TypeError,
          "cache is not re-entrant during onEject callbacks",
        );
      },
    });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.delete("a");
  });

  await t.step("clear() throws during onEject", () => {
    using cache = new TtlCache<string, number>(1000, {
      onEject: () => {
        assertThrows(
          () => cache.clear(),
          TypeError,
          "cache is not re-entrant during onEject callbacks",
        );
      },
    });

    cache.set("a", 1);
    cache.delete("a");
  });

  await t.step("set() throws during onEject from maxSize eviction", () => {
    using _time = new FakeTime(0);
    using cache = new TtlCache<string, number>(1000, {
      maxSize: 1,
      onEject: () => {
        assertThrows(
          () => cache.set("x", 99),
          TypeError,
          "cache is not re-entrant during onEject callbacks",
        );
      },
    });

    cache.set("a", 1);
    cache.set("b", 2);
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
