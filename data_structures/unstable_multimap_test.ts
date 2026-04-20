// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertNotStrictEquals, assertThrows } from "@std/assert";
import { MultiMap } from "./unstable_multimap.ts";

Deno.test("MultiMap.add() adds a value under a new key", () => {
  const map = new MultiMap<string, number>();
  map.add("a", 1);

  assertEquals(map.get("a"), [1]);
  assertEquals(map.size, 1);
});

Deno.test("MultiMap.add() appends multiple values under the same key", () => {
  const map = new MultiMap<string, number>();
  map.add("a", 1).add("a", 2);

  assertEquals(map.get("a"), [1, 2]);
  assertEquals(map.size, 1);
});

Deno.test("MultiMap.add() preserves duplicate values for the same key", () => {
  const map = new MultiMap<string, number>();
  map.add("a", 1).add("a", 1).add("a", 2);

  assertEquals(map.get("a"), [1, 1, 2]);
});

Deno.test("MultiMap.add() preserves insertion order across keys", () => {
  const map = new MultiMap<string, number>();
  map.add("b", 1).add("a", 2).add("b", 3).add("a", 4);

  assertEquals(Array.from(map.keys()), ["b", "a"]);
  assertEquals(map.get("b"), [1, 3]);
  assertEquals(map.get("a"), [2, 4]);
});

Deno.test("MultiMap.add() returns the instance for chaining", () => {
  const map = new MultiMap<string, number>();
  const result = map.add("a", 1);

  assertEquals(result, map);
});

Deno.test("MultiMap.get() returns the list of values for an existing key", () => {
  const map = new MultiMap([["a", 1], ["a", 2]] as const);

  assertEquals(map.get("a"), [1, 2]);
});

Deno.test("MultiMap.get() returns undefined for a missing key", () => {
  const map = new MultiMap<string, number>();

  assertEquals(map.get("a"), undefined);
});

Deno.test("MultiMap.get() returns a defensive snapshot", () => {
  const map = new MultiMap<string, number>([["a", 1], ["a", 2]]);
  const first = map.get("a")!;
  first.push(999);

  assertEquals(map.get("a"), [1, 2]);

  const second = map.get("a")!;
  assertNotStrictEquals(first, second);

  map.add("a", 3);
  assertEquals(second, [1, 2]);
});

Deno.test("MultiMap.has() returns true when key exists", () => {
  const map = new MultiMap([["a", 1]] as const);

  assertEquals(map.has("a"), true);
});

Deno.test("MultiMap.has() returns false when key does not exist", () => {
  const map = new MultiMap<string, number>();

  assertEquals(map.has("a"), false);
});

Deno.test("MultiMap.hasEntry() returns true when entry exists", () => {
  const map = new MultiMap([["a", 1], ["a", 2]] as const);

  assertEquals(map.hasEntry("a", 1), true);
  assertEquals(map.hasEntry("a", 2), true);
});

Deno.test(
  "MultiMap.hasEntry() returns false when value is absent under key",
  () => {
    const map = new MultiMap<string, number>([["a", 1]]);

    assertEquals(map.hasEntry("a", 2), false);
  },
);

Deno.test(
  "MultiMap.hasEntry() returns false when key does not exist",
  () => {
    const map = new MultiMap<string, number>();

    assertEquals(map.hasEntry("b", 1), false);
  },
);

Deno.test("MultiMap.delete() removes all values for a key", () => {
  const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]] as const);
  assertEquals(map.delete("a"), true);

  assertEquals(map.has("a"), false);
  assertEquals(map.size, 1);
});

Deno.test("MultiMap.delete() returns true when the key existed", () => {
  const map = new MultiMap([["a", 1]] as const);

  assertEquals(map.delete("a"), true);
});

Deno.test("MultiMap.delete() returns false when the key does not exist", () => {
  const map = new MultiMap<string, number>();

  assertEquals(map.delete("a"), false);
});

Deno.test(
  "MultiMap.deleteEntry() removes a single entry from a key",
  () => {
    const map = new MultiMap([["a", 1], ["a", 2]] as const);
    assertEquals(map.deleteEntry("a", 1), true);

    assertEquals(map.get("a"), [2]);
    assertEquals(map.has("a"), true);
  },
);

Deno.test(
  "MultiMap.deleteEntry() removes only the first occurrence",
  () => {
    const map = new MultiMap([["a", 1], ["a", 2], ["a", 1]] as const);
    assertEquals(map.deleteEntry("a", 1), true);

    assertEquals(map.get("a"), [2, 1]);
  },
);

Deno.test(
  "MultiMap.deleteEntry() removes the key when the last value is removed",
  () => {
    const map = new MultiMap([["a", 1]] as const);
    assertEquals(map.deleteEntry("a", 1), true);

    assertEquals(map.has("a"), false);
    assertEquals(map.size, 0);
  },
);

Deno.test(
  "MultiMap.deleteEntry() returns false when the entry does not exist",
  () => {
    const map = new MultiMap<string, number>([["a", 1]]);

    assertEquals(map.deleteEntry("a", 2), false);
    assertEquals(map.deleteEntry("b", 1), false);
  },
);

Deno.test(
  "MultiMap.deleteEntry() removes NaN using SameValueZero, matching hasEntry()",
  () => {
    const map = new MultiMap<string, number>();
    map.add("a", NaN);

    assertEquals(map.hasEntry("a", NaN), true);
    assertEquals(map.deleteEntry("a", NaN), true);
    assertEquals(map.hasEntry("a", NaN), false);
    assertEquals(map.has("a"), false);
  },
);

Deno.test(
  "MultiMap.deleteEntry() treats +0 and -0 as equal (SameValueZero)",
  () => {
    const map = new MultiMap<string, number>();
    map.add("a", -0);

    assertEquals(map.hasEntry("a", +0), true);
    assertEquals(map.deleteEntry("a", +0), true);
    assertEquals(map.has("a"), false);
  },
);

Deno.test("MultiMap.clear() removes all entries", () => {
  const map = new MultiMap([["a", 1], ["b", 2]] as const);
  map.clear();

  assertEquals(map.size, 0);
  assertEquals(map.has("a"), false);
  assertEquals(map.has("b"), false);
});

Deno.test("MultiMap.size counts distinct keys, not total values", () => {
  const map = new MultiMap([["a", 1], ["a", 2], ["a", 3], ["b", 4]] as const);

  assertEquals(map.size, 2);
});

Deno.test("MultiMap.keys() yields each key once in insertion order", () => {
  const map = new MultiMap([["b", 1], ["a", 2], ["b", 3]] as const);

  assertEquals(Array.from(map.keys()), ["b", "a"]);
});

Deno.test(
  "MultiMap.values() yields all individual values across all keys, including cross-key duplicates",
  () => {
    const map = new MultiMap([["a", 1], ["a", 2], ["b", 1]] as const);

    assertEquals(Array.from(map.values()), [1, 2, 1]);
  },
);

Deno.test("MultiMap.entries() yields flattened [key, value] pairs", () => {
  const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]] as const);

  assertEquals(Array.from(map.entries()), [["a", 1], ["a", 2], ["b", 3]]);
});

Deno.test(
  "MultiMap.entries() does not observe mutations to the current bucket",
  () => {
    const map = new MultiMap<string, number>([["a", 1]]);
    const it = map.entries();
    const first = it.next();
    map.add("a", 42);
    const second = it.next();

    assertEquals(first.value, ["a", 1]);
    assertEquals(second.done, true);
  },
);

Deno.test(
  "MultiMap.entries() keeps yielding values from the current bucket after delete()",
  () => {
    const map = new MultiMap<string, number>([["a", 1], ["a", 2], ["b", 3]]);
    const it = map.entries();
    const first = it.next();
    map.delete("a");
    const rest: [string, number][] = [];
    for (;;) {
      const { value, done } = it.next();
      if (done) break;
      rest.push(value as [string, number]);
    }

    assertEquals(first.value, ["a", 1]);
    assertEquals(rest, [["a", 2], ["b", 3]]);
    assertEquals(map.has("a"), false);
  },
);

Deno.test(
  "MultiMap.values() does not observe mutations to the current bucket",
  () => {
    const map = new MultiMap<string, number>([["a", 1]]);
    const it = map.values();
    const first = it.next();
    map.add("a", 42);
    const second = it.next();

    assertEquals(first.value, 1);
    assertEquals(second.done, true);
  },
);

Deno.test("MultiMap.entries() is non-destructive", () => {
  const map = new MultiMap([["a", 1], ["b", 2]] as const);
  Array.from(map.entries());

  assertEquals(map.size, 2);
  assertEquals(Array.from(map.entries()), [["a", 1], ["b", 2]]);
});

Deno.test(
  "MultiMap[Symbol.iterator]() yields the same pairs as entries()",
  () => {
    const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]] as const);

    assertEquals(Array.from(map[Symbol.iterator]()), [
      ["a", 1],
      ["a", 2],
      ["b", 3],
    ]);
  },
);

Deno.test(
  "MultiMap is iterable via for..of",
  () => {
    const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]] as const);
    const result: [string, number][] = [];
    for (const pair of map) result.push(pair);

    assertEquals(result, [["a", 1], ["a", 2], ["b", 3]]);
  },
);

Deno.test(
  "MultiMap[Symbol.iterator]() is non-destructive",
  () => {
    const map = new MultiMap([["a", 1], ["b", 2]] as const);
    Array.from(map);

    assertEquals(map.size, 2);
    assertEquals(Array.from(map), [["a", 1], ["b", 2]]);
  },
);

Deno.test("MultiMap.forEach() iterates individual (value, key, map) triples", () => {
  const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]] as const);
  const result: [string, number, MultiMap<string, number>][] = [];
  map.forEach((value, key, m) => result.push([key, value, m]));

  assertEquals(result, [
    ["a", 1, map],
    ["a", 2, map],
    ["b", 3, map],
  ]);
});

Deno.test(
  "MultiMap.forEach() throws TypeError when callbackfn is not a function",
  () => {
    const empty = new MultiMap<string, number>();
    assertThrows(
      // deno-lint-ignore no-explicit-any
      () => empty.forEach(null as any),
      TypeError,
      `Cannot call MultiMap.prototype.forEach: "callbackfn" is not a function`,
    );

    const populated = new MultiMap([["a", 1]] as const);
    assertThrows(
      // deno-lint-ignore no-explicit-any
      () => populated.forEach(null as any),
      TypeError,
      `Cannot call MultiMap.prototype.forEach: "callbackfn" is not a function`,
    );
  },
);

Deno.test(
  "MultiMap.forEach() does not visit values appended to the current bucket",
  () => {
    const map = new MultiMap<string, number>([["a", 1]]);
    const seen: number[] = [];
    map.forEach((value, key) => {
      seen.push(value);
      if (value === 1) map.add(key, 99);
    });

    assertEquals(seen, [1]);
    assertEquals(map.get("a"), [1, 99]);
  },
);

Deno.test(
  "MultiMap.forEach() does not shift the visit when the current bucket is spliced",
  () => {
    const map = new MultiMap<string, number>([["a", 1], ["a", 2], ["a", 3]]);
    const seen: number[] = [];
    map.forEach((value, key) => {
      seen.push(value);
      if (value === 1) map.deleteEntry(key, 2);
    });

    assertEquals(seen, [1, 2, 3]);
    assertEquals(map.get("a"), [1, 3]);
  },
);

Deno.test("MultiMap.forEach() binds thisArg when provided", () => {
  const map = new MultiMap([["a", 1], ["b", 2]] as const);
  const context = { prefix: "x:" };
  const result: string[] = [];
  map.forEach(function (value, key) {
    result.push(`${this.prefix}${key}=${value}`);
  }, context);

  assertEquals(result, ["x:a=1", "x:b=2"]);
});

Deno.test(
  "MultiMap.groups() yields [key, values] pairs in insertion order",
  () => {
    const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]] as const);

    assertEquals(
      Array.from(map.groups(), ([k, vs]) => [k, [...vs]]),
      [["a", [1, 2]], ["b", [3]]],
    );
  },
);

Deno.test(
  "MultiMap.groups() exposes bucket length",
  () => {
    const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]] as const);
    const collisions: string[] = [];
    for (const [key, values] of map.groups()) {
      if (values.length > 1) collisions.push(key);
    }

    assertEquals(collisions, ["a"]);
  },
);

Deno.test("MultiMap.groups() is non-destructive", () => {
  const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]] as const);
  Array.from(map.groups());

  assertEquals(map.size, 2);
  assertEquals(map.get("a"), [1, 2]);
  assertEquals(map.get("b"), [3]);
});

Deno.test(
  "MultiMap.groups() yields defensive snapshots that do not alias internal state",
  () => {
    const map = new MultiMap<string, number>([["a", 1], ["a", 2]]);
    for (const [, values] of map.groups()) {
      values.length = 0;
      values.push(-1);
    }

    assertEquals(map.size, 1);
    assertEquals(map.has("a"), true);
    assertEquals(map.get("a"), [1, 2]);
    assertEquals(map.hasEntry("a", 1), true);
  },
);

Deno.test(
  "MultiMap constructor accepts an iterable and preserves duplicates",
  () => {
    const map = new MultiMap([["a", 1], ["a", 1], ["a", 2], ["b", 3]] as const);

    assertEquals(map.size, 2);
    assertEquals(map.get("a"), [1, 1, 2]);
    assertEquals(map.get("b"), [3]);
  },
);

Deno.test("MultiMap constructor accepts null", () => {
  const map = new MultiMap(null);

  assertEquals(map.size, 0);
});

Deno.test("MultiMap.toMap() returns a Map of arrays in insertion order", () => {
  const map = new MultiMap([["b", 1], ["a", 2], ["b", 3]] as const);

  assertEquals(map.toMap(), new Map([["b", [1, 3]], ["a", [2]]]));
  assertEquals(Array.from(map.toMap().keys()), ["b", "a"]);
});

Deno.test(
  "MultiMap.toMap() returns fresh arrays that do not alias internal state",
  () => {
    const map = new MultiMap<string, number>([["a", 1]]);
    const snapshot = map.toMap();
    snapshot.get("a")!.push(999);
    snapshot.set("b", [2]);

    assertEquals(map.get("a"), [1]);
    assertEquals(map.has("b"), false);

    map.add("a", 3);
    assertEquals(snapshot.get("a"), [1, 999]);
  },
);

Deno.test("MultiMap.toMap() on an empty multimap returns an empty Map", () => {
  const map = new MultiMap<string, number>();

  assertEquals(map.toMap(), new Map());
});

Deno.test("MultiMap.groupBy() buckets items by keyFn result", () => {
  const users = [
    { name: "Ada", role: "admin" },
    { name: "Bo", role: "user" },
    { name: "Cy", role: "admin" },
  ];

  const byRole = MultiMap.groupBy(users, (u) => u.role);

  assertEquals(byRole.size, 2);
  assertEquals(byRole.get("admin"), [
    { name: "Ada", role: "admin" },
    { name: "Cy", role: "admin" },
  ]);
  assertEquals(byRole.get("user"), [{ name: "Bo", role: "user" }]);
});

Deno.test("MultiMap.groupBy() preserves encounter order within buckets", () => {
  const grouped = MultiMap.groupBy(
    [3, 1, 4, 1, 5, 9, 2, 6],
    (n) => (n % 2 === 0 ? "even" : "odd"),
  );

  assertEquals(grouped.get("even"), [4, 2, 6]);
  assertEquals(grouped.get("odd"), [3, 1, 1, 5, 9]);
});

Deno.test("MultiMap.groupBy() passes the zero-based index to keyFn", () => {
  const indices: number[] = [];
  MultiMap.groupBy(["a", "b", "c"], (_, i) => {
    indices.push(i);
    return i;
  });

  assertEquals(indices, [0, 1, 2]);
});

Deno.test("MultiMap.groupBy() accepts an arbitrary iterable", () => {
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
  }

  const grouped = MultiMap.groupBy(gen(), (n) => n % 2 === 0 ? "even" : "odd");

  assertEquals(grouped.get("even"), [2]);
  assertEquals(grouped.get("odd"), [1, 3]);
});

Deno.test(
  "MultiMap.groupBy() throws TypeError when keyFn is not a function",
  () => {
    assertThrows(
      // deno-lint-ignore no-explicit-any
      () => MultiMap.groupBy([], null as any),
      TypeError,
      `Cannot call MultiMap.groupBy: "keyFn" is not a function`,
    );

    assertThrows(
      // deno-lint-ignore no-explicit-any
      () => MultiMap.groupBy([1, 2, 3], null as any),
      TypeError,
      `Cannot call MultiMap.groupBy: "keyFn" is not a function`,
    );
  },
);

Deno.test("MultiMap.groupBy() on an empty iterable returns an empty multimap", () => {
  const grouped = MultiMap.groupBy<string, number>([], () => "k");

  assertEquals(grouped.size, 0);
});

Deno.test("MultiMap.groupBy() and toMap() round-trip", () => {
  const items = [1, 2, 3, 4, 5, 6];
  const key = (n: number) => n % 3;

  const grouped = MultiMap.groupBy(items, key);

  assertEquals(
    grouped.toMap(),
    new Map([[1, [1, 4]], [2, [2, 5]], [0, [3, 6]]]),
  );
});

Deno.test("MultiMap[Symbol.toStringTag] is 'MultiMap'", () => {
  const map = new MultiMap();

  assertEquals(map[Symbol.toStringTag], "MultiMap");
});
