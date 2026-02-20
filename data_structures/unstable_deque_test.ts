// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { Deque } from "./unstable_deque.ts";
import { MyMath } from "./_test_utils.ts";

// -- Construction --

Deno.test("Deque constructor creates an empty deque", () => {
  const empty = new Deque<number>();
  assertEquals(empty.length, 0);
  assertEquals(empty.isEmpty(), true);
  assertEquals([...empty], []);
  const fromNull = new Deque(null as unknown as Iterable<number>);
  assertEquals(fromNull.length, 0);
  assertEquals([...fromNull], []);
});

Deno.test("Deque constructor populates from an iterable", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.length, 3);
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque constructor populates from a generator", () => {
  function* gen() {
    yield 10;
    yield 20;
    yield 30;
  }
  const deque = new Deque(gen());
  assertEquals([...deque], [10, 20, 30]);
});

Deno.test("Deque constructor populates from an existing deque", () => {
  const original = new Deque([1, 2, 3]);
  const copy = new Deque(original);
  assertEquals([...copy], [1, 2, 3]);
  original.popFront();
  assertEquals([...copy], [1, 2, 3]);
});

Deno.test("Deque constructor with 9+ elements uses nextPowerOfTwo capacity", () => {
  const deque = new Deque(Array.from({ length: 9 }, (_, i) => i));
  assertEquals(deque.length, 9);
  for (let i = 0; i < 9; i++) assertEquals(deque.at(i), i);
});

Deno.test("Deque constructor throws TypeError for non-iterable source", () => {
  assertThrows(
    () => new Deque(42 as unknown as Iterable<number>),
    TypeError,
    "Cannot construct a Deque",
  );
  assertThrows(
    () => new Deque(true as unknown as Iterable<boolean>),
    TypeError,
    "Cannot construct a Deque",
  );
  assertThrows(
    () => new Deque({} as unknown as Iterable<unknown>),
    TypeError,
    "Cannot construct a Deque",
  );
});

// -- pushBack / popFront (FIFO) --

Deno.test("Deque.pushBack() appends values to the back in order", () => {
  const deque = new Deque<number>();
  deque.pushBack(1, 2, 3);
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque.pushBack() returns the new length", () => {
  const deque = new Deque<number>();
  assertEquals(deque.pushBack(1), 1);
  assertEquals(deque.pushBack(2, 3), 3);
});

Deno.test("Deque.popFront() removes and returns the front element", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.popFront(), 1);
  assertEquals(deque.length, 2);
  assertEquals([...deque], [2, 3]);
});

Deno.test("Deque.pushBack() and popFront() maintain FIFO order", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 20; i++) deque.pushBack(i);
  for (let i = 0; i < 20; i++) assertEquals(deque.popFront(), i);
  assertEquals(deque.isEmpty(), true);
});

Deno.test("Deque.pushBack() triggers resize when buffer is full", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 100; i++) deque.pushBack(i);
  assertEquals(deque.length, 100);
  for (let i = 0; i < 100; i++) assertEquals(deque.at(i), i);
});

// -- pushFront / popBack (LIFO from front) --

Deno.test("Deque.pushFront() prepends values to the front in argument order", () => {
  const deque = new Deque([4, 5]);
  deque.pushFront(1, 2, 3);
  assertEquals([...deque], [1, 2, 3, 4, 5]);
});

Deno.test("Deque.pushFront() returns the new length", () => {
  const deque = new Deque<number>();
  assertEquals(deque.pushFront(1), 1);
  assertEquals(deque.pushFront(2, 3), 3);
});

Deno.test("Deque.pushFront() and popBack() maintain LIFO order", () => {
  const deque = new Deque<number>();
  deque.pushFront(1, 2, 3);
  assertEquals(deque.popBack(), 3);
  assertEquals(deque.popBack(), 2);
  assertEquals(deque.popBack(), 1);
});

Deno.test("Deque.pushFront() interleaved with pushBack() preserves order", () => {
  const deque = new Deque<number>();
  deque.pushBack(3, 4);
  deque.pushFront(1, 2);
  deque.pushBack(5);
  assertEquals([...deque], [1, 2, 3, 4, 5]);
});

// -- peekFront / peekBack --

Deno.test("Deque.peekFront() returns the front element without removing it", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.peekFront(), 1);
  assertEquals(deque.length, 3);
});

Deno.test("Deque.peekBack() returns the back element without removing it", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.peekBack(), 3);
  assertEquals(deque.length, 3);
});

Deno.test("Deque.peekFront() returns undefined when empty", () => {
  const deque = new Deque<number>();
  assertStrictEquals(deque.peekFront(), undefined);
});

Deno.test("Deque.peekBack() returns undefined when empty", () => {
  const deque = new Deque<number>();
  assertStrictEquals(deque.peekBack(), undefined);
});

// -- at() --

Deno.test("Deque.at() returns element at positive index", () => {
  const deque = new Deque([10, 20, 30, 40]);
  assertEquals(deque.at(0), 10);
  assertEquals(deque.at(1), 20);
  assertEquals(deque.at(3), 40);
});

Deno.test("Deque.at() returns element at negative index", () => {
  const deque = new Deque([10, 20, 30, 40]);
  assertEquals(deque.at(-1), 40);
  assertEquals(deque.at(-2), 30);
  assertEquals(deque.at(-4), 10);
});

Deno.test("Deque.at() returns undefined for out-of-range index", () => {
  const deque = new Deque([1, 2, 3]);
  assertStrictEquals(deque.at(3), undefined);
  assertStrictEquals(deque.at(-4), undefined);
  assertStrictEquals(deque.at(100), undefined);
});

Deno.test("Deque.at() works correctly after wrap-around", () => {
  const deque = new Deque<number>();
  // Push and pop to move head around the ring buffer
  for (let i = 0; i < 20; i++) {
    deque.pushBack(i);
    deque.popFront();
  }
  deque.pushBack(100, 200, 300);
  assertEquals(deque.at(0), 100);
  assertEquals(deque.at(1), 200);
  assertEquals(deque.at(2), 300);
  assertEquals(deque.at(-1), 300);
});

// -- clear() --

Deno.test("Deque.clear() resets state and allows reuse", () => {
  const deque = new Deque([1, 2, 3, 4, 5]);
  deque.clear();
  assertEquals(deque.length, 0);
  assertEquals(deque.isEmpty(), true);
  assertEquals([...deque], []);
  deque.pushBack(10, 20);
  assertEquals([...deque], [10, 20]);
  assertEquals(deque.popFront(), 10);
});

// -- toArray() --

Deno.test("Deque.toArray() returns front-to-back copy", () => {
  const deque = new Deque<number>();
  deque.pushBack(3, 4);
  deque.pushFront(1, 2);
  assertEquals(deque.toArray(), [1, 2, 3, 4]);
  const arr = deque.toArray();
  arr[0] = 999;
  assertEquals(deque.at(0), 1);
});

// -- Iteration --

Deno.test("Deque iteration is front-to-back and non-destructive", () => {
  const deque = new Deque([1, 2, 3]);
  const result: number[] = [];
  for (const v of deque) result.push(v);
  assertEquals(result, [1, 2, 3]);
  assertEquals([...deque], [1, 2, 3]);
  assertEquals(Array.from(deque), [1, 2, 3]);
  assertEquals(deque.length, 3);
});

// -- reversed() --

Deno.test("Deque.reversed() iterates back-to-front", () => {
  const deque = new Deque([1, 2, 3, 4]);
  assertEquals([...deque.reversed()], [4, 3, 2, 1]);
});

Deno.test("Deque.reversed() returns empty iterator for empty deque", () => {
  const deque = new Deque<number>();
  assertEquals([...deque.reversed()], []);
});

// -- from() --

Deno.test("Deque.from() creates a deque from an ArrayLike", () => {
  const arrayLike = { 0: "a", 1: "b", 2: "c", length: 3 };
  const deque = Deque.from(arrayLike);
  assertEquals([...deque], ["a", "b", "c"]);
});

Deno.test("Deque.from() creates a deque from an Iterable", () => {
  const set = new Set([1, 2, 3]);
  const deque = Deque.from(set);
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque.from() creates a deque from an existing Deque", () => {
  const original = new Deque([1, 2, 3]);
  const copy = Deque.from(original);
  assertEquals([...copy], [1, 2, 3]);
  // Verify it's a copy, not a reference
  original.popFront();
  assertEquals([...copy], [1, 2, 3]);
});

Deno.test("Deque.from() map receives value and index", () => {
  const deque = Deque.from([1, 2, 3], { map: (v) => v * 10 });
  assertEquals([...deque], [10, 20, 30]);
  const withIndex = Deque.from(["a", "b", "c"], { map: (v, i) => `${v}${i}` });
  assertEquals([...withIndex], ["a0", "b1", "c2"]);
});

Deno.test("Deque.from() uses thisArg for map function", () => {
  const math = new MyMath();
  const deque = Deque.from([1, 2, 3], {
    map: function (this: MyMath, v: number) {
      return this.multiply(v, 10);
    },
    thisArg: math,
  });
  assertEquals([...deque], [10, 20, 30]);
});

Deno.test("Deque.from() with map on existing Deque", () => {
  const original = new Deque([1, 2, 3]);
  const mapped = Deque.from(original, { map: (v) => v.toString() });
  assertEquals([...mapped], ["1", "2", "3"]);
});

// -- Growth / shrink --

Deno.test("Deque grows buffer when capacity is exceeded", () => {
  const deque = new Deque<number>();
  const count = 256;
  for (let i = 0; i < count; i++) deque.pushBack(i);
  assertEquals(deque.length, count);
  for (let i = 0; i < count; i++) assertEquals(deque.at(i), i);
});

Deno.test("Deque shrinks buffer when length drops below quarter capacity", () => {
  const deque = new Deque<number>();
  // Grow to a large capacity
  for (let i = 0; i < 128; i++) deque.pushBack(i);
  assertEquals(deque.length, 128);
  // Pop most elements to trigger shrinking
  for (let i = 0; i < 126; i++) deque.popFront();
  assertEquals(deque.length, 2);
  assertEquals(deque.popFront(), 126);
  assertEquals(deque.popFront(), 127);
});

// -- Ring-buffer wrap-around --

Deno.test("Deque maintains correctness across ring-buffer wrap-around", () => {
  const deque = new Deque<number>();
  // Alternate pushFront/popBack to rotate head around the buffer
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i < 6; i++) deque.pushBack(round * 10 + i);
    for (let i = 0; i < 6; i++) deque.popFront();
  }
  assertEquals(deque.isEmpty(), true);

  // Now push and verify after head has wrapped
  deque.pushBack(100, 200, 300);
  assertEquals([...deque], [100, 200, 300]);
  assertEquals(deque.at(0), 100);
  assertEquals(deque.at(-1), 300);
});

Deno.test("Deque pushFront wrap-around works correctly", () => {
  const deque = new Deque<number>();
  // Move head forward by pushing/popping from back
  for (let i = 0; i < 6; i++) deque.pushBack(i);
  for (let i = 0; i < 6; i++) deque.popFront();

  // Now pushFront should wrap around
  deque.pushFront(3, 2, 1);
  assertEquals([...deque], [3, 2, 1]);
});

Deno.test("Deque.pushFront() triggers grow when buffer is full", () => {
  const deque = new Deque<number>();
  for (let i = 8; i >= 0; i--) deque.pushFront(i);
  assertEquals(deque.length, 9);
  assertEquals([...deque], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  for (let i = 0; i < 9; i++) assertEquals(deque.at(i), i);
});

// -- Edge cases --

Deno.test("Deque.popFront() returns undefined when empty", () => {
  const deque = new Deque<number>();
  assertStrictEquals(deque.popFront(), undefined);
});

Deno.test("Deque.popBack() returns undefined when empty", () => {
  const deque = new Deque<number>();
  assertStrictEquals(deque.popBack(), undefined);
});

Deno.test("Deque handles single-element push and pop", () => {
  const deque = new Deque<string>();
  deque.pushBack("only");
  assertEquals(deque.length, 1);
  assertEquals(deque.peekFront(), "only");
  assertEquals(deque.peekBack(), "only");
  assertEquals(deque.at(0), "only");
  assertEquals(deque.at(-1), "only");
  assertEquals(deque.popFront(), "only");
  assertEquals(deque.isEmpty(), true);
});

Deno.test("Deque.pushBack() then popFront() on capacity boundary", () => {
  const deque = new Deque<number>();
  // Fill exactly to initial capacity (8)
  for (let i = 0; i < 8; i++) deque.pushBack(i);
  assertEquals(deque.length, 8);
  // Pop all
  for (let i = 0; i < 8; i++) assertEquals(deque.popFront(), i);
  assertEquals(deque.isEmpty(), true);
});

// -- Symbol.toStringTag --

Deno.test("Deque has correct Symbol.toStringTag", () => {
  const deque = new Deque<number>();
  assertEquals(Object.prototype.toString.call(deque), "[object Deque]");
  assertEquals(deque[Symbol.toStringTag], "Deque");
});

// -- from() with empty collections --

Deno.test("Deque.from() handles empty array", () => {
  const deque = Deque.from([]);
  assertEquals(deque.length, 0);
  assertEquals([...deque], []);
});

Deno.test("Deque.from() handles empty deque", () => {
  const empty = new Deque<number>();
  const copy = Deque.from(empty);
  assertEquals(copy.length, 0);
  assertEquals([...copy], []);
});

// -- String source --

Deno.test("Deque constructor accepts a string as iterable", () => {
  const deque = new Deque("abc");
  assertEquals([...deque], ["a", "b", "c"]);
});
