// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { RollingCounter } from "./unstable_rolling_counter.ts";

// -- Constructor --

Deno.test("RollingCounter() throws on invalid segmentCount", () => {
  for (const bad of [0, -1, 1.5, NaN, Infinity]) {
    assertThrows(() => new RollingCounter(bad), RangeError);
  }
});

Deno.test("RollingCounter() initializes with correct segmentCount and zero total", () => {
  const counter = new RollingCounter(3);
  assertEquals(counter.segmentCount, 3);
  assertEquals(counter.total, 0);
  assertEquals([...counter], [0, 0, 0]);
});

// -- increment --

Deno.test("RollingCounter.increment() throws on invalid n", () => {
  const counter = new RollingCounter(3);
  for (const bad of [-1, 1.5, NaN, Infinity]) {
    assertThrows(() => counter.increment(bad), RangeError);
  }
});

Deno.test("RollingCounter.increment() defaults to 1 and accumulates in current segment", () => {
  const counter = new RollingCounter(3);
  assertEquals(counter.increment(), 1);
  assertEquals(counter.increment(4), 5);
  assertEquals(counter.increment(0), 5);
  assertEquals([...counter], [0, 0, 5]);
});

// -- rotate (single step) --

Deno.test("RollingCounter.rotate() evicts oldest segment and updates total", () => {
  const counter = new RollingCounter(3);
  counter.increment(5);
  counter.rotate();
  counter.increment(3);
  counter.rotate();
  counter.increment(7);

  assertEquals([...counter], [5, 3, 7]);
  assertEquals(counter.total, 15);

  const evicted = counter.rotate();
  assertEquals(evicted, 5);
  assertEquals(counter.total, 10);
  assertEquals([...counter], [3, 7, 0]);
});

Deno.test("RollingCounter.rotate() on empty segments returns 0", () => {
  const counter = new RollingCounter(3);
  assertEquals(counter.rotate(), 0);
  assertEquals(counter.total, 0);
});

// -- rotate(steps) --

Deno.test("RollingCounter.rotate() throws on invalid steps", () => {
  const counter = new RollingCounter(3);
  for (const bad of [-1, 1.5, NaN, Infinity]) {
    assertThrows(() => counter.rotate(bad), RangeError);
  }
});

Deno.test("RollingCounter.rotate() with steps=0 is a no-op", () => {
  const counter = new RollingCounter(3);
  counter.increment(10);
  assertEquals(counter.rotate(0), 0);
  assertEquals(counter.total, 10);
  assertEquals(counter.current, 10);
  assertEquals([...counter], [0, 0, 10]);

  counter.increment(1);
  assertEquals(counter.current, 11);
  assertEquals(counter.total, 11);
});

Deno.test("RollingCounter.rotate() bulk advances partial window", () => {
  const counter = new RollingCounter(4);
  counter.increment(10);
  counter.rotate();
  counter.increment(20);
  counter.rotate();
  counter.increment(30);
  counter.rotate();
  counter.increment(40);

  const evicted = counter.rotate(2);
  assertEquals(evicted, 30);
  assertEquals(counter.total, 70);
  assertEquals([...counter], [30, 40, 0, 0]);
});

Deno.test("RollingCounter.rotate() with steps >= segmentCount clears all and positions cursor correctly", () => {
  const counter = new RollingCounter(3);
  counter.increment(5);
  counter.rotate();
  counter.increment(3);

  const evicted = counter.rotate(3);
  assertEquals(evicted, 8);
  assertEquals(counter.total, 0);

  counter.increment(1);
  counter.rotate();
  counter.increment(2);
  assertEquals([...counter], [0, 1, 2]);
});

Deno.test("RollingCounter.rotate() with steps > segmentCount clears all", () => {
  const counter = new RollingCounter(3);
  counter.increment(5);
  counter.rotate();
  counter.increment(3);

  const evicted = counter.rotate(100);
  assertEquals(evicted, 8);
  assertEquals(counter.total, 0);
});

Deno.test("RollingCounter.rotate() bulk matches repeated single rotates", () => {
  const a = new RollingCounter(4);
  const b = new RollingCounter(4);
  for (const c of [a, b]) {
    c.increment(10);
    c.rotate();
    c.increment(20);
    c.rotate();
    c.increment(30);
    c.rotate();
    c.increment(40);
  }

  let evictedA = 0;
  for (let i = 0; i < 3; i++) evictedA += a.rotate();
  const evictedB = b.rotate(3);

  assertEquals(evictedA, evictedB);
  assertEquals(a.total, b.total);
  assertEquals([...a], [...b]);
});

// -- clear --

Deno.test("RollingCounter.clear() resets to initial state", () => {
  const counter = new RollingCounter(3);
  counter.increment(10);
  counter.rotate();
  counter.increment(5);
  counter.rotate();
  counter.clear();

  const fresh = new RollingCounter(3);
  assertEquals(counter.total, fresh.total);
  assertEquals(counter.segmentCount, fresh.segmentCount);
  assertEquals([...counter], [...fresh]);

  counter.increment(7);
  counter.rotate();
  counter.increment(2);
  fresh.increment(7);
  fresh.rotate();
  fresh.increment(2);
  assertEquals([...counter], [...fresh]);
});

// -- current --

Deno.test("RollingCounter.current returns the current segment value", () => {
  const counter = new RollingCounter(3);
  assertEquals(counter.current, 0);

  counter.increment(5);
  assertEquals(counter.current, 5);

  counter.rotate();
  assertEquals(counter.current, 0);

  counter.increment(3);
  assertEquals(counter.current, 3);
});

Deno.test("RollingCounter.current is 0 after clear", () => {
  const counter = new RollingCounter(3);
  counter.increment(10);
  counter.clear();
  assertEquals(counter.current, 0);
});

Deno.test("RollingCounter.current tracks the newest segment after bulk rotate", () => {
  const counter = new RollingCounter(3);
  counter.increment(5);
  counter.rotate();
  counter.increment(3);
  counter.rotate(2);
  assertEquals(counter.current, 0);

  counter.increment(7);
  assertEquals(counter.current, 7);
});

// -- Symbol.toStringTag --

Deno.test("RollingCounter[Symbol.toStringTag] returns 'RollingCounter'", () => {
  const counter = new RollingCounter(3);
  assertEquals(
    Object.prototype.toString.call(counter),
    "[object RollingCounter]",
  );
});

// -- Symbol.iterator --

Deno.test("RollingCounter[Symbol.iterator]() yields segments oldest to newest", () => {
  const counter = new RollingCounter(3);
  counter.increment(1);
  counter.rotate();
  counter.increment(2);
  counter.rotate();
  counter.increment(3);
  assertEquals([...counter], [1, 2, 3]);

  counter.rotate();
  assertEquals([...counter], [2, 3, 0]);
});

// -- Edge cases --

Deno.test("RollingCounter with segmentCount of 1 evicts on every rotate", () => {
  const counter = new RollingCounter(1);
  counter.increment(42);
  assertEquals([...counter], [42]);

  const evicted = counter.rotate();
  assertEquals(evicted, 42);
  assertEquals(counter.total, 0);
  assertEquals([...counter], [0]);
});

Deno.test("RollingCounter handles many rotations without data loss", () => {
  const counter = new RollingCounter(3);
  counter.increment(10);
  for (let i = 0; i < 100; i++) counter.rotate();
  assertEquals(counter.total, 0);

  counter.increment(1);
  assertEquals([...counter], [0, 0, 1]);
});

// -- toArray --

Deno.test("RollingCounter.toArray() returns segments oldest-to-newest", () => {
  const counter = new RollingCounter(3);
  counter.increment(5);
  counter.rotate();
  counter.increment(3);
  assertEquals(counter.toArray(), [0, 5, 3]);
});

Deno.test("RollingCounter.toArray() matches [...counter]", () => {
  const counter = new RollingCounter(4);
  counter.increment(1);
  counter.rotate();
  counter.increment(2);
  counter.rotate();
  counter.increment(3);
  assertEquals(counter.toArray(), [...counter]);
});

Deno.test("RollingCounter.toArray() returns a fresh array", () => {
  const counter = new RollingCounter(3);
  counter.increment(10);
  const arr = counter.toArray();
  arr[0] = 999;
  assertEquals(counter.toArray(), [0, 0, 10]);
});

// -- at --

Deno.test("RollingCounter.at() indexes oldest-to-newest", () => {
  const counter = new RollingCounter(3);
  counter.increment(5);
  counter.rotate();
  counter.increment(3);
  assertEquals(counter.at(0), 0);
  assertEquals(counter.at(1), 5);
  assertEquals(counter.at(2), 3);
});

Deno.test("RollingCounter.at() supports negative indices", () => {
  const counter = new RollingCounter(3);
  counter.increment(5);
  counter.rotate();
  counter.increment(3);
  assertEquals(counter.at(-1), counter.current);
  assertEquals(counter.at(-1), 3);
  assertEquals(counter.at(-2), 5);
  assertEquals(counter.at(-3), 0);
});

Deno.test("RollingCounter.at() returns undefined for out-of-range indices", () => {
  const counter = new RollingCounter(3);
  counter.increment(1);
  assertEquals(counter.at(3), undefined);
  assertEquals(counter.at(99), undefined);
  assertEquals(counter.at(-4), undefined);
  assertEquals(counter.at(-99), undefined);
});

Deno.test("RollingCounter.at() tracks rotation", () => {
  const counter = new RollingCounter(4);
  counter.increment(10);
  counter.rotate();
  counter.increment(20);
  counter.rotate();
  counter.increment(30);
  counter.rotate();
  counter.increment(40);
  assertEquals(counter.toArray(), [10, 20, 30, 40]);
  assertEquals(counter.at(0), 10);
  assertEquals(counter.at(-1), 40);

  counter.rotate(2);
  assertEquals(counter.toArray(), [30, 40, 0, 0]);
  assertEquals(counter.at(0), 30);
  assertEquals(counter.at(1), 40);
  assertEquals(counter.at(-1), 0);
});

// -- toJSON / from --

Deno.test("RollingCounter.toJSON() and from() round-trip through JSON", () => {
  const original = new RollingCounter(4);
  original.increment(5);
  original.rotate();
  original.increment(3);
  original.rotate();
  original.increment(7);

  const json = JSON.stringify(original);
  const restored = RollingCounter.from(JSON.parse(json));

  assertEquals([...restored], [...original]);
  assertEquals(restored.total, original.total);
  assertEquals(restored.segmentCount, original.segmentCount);
});

Deno.test("RollingCounter.toJSON() on a never-rotated counter", () => {
  const counter = new RollingCounter(3);
  counter.increment(5);
  const snapshot = counter.toJSON();
  assertEquals(snapshot, { segments: [0, 0, 5] });

  const restored = RollingCounter.from(snapshot);
  assertEquals([...restored], [0, 0, 5]);
  assertEquals(restored.total, 5);
});

Deno.test("RollingCounter.from() produces an independent, functional copy", () => {
  const a = new RollingCounter(3);
  a.increment(5);
  a.rotate();
  a.increment(3);

  const b = RollingCounter.from(a.toJSON());
  b.rotate();
  b.increment(7);

  assertEquals(a.total, 8);
  assertEquals([...a], [0, 5, 3]);
  assertEquals(b.total, 15);
  assertEquals([...b], [5, 3, 7]);
});

Deno.test("RollingCounter.from() with single-segment counter", () => {
  const restored = RollingCounter.from({ segments: [42] });
  assertEquals(restored.total, 42);
  assertEquals(restored.rotate(), 42);
});

Deno.test("RollingCounter.from() throws on empty segments", () => {
  assertThrows(() => RollingCounter.from({ segments: [] }), TypeError);
});

Deno.test("RollingCounter.from() throws on non-array segments", () => {
  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => RollingCounter.from({ segments: "no" as any }),
    TypeError,
  );
});

Deno.test("RollingCounter.from() throws on null / undefined / non-object snapshot", () => {
  for (const bad of [null, undefined, 42, "snap", true]) {
    assertThrows(
      // deno-lint-ignore no-explicit-any
      () => RollingCounter.from(bad as any),
      TypeError,
    );
  }
});

Deno.test("RollingCounter.from() throws on invalid segment values", () => {
  for (const bad of [-1, 1.5, NaN, Infinity]) {
    assertThrows(
      () => RollingCounter.from({ segments: [0, bad, 0] }),
      RangeError,
    );
  }
});
