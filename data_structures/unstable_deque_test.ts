// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { Deque, type ReadonlyDeque } from "./unstable_deque.ts";
import { MyMath } from "./_test_utils.ts";

// -- Construction --

Deno.test("Deque constructor creates an empty deque", () => {
  const deque = new Deque<number>();
  assertEquals(deque.length, 0);
  assertEquals(deque.isEmpty(), true);
  assertEquals([...deque], []);
});

Deno.test("Deque constructor treats null/undefined as empty", () => {
  const fromNull = new Deque(null as unknown as Iterable<number>);
  assertEquals(fromNull.length, 0);
});

Deno.test("Deque constructor populates from an array", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque constructor populates from a non-array iterable", () => {
  const deque = new Deque(new Set([10, 20, 30]));
  assertEquals([...deque], [10, 20, 30]);
});

Deno.test("Deque constructor copies from an existing deque", () => {
  const original = new Deque([1, 2, 3]);
  const copy = new Deque(original);
  assertEquals([...copy], [1, 2, 3]);
  original.popFront();
  assertEquals([...copy], [1, 2, 3]);
});

Deno.test("Deque constructor with >8 non-array elements rounds capacity up", () => {
  function* gen() {
    for (let i = 0; i < 12; i++) yield i;
  }
  const deque = new Deque(gen());
  assertEquals(deque.length, 12);
  for (let i = 0; i < 12; i++) assertEquals(deque.at(i), i);
});

Deno.test("Deque constructor throws TypeError for non-iterable source", () => {
  assertThrows(
    () => new Deque(42 as unknown as Iterable<number>),
    TypeError,
    "Cannot construct a Deque",
  );
  assertThrows(
    () => new Deque({} as unknown as Iterable<unknown>),
    TypeError,
    "Cannot construct a Deque",
  );
});

// -- pushBack / popFront --

Deno.test("Deque.pushBack() appends values and returns new length", () => {
  const deque = new Deque<number>();
  assertEquals(deque.pushBack(1), 1);
  assertEquals(deque.pushBack(2, 3), 3);
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque.popFront() removes and returns the front element", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.popFront(), 1);
  assertEquals(deque.length, 2);
  assertEquals([...deque], [2, 3]);
});

Deno.test("Deque.popFront() returns undefined when empty", () => {
  assertStrictEquals(new Deque<number>().popFront(), undefined);
});

Deno.test("Deque.pushBack() grows via #growInPlace when head is 0", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 100; i++) deque.pushBack(i);
  assertEquals(deque.length, 100);
  for (let i = 0; i < 100; i++) assertEquals(deque.at(i), i);
});

Deno.test("Deque.pushBack() grows via #grow when head is not 0", () => {
  const deque = new Deque<number>();
  // Advance head away from 0
  for (let i = 0; i < 4; i++) deque.pushBack(i);
  for (let i = 0; i < 4; i++) deque.popFront();
  // Now head != 0; fill to trigger grow
  for (let i = 0; i < 20; i++) deque.pushBack(i);
  assertEquals(deque.length, 20);
  for (let i = 0; i < 20; i++) assertEquals(deque.at(i), i);
});

Deno.test("Deque.pushBack() grows during rest-args with head != 0", () => {
  const deque = new Deque<number>();
  // Advance head so head != 0
  deque.pushBack(0);
  deque.popFront();
  // Fill to 7 of 8 capacity
  for (let i = 0; i < 7; i++) deque.pushBack(i);
  // First arg fills slot 8 (triggers grow with head != 0), rest args continue
  deque.pushBack(7, 8, 9);
  assertEquals(deque.length, 10);
  for (let i = 0; i < 10; i++) assertEquals(deque.at(i), i);
});

Deno.test("Deque.pushBack() grows during rest-args with head == 0", () => {
  const deque = new Deque<number>();
  // Head stays at 0; fill to 7 of 8 capacity
  for (let i = 0; i < 7; i++) deque.pushBack(i);
  // First arg fills slot 8 (triggers growInPlace), rest args continue
  deque.pushBack(7, 8, 9);
  assertEquals(deque.length, 10);
  for (let i = 0; i < 10; i++) assertEquals(deque.at(i), i);
});

// -- pushFront / popBack --

Deno.test("Deque.pushFront() prepends values and returns new length", () => {
  const deque = new Deque([4, 5]);
  assertEquals(deque.pushFront(1, 2, 3), 5);
  assertEquals([...deque], [1, 2, 3, 4, 5]);
});

Deno.test("Deque.popBack() removes and returns the back element", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.popBack(), 3);
  assertEquals(deque.length, 2);
  assertEquals([...deque], [1, 2]);
});

Deno.test("Deque.popBack() returns undefined when empty", () => {
  assertStrictEquals(new Deque<number>().popBack(), undefined);
});

Deno.test("Deque.pushFront() triggers grow with many args", () => {
  const deque = new Deque<number>();
  const args = Array.from({ length: 20 }, (_, i) => i) as [
    number,
    ...number[],
  ];
  deque.pushFront(...args);
  assertEquals([...deque], args);
});

Deno.test("Deque.pushFront() grows on final value when buffer is full", () => {
  const deque = new Deque<number>();
  // Fill 7 of 8 slots from the back
  for (let i = 2; i < 9; i++) deque.pushBack(i);
  // pushFront(0, 1): rest arg "1" fills slot 8, then "0" triggers grow
  deque.pushFront(0, 1);
  assertEquals([...deque], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

Deno.test("Deque.pushFront() interleaved with pushBack() preserves order", () => {
  const deque = new Deque<number>();
  deque.pushBack(3, 4);
  deque.pushFront(1, 2);
  deque.pushBack(5);
  assertEquals([...deque], [1, 2, 3, 4, 5]);
});

// -- peekFront / peekBack --

Deno.test("Deque.peekFront() returns front without removing it", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.peekFront(), 1);
  assertEquals(deque.length, 3);
});

Deno.test("Deque.peekBack() returns back without removing it", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.peekBack(), 3);
  assertEquals(deque.length, 3);
});

Deno.test("Deque.peekFront() and peekBack() return undefined when empty", () => {
  const deque = new Deque<number>();
  assertStrictEquals(deque.peekFront(), undefined);
  assertStrictEquals(deque.peekBack(), undefined);
});

// -- at() --

Deno.test("Deque.at() returns element at positive and negative indices", () => {
  const deque = new Deque([10, 20, 30, 40]);
  assertEquals(deque.at(0), 10);
  assertEquals(deque.at(3), 40);
  assertEquals(deque.at(-1), 40);
  assertEquals(deque.at(-4), 10);
});

Deno.test("Deque.at() returns undefined for out-of-range index", () => {
  const deque = new Deque([1, 2, 3]);
  assertStrictEquals(deque.at(3), undefined);
  assertStrictEquals(deque.at(-4), undefined);
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
});

// -- toArray() --

Deno.test("Deque.toArray() returns a detached front-to-back copy", () => {
  const deque = new Deque<number>();
  deque.pushBack(3, 4);
  deque.pushFront(1, 2);
  const arr = deque.toArray();
  assertEquals(arr, [1, 2, 3, 4]);
  arr[0] = 999;
  assertEquals(deque.at(0), 1);
});

// -- Iteration --

Deno.test("Deque iteration is front-to-back and non-destructive", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals([...deque], [1, 2, 3]);
  assertEquals(Array.from(deque), [1, 2, 3]);
  assertEquals(deque.length, 3);
});

// -- reversed() --

Deno.test("Deque.reversed() iterates back-to-front", () => {
  const deque = new Deque([1, 2, 3, 4]);
  assertEquals([...deque.reversed()], [4, 3, 2, 1]);
});

// -- from() --

Deno.test("Deque.from() creates a deque from an ArrayLike", () => {
  const arrayLike = { 0: "a", 1: "b", 2: "c", length: 3 };
  const deque = Deque.from(arrayLike);
  assertEquals([...deque], ["a", "b", "c"]);
});

Deno.test("Deque.from() creates a deque from an Iterable", () => {
  const deque = Deque.from(new Set([1, 2, 3]));
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque.from() copies an existing deque", () => {
  const original = new Deque([1, 2, 3]);
  const copy = Deque.from(original);
  assertEquals([...copy], [1, 2, 3]);
  original.popFront();
  assertEquals([...copy], [1, 2, 3]);
});

Deno.test("Deque.from() with map transforms elements", () => {
  const deque = Deque.from([1, 2, 3], { map: (v) => v * 10 });
  assertEquals([...deque], [10, 20, 30]);
  const withIndex = Deque.from(["a", "b", "c"], { map: (v, i) => `${v}${i}` });
  assertEquals([...withIndex], ["a0", "b1", "c2"]);
});

Deno.test("Deque.from() with map on existing deque", () => {
  const original = new Deque([1, 2, 3]);
  const mapped = Deque.from(original, { map: (v) => v.toString() });
  assertEquals([...mapped], ["1", "2", "3"]);
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

Deno.test("Deque.from() handles empty collections", () => {
  assertEquals([...Deque.from([])], []);
  assertEquals([...Deque.from(new Deque<number>())], []);
});

Deno.test("Deque.from() throws TypeError for invalid collection", () => {
  assertThrows(
    () => Deque.from(null as unknown as Iterable<number>),
    TypeError,
    "Cannot create a Deque",
  );
  assertThrows(
    () => Deque.from(42 as unknown as Iterable<number>),
    TypeError,
    "Cannot create a Deque",
  );
});

// -- Growth / shrink --

Deno.test("Deque shrinks buffer when length drops below quarter capacity", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 128; i++) deque.pushBack(i);
  for (let i = 0; i < 126; i++) deque.popFront();
  assertEquals(deque.length, 2);
  assertEquals(deque.popFront(), 126);
  assertEquals(deque.popFront(), 127);
});

// -- Ring-buffer wrap-around --

Deno.test("Deque maintains correctness across ring-buffer wrap-around", () => {
  const deque = new Deque<number>();
  // Rotate head around the buffer
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i < 6; i++) deque.pushBack(round * 10 + i);
    for (let i = 0; i < 6; i++) deque.popFront();
  }
  assertEquals(deque.isEmpty(), true);

  // Verify all operations after wrap-around
  deque.pushBack(100, 200, 300);
  assertEquals([...deque], [100, 200, 300]);
  assertEquals(deque.at(0), 100);
  assertEquals(deque.at(-1), 300);

  // pushFront after wrap-around
  deque.clear();
  for (let i = 0; i < 6; i++) deque.pushBack(i);
  for (let i = 0; i < 6; i++) deque.popFront();
  deque.pushFront(3, 2, 1);
  assertEquals([...deque], [3, 2, 1]);
});

// -- removeFirst() --

Deno.test("Deque.removeFirst() returns undefined when no match", () => {
  const deque = new Deque([1, 2, 3]);
  assertStrictEquals(deque.removeFirst((v) => v === 99), undefined);
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque.removeFirst() removes only the first match", () => {
  const deque = new Deque([1, 2, 2, 3]);
  assertEquals(deque.removeFirst((v) => v === 2), 2);
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque.removeFirst() shifts front side for front-half match", () => {
  const deque = new Deque([10, 20, 30, 40, 50]);
  assertEquals(deque.removeFirst((v) => v === 10), 10);
  assertEquals([...deque], [20, 30, 40, 50]);
});

Deno.test("Deque.removeFirst() shifts back side for back-half match", () => {
  const deque = new Deque([10, 20, 30, 40, 50]);
  assertEquals(deque.removeFirst((v) => v === 50), 50);
  assertEquals([...deque], [10, 20, 30, 40]);
});

Deno.test("Deque.removeFirst() works after wrap-around", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 6; i++) deque.pushBack(i);
  for (let i = 0; i < 6; i++) deque.popFront();
  deque.pushBack(10, 20, 30, 40, 50);
  assertEquals(deque.removeFirst((v) => v === 30), 30);
  assertEquals([...deque], [10, 20, 40, 50]);
});

Deno.test("Deque.removeFirst() on single-element deque", () => {
  const deque = new Deque([42]);
  assertEquals(deque.removeFirst((v) => v === 42), 42);
  assertEquals(deque.length, 0);
});

Deno.test("Deque.removeFirst() triggers shrink on large deque", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 128; i++) deque.pushBack(i);
  for (let i = 0; i < 112; i++) deque.popFront();
  assertEquals(deque.removeFirst((v) => v === 120), 120);
  assertEquals(deque.length, 15);
  assertEquals(deque.at(0), 112);
});

Deno.test("Deque.removeFirst() passes index to predicate", () => {
  const deque = new Deque(["a", "b", "c", "d"]);
  const indices: number[] = [];
  deque.removeFirst((_v, i) => {
    indices.push(i);
    return i === 2;
  });
  assertEquals(indices, [0, 1, 2]);
  assertEquals([...deque], ["a", "b", "d"]);
});

// -- find() --

Deno.test("Deque.find() returns the first matching element", () => {
  const deque = new Deque([1, 2, 3, 4]);
  assertEquals(deque.find((v) => v % 2 === 0), 2);
});

Deno.test("Deque.find() returns undefined when no match", () => {
  const deque = new Deque([1, 2, 3]);
  assertStrictEquals(deque.find((v) => v > 10), undefined);
});

Deno.test("Deque.find() passes index to predicate", () => {
  const deque = new Deque(["a", "b", "c"]);
  const indices: number[] = [];
  deque.find((_v, i) => {
    indices.push(i);
    return i === 1;
  });
  assertEquals(indices, [0, 1]);
});

Deno.test("Deque.find() works after wrap-around", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 6; i++) deque.pushBack(i);
  for (let i = 0; i < 6; i++) deque.popFront();
  deque.pushBack(10, 20, 30);
  assertEquals(deque.find((v) => v === 20), 20);
});

// -- findIndex() --

Deno.test("Deque.findIndex() returns the index of the first match", () => {
  const deque = new Deque([1, 2, 3, 4]);
  assertEquals(deque.findIndex((v) => v % 2 === 0), 1);
});

Deno.test("Deque.findIndex() returns -1 when no match", () => {
  const deque = new Deque([1, 2, 3]);
  assertEquals(deque.findIndex((v) => v > 10), -1);
});

Deno.test("Deque.findIndex() works after wrap-around", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 6; i++) deque.pushBack(i);
  for (let i = 0; i < 6; i++) deque.popFront();
  deque.pushBack(10, 20, 30);
  assertEquals(deque.findIndex((v) => v === 30), 2);
});

// -- retain() --

Deno.test("Deque.retain() keeps only matching elements", () => {
  const deque = new Deque([1, 2, 3, 4, 5, 6]);
  deque.retain((v) => v % 2 !== 0);
  assertEquals([...deque], [1, 3, 5]);
});

Deno.test("Deque.retain() removes all when predicate always returns false", () => {
  const deque = new Deque([1, 2, 3]);
  deque.retain(() => false);
  assertEquals(deque.length, 0);
  assertEquals(deque.isEmpty(), true);
});

Deno.test("Deque.retain() keeps all when predicate always returns true", () => {
  const deque = new Deque([1, 2, 3]);
  deque.retain(() => true);
  assertEquals([...deque], [1, 2, 3]);
});

Deno.test("Deque.retain() works after wrap-around", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 6; i++) deque.pushBack(i);
  for (let i = 0; i < 6; i++) deque.popFront();
  deque.pushBack(10, 20, 30, 40, 50);
  deque.retain((v) => v >= 30);
  assertEquals([...deque], [30, 40, 50]);
});

Deno.test("Deque.retain() passes index to predicate", () => {
  const deque = new Deque(["a", "b", "c", "d", "e"]);
  deque.retain((_v, i) => i % 2 === 0);
  assertEquals([...deque], ["a", "c", "e"]);
});

Deno.test("Deque.retain() triggers shrink on large deque", () => {
  const deque = new Deque<number>();
  for (let i = 0; i < 128; i++) deque.pushBack(i);
  deque.retain((v) => v >= 120);
  assertEquals(deque.length, 8);
  assertEquals(deque.at(0), 120);
  assertEquals(deque.at(7), 127);
});

// -- Symbol.toStringTag --

Deno.test("Deque has correct Symbol.toStringTag", () => {
  const deque = new Deque<number>();
  assertEquals(Object.prototype.toString.call(deque), "[object Deque]");
  assertEquals(deque[Symbol.toStringTag], "Deque");
});

// -- ReadonlyDeque --

Deno.test("ReadonlyDeque exposes read-only methods", () => {
  const deque: ReadonlyDeque<number> = new Deque([1, 2, 3, 4]);
  assertEquals(deque.find((v) => v === 3), 3);
  assertEquals(deque.findIndex((v) => v === 3), 2);
  assertEquals(deque[Symbol.toStringTag], "Deque");
});
