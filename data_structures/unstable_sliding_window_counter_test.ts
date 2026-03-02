// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { SlidingWindowCounter } from "./unstable_sliding_window_counter.ts";

// -- Constructor --

Deno.test("SlidingWindowCounter() throws on invalid segmentCount", () => {
  for (const bad of [0, -1, 1.5, NaN, Infinity]) {
    assertThrows(() => new SlidingWindowCounter(bad), RangeError);
  }
});

Deno.test("SlidingWindowCounter() initializes with correct segmentCount and zero total", () => {
  const counter = new SlidingWindowCounter(3);
  assertEquals(counter.segmentCount, 3);
  assertEquals(counter.total, 0);
  assertEquals([...counter], [0, 0, 0]);
});

// -- increment --

Deno.test("SlidingWindowCounter.increment() throws on invalid n", () => {
  const counter = new SlidingWindowCounter(3);
  for (const bad of [-1, 1.5, NaN, Infinity]) {
    assertThrows(() => counter.increment(bad), RangeError);
  }
});

Deno.test("SlidingWindowCounter.increment() defaults to 1 and accumulates in current segment", () => {
  const counter = new SlidingWindowCounter(3);
  assertEquals(counter.increment(), 1);
  assertEquals(counter.increment(4), 5);
  assertEquals(counter.increment(0), 5);
  assertEquals([...counter], [0, 0, 5]);
});

// -- rotate (single step) --

Deno.test("SlidingWindowCounter.rotate() evicts oldest segment and updates total", () => {
  const counter = new SlidingWindowCounter(3);
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

Deno.test("SlidingWindowCounter.rotate() on empty segments returns 0", () => {
  const counter = new SlidingWindowCounter(3);
  assertEquals(counter.rotate(), 0);
  assertEquals(counter.total, 0);
});

// -- rotate(steps) --

Deno.test("SlidingWindowCounter.rotate() throws on invalid steps", () => {
  const counter = new SlidingWindowCounter(3);
  for (const bad of [-1, 1.5, NaN, Infinity]) {
    assertThrows(() => counter.rotate(bad), RangeError);
  }
});

Deno.test("SlidingWindowCounter.rotate() with steps=0 is a no-op", () => {
  const counter = new SlidingWindowCounter(3);
  counter.increment(10);
  assertEquals(counter.rotate(0), 0);
  assertEquals(counter.total, 10);
  assertEquals([...counter], [0, 0, 10]);
});

Deno.test("SlidingWindowCounter.rotate() bulk advances partial window", () => {
  const counter = new SlidingWindowCounter(4);
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

Deno.test("SlidingWindowCounter.rotate() with steps >= segmentCount clears all and positions cursor correctly", () => {
  const counter = new SlidingWindowCounter(3);
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

Deno.test("SlidingWindowCounter.rotate() with steps > segmentCount clears all", () => {
  const counter = new SlidingWindowCounter(3);
  counter.increment(5);
  counter.rotate();
  counter.increment(3);

  const evicted = counter.rotate(100);
  assertEquals(evicted, 8);
  assertEquals(counter.total, 0);
});

Deno.test("SlidingWindowCounter.rotate() bulk matches repeated single rotates", () => {
  const a = new SlidingWindowCounter(4);
  const b = new SlidingWindowCounter(4);
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

Deno.test("SlidingWindowCounter.clear() resets to initial state", () => {
  const counter = new SlidingWindowCounter(3);
  counter.increment(10);
  counter.rotate();
  counter.increment(5);
  counter.rotate();
  counter.clear();

  const fresh = new SlidingWindowCounter(3);
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

// -- Symbol.iterator --

Deno.test("SlidingWindowCounter[Symbol.iterator]() yields segments oldest to newest", () => {
  const counter = new SlidingWindowCounter(3);
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

Deno.test("SlidingWindowCounter with segmentCount of 1 evicts on every rotate", () => {
  const counter = new SlidingWindowCounter(1);
  counter.increment(42);
  assertEquals([...counter], [42]);

  const evicted = counter.rotate();
  assertEquals(evicted, 42);
  assertEquals(counter.total, 0);
  assertEquals([...counter], [0]);
});

Deno.test("SlidingWindowCounter handles many rotations without data loss", () => {
  const counter = new SlidingWindowCounter(3);
  counter.increment(10);
  for (let i = 0; i < 100; i++) counter.rotate();
  assertEquals(counter.total, 0);

  counter.increment(1);
  assertEquals([...counter], [0, 0, 1]);
});
