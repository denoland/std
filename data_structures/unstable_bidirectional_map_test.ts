// Copyright 2018-2025 the Deno authors. MIT license.
import { assert, assertEquals } from "@std/assert";
import { BidirectionalMap } from "./unstable_bidirectional_map.ts";

Deno.test("BidirectionalMap is an instance of Map", () => {
  const biMap = new BidirectionalMap();
  assert(biMap instanceof Map);
});

Deno.test("BidirectionalMap.set() removes values", () => {
  const map = new BidirectionalMap<number, string>();
  map.set(1, "one");
  map.set(2, "one");

  assertEquals(map.size, 1);
  assertEquals(map.get(1), undefined);
  assertEquals(map.get(2), "one");
  assertEquals(map.getReverse("one"), 2);
});

Deno.test("BidirectionalMap.clear()", () => {
  const map = new BidirectionalMap([
    ["one", 1],
    ["two", 2],
    ["three", 3],
  ]);
  map.clear();

  assertEquals(map.size, 0);
  assertEquals(map.has("one"), false);
  assertEquals(map.hasReverse(1), false);
});

Deno.test("BidirectionalMap.delete() removes the key-value pair", () => {
  const map = new BidirectionalMap([
    ["one", 1],
    ["two", 2],
    ["three", 3],
  ]);

  assertEquals(map.delete("two"), true);
  assertEquals(map.size, 2);
  assertEquals(map.has("two"), false);
  assertEquals(map.hasReverse(2), false);
});

Deno.test(
  "BidirectionalMap.delete() returns false if the key does not exist",
  () => {
    const map = new BidirectionalMap([
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);

    assertEquals(map.delete("four"), false);
    assertEquals(map.size, 3);
  },
);

Deno.test("BidirectionalMap.deleteReverse() removes the value-key pair", () => {
  const map = new BidirectionalMap([
    ["one", 1],
    ["two", 2],
    ["three", 3],
  ]);

  assertEquals(map.deleteReverse(2), true);
  assertEquals(map.size, 2);
  assertEquals(map.has("two"), false);
  assertEquals(map.hasReverse(2), false);
});

Deno.test(
  "BidirectionalMap.deleteReverse() returns false if the value does not exist",
  () => {
    const map = new BidirectionalMap([
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);

    assertEquals(map.deleteReverse(4), false);
    assertEquals(map.size, 3);
  },
);

Deno.test(
  "BidirectionalMap.forEach() iterates over the key-value pairs",
  () => {
    const map = new BidirectionalMap([
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);
    const result: [string, number][] = [];
    map.forEach((value, key) => {
      result.push([key, value]);
    });

    assertEquals(result, [
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);
  },
);

Deno.test(
  "BidirectionalMap.get() returns the value associated with the key",
  () => {
    const map = new BidirectionalMap([
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);

    assertEquals(map.get("one"), 1);
    assertEquals(map.get("two"), 2);
    assertEquals(map.get("three"), 3);
  },
);

Deno.test(
  "BidirectionalMap.getReverse() returns the key associated with the value",
  () => {
    const map = new BidirectionalMap([
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);

    assertEquals(map.getReverse(1), "one");
    assertEquals(map.getReverse(2), "two");
    assertEquals(map.getReverse(3), "three");
  },
);

Deno.test("BidirectionalMap.has() returns true if the key exists", () => {
  const map = new BidirectionalMap([
    ["one", 1],
    ["two", 2],
    ["three", 3],
  ]);

  assertEquals(map.has("one"), true);
  assertEquals(map.has("two"), true);
  assertEquals(map.has("three"), true);
  assertEquals(map.has("four"), false);
});

Deno.test(
  "BidirectionalMap.hasReverse() returns true if the value exists",
  () => {
    const map = new BidirectionalMap([
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);

    assertEquals(map.hasReverse(1), true);
    assertEquals(map.hasReverse(2), true);
    assertEquals(map.hasReverse(3), true);
    assertEquals(map.hasReverse(4), false);
  },
);

Deno.test("BidirectionalMap.set() adds a new key-value pair", () => {
  const map = new BidirectionalMap();
  map.set("one", 1);
  map.set("two", 2);
  map.set("three", 3);

  assertEquals(map.size, 3);
  assertEquals(map.get("one"), 1);
  assertEquals(map.get("two"), 2);
  assertEquals(map.get("three"), 3);
  assertEquals(map.getReverse(1), "one");
  assertEquals(map.getReverse(2), "two");
  assertEquals(map.getReverse(3), "three");
});

Deno.test(
  "BidirectionalMap.set() updates the value if the key already exists",
  () => {
    const map = new BidirectionalMap();
    map.set("one", 1);
    map.set("one", 2);

    assertEquals(map.size, 1);
    assertEquals(map.get("one"), 2);
    assertEquals(map.getReverse(2), "one");
  },
);

Deno.test(
  "BidirectionalMap.set() twice with the same key updates the value",
  () => {
    const map = new BidirectionalMap();
    map.set("key", "value");
    map.set("key", "secondValue");

    assertEquals(map.get("key"), "secondValue");
    assertEquals(map.getReverse("value"), undefined);
    assertEquals(map.getReverse("secondValue"), "key");
  },
);

Deno.test(
  "BidirectionalMap.set() returns the BidirectionalMap instance",
  () => {
    const map = new BidirectionalMap();
    const result = map.set(1, "one");

    assertEquals(result, map);
  },
);

Deno.test("BidirectionalMap.size returns the number of key-value pairs", () => {
  const map = new BidirectionalMap([
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
  ]);

  assertEquals(map.size, 4);
});

Deno.test(
  "BidirectionalMap.entries() returns an iterator of key-value pairs",
  () => {
    const map = new BidirectionalMap([
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);
    const result = Array.from(map.entries());

    assertEquals(result, [
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);
  },
);

Deno.test("BidirectionalMap.keys() returns an iterator of keys", () => {
  const map = new BidirectionalMap([
    ["one", 1],
    ["two", 2],
    ["three", 3],
  ]);
  const result = Array.from(map.keys());

  assertEquals(result, ["one", "two", "three"]);
});

Deno.test("BidirectionalMap.values() returns an iterator of values", () => {
  const map = new BidirectionalMap([
    ["one", 1],
    ["two", 2],
    ["three", 3],
  ]);
  const result = Array.from(map.values());

  assertEquals(result, [1, 2, 3]);
});

Deno.test(
  "BidirectionalMap[Symbol.iterator]() returns an iterator of key-value pairs",
  () => {
    const map = new BidirectionalMap([
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);
    const result = Array.from(map[Symbol.iterator]());

    assertEquals(result, [
      ["one", 1],
      ["two", 2],
      ["three", 3],
    ]);
  },
);

Deno.test("BidirectionalMap[Symbol.toStringTag] is 'BidirectionalMap'", () => {
  const map = new BidirectionalMap();

  assertEquals(map.toString(), "[object BidirectionalMap]");
  assertEquals(
    Object.prototype.toString.call(map),
    "[object BidirectionalMap]",
  );
});

Deno.test(
  "BidirectionalMap.get() have the same references as BidirectionalMap.getReverse()",
  () => {
    const key = { name: "Pīwakawaka" };
    const value = { favourite: false };
    const map = new BidirectionalMap([[key, value]]);
    map.get(key)!.favourite = true;
    map.getReverse(value)!.name = "Tūī";
    assertEquals(key.name, "Tūī");

    assertEquals(value.favourite, true);
    assertEquals(map.get(key)!.favourite, true);
    assertEquals(map.getReverse(value)!.name, "Tūī");
    const entries = Array.from(map.entries());
    assertEquals(entries, [[{ name: "Tūī" }, { favourite: true }]]);
  },
);
