// Copyright 2018-2026 the Deno authors. MIT license.
import { assert, assertEquals, assertThrows } from "@std/assert";
import { LruCache, type LruCacheEjectionReason } from "./lru_cache.ts";

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

  assertEquals(cache.delete(3), true);
  assertEquals(cache.size, 2);
  assertEquals(cache.get(3), undefined);
});

Deno.test("LruCache.maxSize is readonly", () => {
  const cache = new LruCache<string, number>(100);
  assertEquals(cache.maxSize, 100);
});

Deno.test("LruCache validates maxSize", async (t) => {
  await t.step("rejects 0", () => {
    assertThrows(
      () => new LruCache(0),
      RangeError,
      "maxSize must be a positive integer",
    );
  });

  await t.step("rejects negative", () => {
    assertThrows(
      () => new LruCache(-1),
      RangeError,
      "maxSize must be a positive integer",
    );
  });

  await t.step("rejects NaN", () => {
    assertThrows(
      () => new LruCache(NaN),
      RangeError,
      "maxSize must be a positive integer",
    );
  });

  await t.step("rejects Infinity", () => {
    assertThrows(
      () => new LruCache(Infinity),
      RangeError,
      "maxSize must be a positive integer",
    );
  });

  await t.step("rejects non-integer", () => {
    assertThrows(
      () => new LruCache(1.5),
      RangeError,
      "maxSize must be a positive integer",
    );
  });

  await t.step("accepts 1", () => {
    const cache = new LruCache<string, number>(1);
    cache.set("a", 1);
    cache.set("b", 2);
    assertEquals(cache.size, 1);
    assertEquals(cache.get("b"), 2);
  });
});

Deno.test("LruCache onEject()", async (t) => {
  await t.step("calls onEject on delete and eviction", () => {
    const reasons: LruCacheEjectionReason[] = [];
    const cache = new LruCache<number, string>(3, {
      onEject: (_k, _v, reason) => reasons.push(reason),
    });

    cache.set(1, "!");
    cache.set(2, "!");
    cache.set(3, "!");
    cache.set(4, "!");
    cache.set(5, "!");

    assertEquals(cache.size, 3);
    assertEquals(reasons, ["evicted", "evicted"]);
    cache.delete(3);

    assertEquals(reasons, ["evicted", "evicted", "deleted"]);
    assertEquals(cache.size, 2);
    assertEquals(cache.get(3), undefined);
  });

  await t.step("calls onEject for falsy values", () => {
    const ejected: [number, unknown, LruCacheEjectionReason][] = [];
    const cache = new LruCache<number, unknown>(10, {
      onEject: (k, v, reason) => ejected.push([k, v, reason]),
    });

    cache.set(1, 0);
    cache.set(2, "");
    cache.set(3, false);
    cache.set(4, null);

    cache.delete(1);
    cache.delete(2);
    cache.delete(3);
    cache.delete(4);

    assertEquals(ejected, [
      [1, 0, "deleted"],
      [2, "", "deleted"],
      [3, false, "deleted"],
      [4, null, "deleted"],
    ]);
  });

  await t.step("calls onEject on clear()", () => {
    const ejected: [string, number, LruCacheEjectionReason][] = [];
    const cache = new LruCache<string, number>(10, {
      onEject: (k, v, reason) => ejected.push([k, v, reason]),
    });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.clear();

    assertEquals(ejected, [
      ["a", 1, "cleared"],
      ["b", 2, "cleared"],
      ["c", 3, "cleared"],
    ]);
    assertEquals(cache.size, 0);
  });

  await t.step("does not call onEject when overwriting a key", () => {
    const ejected: [string, number, LruCacheEjectionReason][] = [];
    const cache = new LruCache<string, number>(10, {
      onEject: (k, v, reason) => ejected.push([k, v, reason]),
    });

    cache.set("a", 1);
    cache.set("a", 2);

    assertEquals(ejected, []);
    assertEquals(cache.get("a"), 2);
  });

  await t.step("entry is fully removed before onEject fires", () => {
    let sizeInCallback = -1;
    let hasInCallback = true;
    const cache = new LruCache<string, number>(10, {
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

Deno.test("LruCache delete() returns false for non-existent key", () => {
  const cache = new LruCache<string, number>(10);
  assertEquals(cache.delete("nonexistent"), false);
});

Deno.test("LruCache clear() calls all onEject callbacks even if one throws", () => {
  const ejected: string[] = [];
  const cache = new LruCache<string, number>(10, {
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

Deno.test("LruCache clear() works without onEject", () => {
  const cache = new LruCache<string, number>(10);
  cache.set("a", 1);
  cache.set("b", 2);
  cache.clear();
  assertEquals(cache.size, 0);
});

Deno.test("LruCache has() does not promote entry", () => {
  const cache = new LruCache<string, number>(2);
  cache.set("a", 1);
  cache.set("b", 2);
  cache.has("a");
  cache.set("c", 3);
  assertEquals(cache.has("a"), false);
  assertEquals(cache.has("b"), true);
});

Deno.test("LruCache peek() returns value without promoting entry", () => {
  const cache = new LruCache<string, number>(3);
  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  assertEquals(cache.peek("a"), 1);

  cache.set("d", 4);
  assertEquals(cache.peek("a"), undefined);
  assertEquals(cache.get("b"), 2);
});

Deno.test("LruCache peek() returns undefined for missing key", () => {
  const cache = new LruCache<string, number>(10);
  assertEquals(cache.peek("nonexistent"), undefined);
});

Deno.test("LruCache set() throws if onEject throws during eviction", () => {
  const cache = new LruCache<string, number>(2, {
    onEject: () => {
      throw new Error("boom");
    },
  });

  cache.set("a", 1);
  cache.set("b", 2);
  assertThrows(() => cache.set("c", 3), Error, "boom");
  assertEquals(cache.size, 2);
  assertEquals(cache.has("a"), false);
  assertEquals(cache.get("b"), 2);
  assertEquals(cache.get("c"), 3);
});

Deno.test("LruCache onEject is not re-entrant", async (t) => {
  await t.step("set() inside onEject throws", () => {
    const cache = new LruCache<string, number>(2, {
      onEject: () => {
        cache.set("x", 99);
      },
    });

    cache.set("a", 1);
    cache.set("b", 2);
    assertThrows(
      () => cache.set("c", 3),
      Error,
      "cache is not re-entrant during onEject callbacks",
    );
  });

  await t.step("delete() inside onEject throws", () => {
    const cache = new LruCache<string, number>(2, {
      onEject: () => {
        cache.delete("b");
      },
    });

    cache.set("a", 1);
    cache.set("b", 2);
    assertThrows(
      () => cache.delete("a"),
      Error,
      "cache is not re-entrant during onEject callbacks",
    );
  });

  await t.step("clear() inside onEject throws", () => {
    const cache = new LruCache<string, number>(10, {
      onEject: () => {
        cache.clear();
      },
    });

    cache.set("a", 1);
    assertThrows(
      () => cache.delete("a"),
      Error,
      "cache is not re-entrant during onEject callbacks",
    );
  });
});

Deno.test("LruCache set() returns this for chaining", () => {
  const cache = new LruCache<string, number>(10);
  const result = cache.set("a", 1).set("b", 2).set("c", 3);
  assert(result === cache);
  assertEquals(cache.size, 3);
});

Deno.test("LruCache clear() rethrows the first error when multiple onEject callbacks throw", () => {
  const ejected: string[] = [];
  const cache = new LruCache<string, number>(10, {
    onEject: (k) => {
      ejected.push(k);
      throw new Error(`boom-${k}`);
    },
  });

  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);
  assertThrows(() => cache.clear(), Error, "boom-a");
  assertEquals(ejected, ["a", "b", "c"]);
  assertEquals(cache.size, 0);
});

Deno.test("LruCache iteration order reflects LRU recency", () => {
  const cache = new LruCache<string, number>(3);
  cache.set("a", 1);
  cache.set("b", 2);
  cache.set("c", 3);

  cache.get("a");

  assertEquals([...cache.keys()], ["b", "c", "a"]);
  assertEquals([...cache.values()], [2, 3, 1]);
  assertEquals([...cache.entries()], [["b", 2], ["c", 3], ["a", 1]]);
});
