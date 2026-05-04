// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { descend } from "./comparators.ts";
import {
  type HeapEntry,
  IndexedHeap,
  type ReadonlyIndexedHeap,
} from "./unstable_indexed_heap.ts";

Deno.test("IndexedHeap push / pop / peek with ascending priorities", () => {
  const heap = new IndexedHeap<string>();

  assertEquals(heap.size, 0);
  assertEquals(heap.isEmpty(), true);
  assertEquals(heap.peek(), undefined);
  assertEquals(heap.pop(), undefined);

  for (
    const [key, priority] of [["d", 4], ["b", 2], ["e", 5], ["a", 1], [
      "c",
      3,
    ]] as const
  ) {
    heap.push(key, priority);
  }

  assertEquals(heap.size, 5);
  assertEquals(heap.isEmpty(), false);
  assertEquals(heap.peek(), { key: "a", priority: 1 });

  const popped: HeapEntry<string>[] = [];
  while (!heap.isEmpty()) {
    popped.push(heap.pop()!);
  }
  assertEquals(popped, [
    { key: "a", priority: 1 },
    { key: "b", priority: 2 },
    { key: "c", priority: 3 },
    { key: "d", priority: 4 },
    { key: "e", priority: 5 },
  ]);
  assertEquals(heap.size, 0);
  assertEquals(heap.peek(), undefined);
  assertEquals(heap.pop(), undefined);
});

Deno.test("IndexedHeap push throws on duplicate key", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  assertThrows(
    () => heap.push("a", 2),
    TypeError,
    "Cannot push into IndexedHeap: key already exists",
  );
});

Deno.test("IndexedHeap delete root", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  heap.push("b", 2);
  heap.push("c", 3);

  assertEquals(heap.delete("a"), true);
  assertEquals(heap.size, 2);
  assertEquals(heap.has("a"), false);
  assertEquals(heap.peek(), { key: "b", priority: 2 });

  assertEquals([...heap.drain()], [
    { key: "b", priority: 2 },
    { key: "c", priority: 3 },
  ]);
});

Deno.test("IndexedHeap delete middle element triggers sift-down", () => {
  // Heap shape (array order): a=1, b=5, c=3, d=10, e=8
  //        a(1)
  //       /    \
  //     b(5)   c(3)
  //    /   \
  //  d(10) e(8)
  // Deleting "c" (index 2) moves "e" (priority 8) into index 2.
  // 8 > children? No children at that index, so it stays — but "c" is gone.
  // Deleting "b" (index 1) moves last element into index 1 and sifts down.
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  heap.push("b", 5);
  heap.push("c", 3);
  heap.push("d", 10);
  heap.push("e", 8);

  heap.delete("b");
  assertEquals(heap.size, 4);
  assertEquals(heap.has("b"), false);

  const result = [...heap.drain()];
  assertEquals(result, [
    { key: "a", priority: 1 },
    { key: "c", priority: 3 },
    { key: "e", priority: 8 },
    { key: "d", priority: 10 },
  ]);
});

Deno.test("IndexedHeap delete last array element (no sift needed)", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  heap.push("b", 2);

  assertEquals(heap.delete("b"), true);
  assertEquals(heap.size, 1);
  assertEquals(heap.peek(), { key: "a", priority: 1 });
});

Deno.test("IndexedHeap delete and getPriority for non-existent key", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  assertEquals(heap.delete("z"), false);
  assertEquals(heap.getPriority("z"), undefined);
  assertEquals(heap.size, 1);
});

Deno.test("IndexedHeap delete only element", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  assertEquals(heap.delete("a"), true);
  assertEquals(heap.size, 0);
  assertEquals(heap.isEmpty(), true);
  assertEquals(heap.peek(), undefined);
});

Deno.test("IndexedHeap delete triggers sift-up when replacement is smaller", () => {
  // Heap array: [r(1), a(50), b(3), c(51), d(52), e(4), f(5)]
  //         r(1)
  //        /    \
  //     a(50)   b(3)
  //    /   \    /  \
  // c(51) d(52) e(4) f(5)
  //
  // Deleting "c" (index 3) moves last element "f" (priority 5) into index 3.
  // Parent of index 3 is "a" (priority 50). Since 5 < 50, "f" sifts up.
  const heap = new IndexedHeap<string>();
  for (
    const [key, priority] of [
      ["r", 1],
      ["a", 50],
      ["b", 3],
      ["c", 51],
      ["d", 52],
      ["e", 4],
      ["f", 5],
    ] as const
  ) {
    heap.push(key, priority);
  }

  heap.delete("c");

  assertEquals(heap.peek(), { key: "r", priority: 1 });
  assertEquals(heap.has("c"), false);
  assertEquals(heap.size, 6);
  assertEquals(heap.getPriority("f"), 5);

  assertEquals([...heap.drain()], [
    { key: "r", priority: 1 },
    { key: "b", priority: 3 },
    { key: "e", priority: 4 },
    { key: "f", priority: 5 },
    { key: "a", priority: 50 },
    { key: "d", priority: 52 },
  ]);
});

Deno.test("IndexedHeap set decreases priority and bubbles up", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 10);
  heap.push("b", 20);
  heap.push("c", 30);

  heap.set("c", 1);
  assertEquals(heap.peek(), { key: "c", priority: 1 });
  assertEquals(heap.getPriority("c"), 1);
});

Deno.test("IndexedHeap set increases priority and bubbles down", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  heap.push("b", 2);
  heap.push("c", 3);

  heap.set("a", 100);
  assertEquals(heap.peek(), { key: "b", priority: 2 });

  assertEquals([...heap.drain()], [
    { key: "b", priority: 2 },
    { key: "c", priority: 3 },
    { key: "a", priority: 100 },
  ]);
});

Deno.test("IndexedHeap set inserts when absent and updates when present", () => {
  const heap = new IndexedHeap<string>();
  heap.set("a", 10);
  assertEquals(heap.size, 1);
  assertEquals(heap.getPriority("a"), 10);

  heap.set("a", 5);
  assertEquals(heap.size, 1);
  assertEquals(heap.getPriority("a"), 5);
  assertEquals(heap.peek(), { key: "a", priority: 5 });
});

Deno.test("IndexedHeap set decrease then increase same key", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 10);
  heap.push("b", 20);
  heap.push("c", 30);

  heap.set("c", 1);
  assertEquals(heap.peek(), { key: "c", priority: 1 });

  heap.set("c", 50);
  assertEquals(heap.peek(), { key: "a", priority: 10 });

  assertEquals([...heap.drain()], [
    { key: "a", priority: 10 },
    { key: "b", priority: 20 },
    { key: "c", priority: 50 },
  ]);
});

Deno.test("IndexedHeap set with same priority is a no-op", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  heap.push("b", 5);
  heap.push("c", 5);
  heap.push("d", 5);
  heap.push("e", 10);

  const before = heap.toArray();
  heap.set("c", 5);
  const after = heap.toArray();

  assertEquals(after, before, "internal heap order preserved");

  const popped: number[] = [];
  while (!heap.isEmpty()) {
    popped.push(heap.pop()!.priority);
  }
  assertEquals(popped, [1, 5, 5, 5, 10]);
});

Deno.test("IndexedHeap size tracks push, pop, delete, clear", () => {
  const heap = new IndexedHeap<string>();
  assertEquals(heap.size, 0);

  heap.push("a", 1);
  assertEquals(heap.size, 1);

  heap.push("b", 2);
  assertEquals(heap.size, 2);

  heap.pop();
  assertEquals(heap.size, 1);

  heap.push("c", 3);
  heap.delete("b");
  assertEquals(heap.size, 1);

  heap.clear();
  assertEquals(heap.size, 0);
});

Deno.test("IndexedHeap iterator is non-destructive", () => {
  const heap = new IndexedHeap<string>();
  heap.push("c", 3);
  heap.push("a", 1);
  heap.push("b", 2);

  const first = [...heap];
  assertEquals(first.length, 3);
  assertEquals(heap.size, 3, "heap not modified by iteration");

  const second = [...heap];
  assertEquals(second, first, "iterating again yields same entries");

  const keys = first.map((e) => e.key).sort();
  assertEquals(keys, ["a", "b", "c"]);
});

Deno.test("IndexedHeap drain() yields in ascending order", () => {
  const heap = new IndexedHeap<string>();
  heap.push("x", 10);
  heap.push("y", 5);
  heap.push("z", 15);

  assertEquals([...heap.drain()], [
    { key: "y", priority: 5 },
    { key: "x", priority: 10 },
    { key: "z", priority: 15 },
  ]);
  assertEquals(heap.size, 0);
});

Deno.test("IndexedHeap drain() on empty heap yields nothing", () => {
  const heap = new IndexedHeap<string>();
  assertEquals([...heap.drain()], []);
});

Deno.test("IndexedHeap drain() retains remaining entries on early break", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  heap.push("b", 2);
  heap.push("c", 3);
  heap.push("d", 4);

  const drained: HeapEntry<string>[] = [];
  for (const entry of heap.drain()) {
    drained.push(entry);
    if (entry.key === "b") break;
  }

  assertEquals(drained, [
    { key: "a", priority: 1 },
    { key: "b", priority: 2 },
  ]);
  assertEquals(heap.size, 2);
  assertEquals(heap.has("c"), true);
  assertEquals(heap.has("d"), true);
  assertEquals([...heap.drain()], [
    { key: "c", priority: 3 },
    { key: "d", priority: 4 },
  ]);
});

Deno.test("IndexedHeap peekKey() returns the key of the front entry", () => {
  const heap = new IndexedHeap<string>();
  assertEquals(heap.peekKey(), undefined);

  heap.push("a", 5);
  heap.push("b", 1);
  assertEquals(heap.peekKey(), "b");
});

Deno.test("IndexedHeap peekPriority() returns the priority of the front entry", () => {
  const heap = new IndexedHeap<string>();
  assertEquals(heap.peekPriority(), undefined);

  heap.push("a", 5);
  heap.push("b", 1);
  assertEquals(heap.peekPriority(), 1);
});

Deno.test("IndexedHeap peek returns a copy, not a reference", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 10);

  const peeked = heap.peek()!;
  (peeked as { priority: number }).priority = 999;

  assertEquals(heap.peek()!.priority, 10);
});

Deno.test("IndexedHeap is assignable to ReadonlyIndexedHeap", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  heap.push("b", 2);

  const ro: ReadonlyIndexedHeap<string> = heap;
  assertEquals(ro.peek(), { key: "a", priority: 1 });
  assertEquals(ro.has("a"), true);
  assertEquals(ro.has("z"), false);
  assertEquals(ro.getPriority("a"), 1);
  assertEquals(ro.getPriority("z"), undefined);
  assertEquals(ro.size, 2);
  assertEquals(ro.isEmpty(), false);

  assertEquals(ro.toArray().length, 2);
  assertEquals([...ro].length, 2);

  assertEquals(heap.size, 2, "heap unchanged after readonly queries");
});

Deno.test("IndexedHeap handles duplicate priorities", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 5);
  heap.push("b", 5);
  heap.push("c", 5);

  assertEquals(heap.size, 3);
  const results: HeapEntry<string>[] = [];
  while (!heap.isEmpty()) {
    results.push(heap.pop()!);
  }
  assertEquals(results.length, 3);
  for (const entry of results) {
    assertEquals(entry.priority, 5);
  }
  assertEquals(results.map((e) => e.key).sort(), ["a", "b", "c"]);
});

Deno.test("IndexedHeap with object keys uses reference identity", () => {
  const keyA = { id: "a" };
  const keyB = { id: "b" };
  const keyADuplicate = { id: "a" };

  const heap = new IndexedHeap<{ id: string }>();
  heap.push(keyA, 1);
  heap.push(keyB, 2);
  heap.push(keyADuplicate, 3);

  assertEquals(heap.size, 3);
  assertEquals(heap.has(keyA), true);
  assertEquals(heap.has(keyADuplicate), true);

  assertEquals(heap.getPriority(keyA), 1);
  assertEquals(heap.getPriority(keyADuplicate), 3);
});

Deno.test("IndexedHeap handles negative priorities", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", -10);
  heap.push("b", -5);
  heap.push("c", 0);
  heap.push("d", 5);

  assertEquals([...heap.drain()], [
    { key: "a", priority: -10 },
    { key: "b", priority: -5 },
    { key: "c", priority: 0 },
    { key: "d", priority: 5 },
  ]);
});

Deno.test("IndexedHeap handles Infinity and -Infinity priorities", () => {
  const heap = new IndexedHeap<string>();
  heap.push("pos", Infinity);
  heap.push("neg", -Infinity);
  heap.push("zero", 0);

  assertEquals([...heap.drain()], [
    { key: "neg", priority: -Infinity },
    { key: "zero", priority: 0 },
    { key: "pos", priority: Infinity },
  ]);
});

Deno.test("IndexedHeap works correctly after clear and reuse", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 1);
  heap.push("b", 2);
  heap.clear();

  heap.push("c", 30);
  heap.push("d", 10);
  heap.push("e", 20);

  assertEquals(heap.size, 3);
  assertEquals(heap.peek(), { key: "d", priority: 10 });
  assertEquals(heap.has("a"), false);
  assertEquals(heap.has("d"), true);

  assertEquals([...heap.drain()], [
    { key: "d", priority: 10 },
    { key: "e", priority: 20 },
    { key: "c", priority: 30 },
  ]);
});

Deno.test("IndexedHeap interleaved push, pop, set, delete", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 10);
  heap.push("b", 20);
  heap.push("c", 30);

  assertEquals(heap.pop(), { key: "a", priority: 10 });

  heap.push("d", 5);
  heap.set("c", 1);

  assertEquals(heap.peek(), { key: "c", priority: 1 });

  heap.delete("b");
  heap.push("e", 3);

  assertEquals(heap.size, 3);
  assertEquals([...heap.drain()], [
    { key: "c", priority: 1 },
    { key: "e", priority: 3 },
    { key: "d", priority: 5 },
  ]);
});

Deno.test("IndexedHeap pop with two elements exercises general path", () => {
  const heap = new IndexedHeap<string>();
  heap.push("big", 100);
  heap.push("small", 1);

  // pop() with size=2 takes the general path: move last to root, sift-down
  assertEquals(heap.pop(), { key: "small", priority: 1 });
  assertEquals(heap.size, 1);
  assertEquals(heap.pop(), { key: "big", priority: 100 });
});

Deno.test("IndexedHeap push throws on NaN priority", () => {
  const heap = new IndexedHeap<string>();
  assertThrows(
    () => heap.push("a", NaN),
    RangeError,
    "Cannot set priority: value is NaN",
  );
  assertEquals(heap.size, 0);
});

Deno.test("IndexedHeap set throws on NaN priority", () => {
  const heap = new IndexedHeap<string>();
  assertThrows(
    () => heap.set("a", NaN),
    RangeError,
    "Cannot set priority: value is NaN",
  );
  assertEquals(heap.size, 0, "absent key not inserted on NaN");

  heap.push("b", 1);
  assertThrows(
    () => heap.set("b", NaN),
    RangeError,
    "Cannot set priority: value is NaN",
  );
  assertEquals(
    heap.getPriority("b"),
    1,
    "existing key's priority unchanged on NaN",
  );
});

Deno.test("IndexedHeap has correct Symbol.toStringTag", () => {
  const heap = new IndexedHeap<string>();
  assertEquals(heap[Symbol.toStringTag], "IndexedHeap");
  assertEquals(Object.prototype.toString.call(heap), "[object IndexedHeap]");
});

Deno.test("IndexedHeap constructor with no arguments creates an empty heap", () => {
  const heap = new IndexedHeap<string>();
  assertEquals(heap.size, 0);
  assertEquals(heap.isEmpty(), true);
  assertEquals(heap.peek(), undefined);
});

Deno.test("IndexedHeap constructor accepts undefined and null", () => {
  const fromUndefined = new IndexedHeap<string>(undefined);
  assertEquals(fromUndefined.size, 0);

  const fromNull = new IndexedHeap<string>(null);
  assertEquals(fromNull.size, 0);
});

Deno.test("IndexedHeap constructor populates from an array of pairs", () => {
  const heap = new IndexedHeap<string>([["c", 3], ["a", 1], ["b", 2]]);
  assertEquals(heap.size, 3);
  assertEquals(heap.peek(), { key: "a", priority: 1 });
  assertEquals([...heap.drain()], [
    { key: "a", priority: 1 },
    { key: "b", priority: 2 },
    { key: "c", priority: 3 },
  ]);
});

Deno.test("IndexedHeap constructor populates from a generator", () => {
  function* pairs(): Iterable<[string, number]> {
    yield ["a", 5];
    yield ["b", 2];
    yield ["c", 8];
  }
  const heap = new IndexedHeap<string>(pairs());
  assertEquals(heap.size, 3);
  assertEquals(heap.peek(), { key: "b", priority: 2 });
});

Deno.test("IndexedHeap constructor populates from a Map", () => {
  const map = new Map([["task-a", 3], ["task-b", 1], ["task-c", 2]]);
  const heap = new IndexedHeap(map);
  assertEquals(heap.size, 3);
  assertEquals(heap.peek(), { key: "task-b", priority: 1 });
});

Deno.test("IndexedHeap constructor accepts an empty iterable", () => {
  const heap = new IndexedHeap<string>([]);
  assertEquals(heap.size, 0);
  assertEquals(heap.isEmpty(), true);
});

Deno.test("IndexedHeap constructor throws on duplicate keys", () => {
  assertThrows(
    () => new IndexedHeap<string>([["a", 1], ["a", 2]]),
    TypeError,
    "Cannot push into IndexedHeap: key already exists",
  );
});

Deno.test("IndexedHeap constructor throws on NaN priority", () => {
  assertThrows(
    () => new IndexedHeap<string>([["a", NaN]]),
    RangeError,
    "Cannot set priority: value is NaN",
  );
});

Deno.test("IndexedHeap constructor throws TypeError on non-iterable input", () => {
  const message =
    "Cannot construct an IndexedHeap: the 'entries' parameter is not iterable, did you mean to call IndexedHeap.from?";
  // deno-lint-ignore no-explicit-any
  assertThrows(() => new IndexedHeap(42 as any), TypeError, message);
  // deno-lint-ignore no-explicit-any
  assertThrows(() => new IndexedHeap(true as any), TypeError, message);
  // deno-lint-ignore no-explicit-any
  assertThrows(() => new IndexedHeap({} as any), TypeError, message);
});

Deno.test("IndexedHeap constructor redirects ArrayLike inputs to from()", () => {
  // Plain ArrayLike (no Symbol.iterator) is rejected by the constructor with
  // a redirect to `from()`. This catches the foot-gun where a user passes
  // an array-like (e.g., NodeList, custom { length, [i]: ... } object).
  const arrayLike: ArrayLike<readonly [string, number]> = {
    length: 2,
    0: ["a", 1],
    1: ["b", 2],
  };
  assertThrows(
    // deno-lint-ignore no-explicit-any
    () => new IndexedHeap(arrayLike as any),
    TypeError,
    "did you mean to call IndexedHeap.from?",
  );

  const heap = IndexedHeap.from(arrayLike);
  assertEquals(heap.size, 2);
  assertEquals(heap.peek(), { key: "a", priority: 1 });
});

Deno.test("IndexedHeap.from() creates heap from array of pairs", () => {
  const heap = IndexedHeap.from<string>([["c", 3], ["a", 1], ["b", 2]]);
  assertEquals(heap.size, 3);
  assertEquals(heap.peek(), { key: "a", priority: 1 });
  assertEquals([...heap.drain()], [
    { key: "a", priority: 1 },
    { key: "b", priority: 2 },
    { key: "c", priority: 3 },
  ]);
});

Deno.test("IndexedHeap.from() creates heap from another IndexedHeap", () => {
  const original = new IndexedHeap<string>();
  original.push("x", 10);
  original.push("y", 5);
  original.push("z", 1);

  const copy = IndexedHeap.from(original);
  assertEquals(copy.size, 3);
  assertEquals(copy.peek(), { key: "z", priority: 1 });

  assertEquals(original.size, 3, "original unchanged");

  copy.set("z", 100);
  assertEquals(original.getPriority("z"), 1, "original not affected by copy");
});

Deno.test("IndexedHeap.from() creates heap from Map entries", () => {
  const map = new Map([["task-a", 3], ["task-b", 1], ["task-c", 2]]);
  const heap = IndexedHeap.from(map);
  assertEquals(heap.size, 3);
  assertEquals(heap.peek(), { key: "task-b", priority: 1 });
});

Deno.test("IndexedHeap.from() creates heap from generator", () => {
  function* pairs(): Iterable<[string, number]> {
    yield ["a", 5];
    yield ["b", 2];
    yield ["c", 8];
  }
  const heap = IndexedHeap.from(pairs());
  assertEquals(heap.size, 3);
  assertEquals(heap.peek(), { key: "b", priority: 2 });
});

Deno.test("IndexedHeap.from() creates empty heap from empty iterable", () => {
  const heap = IndexedHeap.from<string>([]);
  assertEquals(heap.size, 0);
  assertEquals(heap.isEmpty(), true);
});

Deno.test("IndexedHeap.from() throws on duplicate keys", () => {
  assertThrows(
    () => IndexedHeap.from<string>([["a", 1], ["a", 2]]),
    TypeError,
    "Cannot push into IndexedHeap: key already exists",
  );
});

Deno.test("IndexedHeap.from() creates heap from an ArrayLike", () => {
  const arrayLike: ArrayLike<readonly [string, number]> = {
    length: 3,
    0: ["c", 3],
    1: ["a", 1],
    2: ["b", 2],
  };
  const heap = IndexedHeap.from(arrayLike);
  assertEquals(heap.size, 3);
  assertEquals([...heap.drain()], [
    { key: "a", priority: 1 },
    { key: "b", priority: 2 },
    { key: "c", priority: 3 },
  ]);
});

Deno.test("IndexedHeap.from() throws TypeError on non-iterable, non-array-like input", () => {
  const message =
    "Cannot create an IndexedHeap: the 'collection' parameter is not iterable or array-like";
  // deno-lint-ignore no-explicit-any
  assertThrows(() => IndexedHeap.from(null as any), TypeError, message);
  // deno-lint-ignore no-explicit-any
  assertThrows(() => IndexedHeap.from(undefined as any), TypeError, message);
  // deno-lint-ignore no-explicit-any
  assertThrows(() => IndexedHeap.from(42 as any), TypeError, message);
  // deno-lint-ignore no-explicit-any
  assertThrows(() => IndexedHeap.from(true as any), TypeError, message);
  // deno-lint-ignore no-explicit-any
  assertThrows(() => IndexedHeap.from({} as any), TypeError, message);
});

Deno.test("IndexedHeap.from() accepts strings (iterable of characters)", () => {
  // A string is iterable, so it passes the `from()` guard. Each destructured
  // character yields `key = char`, `priority = undefined`, resulting in a
  // heap with two undefined-priority entries. Not useful in practice, but
  // documents that strings bypass the type guard.
  // deno-lint-ignore no-explicit-any
  const heap = IndexedHeap.from("ab" as any);
  assertEquals(heap.size, 2);
});

Deno.test("IndexedHeap toArray() returns all entries without modifying heap", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 3);
  heap.push("b", 1);
  heap.push("c", 2);

  const arr = heap.toArray();
  assertEquals(arr.length, 3);
  assertEquals(heap.size, 3, "heap not modified");

  const keys = arr.map((e) => e.key).sort();
  assertEquals(keys, ["a", "b", "c"]);

  const priorities = arr.map((e) => e.priority).sort();
  assertEquals(priorities, [1, 2, 3]);
});

Deno.test("IndexedHeap toArray() returns empty array for empty heap", () => {
  const heap = new IndexedHeap<string>();
  assertEquals(heap.toArray(), []);
});

Deno.test("IndexedHeap toArray() returns defensive copies", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 10);

  const arr = heap.toArray();
  (arr[0] as { priority: number }).priority = 999;

  assertEquals(heap.getPriority("a"), 10, "heap not affected by mutation");
});

Deno.test("IndexedHeap iterator returns defensive copies", () => {
  const heap = new IndexedHeap<string>();
  heap.push("a", 10);

  for (const entry of heap) {
    (entry as { priority: number }).priority = 999;
  }

  assertEquals(heap.getPriority("a"), 10, "heap not affected by mutation");
});

Deno.test("IndexedHeap iterator works with for-of", () => {
  const heap = new IndexedHeap<string>();
  heap.push("x", 5);
  heap.push("y", 3);

  const collected: HeapEntry<string>[] = [];
  for (const entry of heap) {
    collected.push(entry);
  }
  assertEquals(collected.length, 2);
  assertEquals(heap.size, 2, "heap not modified by for-of");
});

Deno.test("IndexedHeap with descend acts as max-heap", () => {
  const heap = new IndexedHeap<string>(null, { compare: descend });
  heap.push("a", 1);
  heap.push("b", 5);
  heap.push("c", 3);

  assertEquals(heap.peek(), { key: "b", priority: 5 });
  assertEquals(heap.pop(), { key: "b", priority: 5 });
  assertEquals([...heap.drain()].map((e) => e.priority), [3, 1]);
});

Deno.test("IndexedHeap constructor accepts compare option with initial entries", () => {
  const heap = new IndexedHeap<string>([["a", 1], ["b", 5], ["c", 3]], {
    compare: descend,
  });
  assertEquals(heap.peek(), { key: "b", priority: 5 });
  assertEquals([...heap.drain()].map((e) => e.priority), [5, 3, 1]);
});

Deno.test("IndexedHeap with tuple priority supports stable tie-breaking", () => {
  // Order primarily by score (smallest first), then by insertion counter
  // for ties. This is the canonical pattern for FIFO-within-priority.
  const heap = new IndexedHeap<string, [number, number]>(null, {
    compare: (a, b) => a[0] - b[0] || a[1] - b[1],
  });
  heap.push("first", [5, 0]);
  heap.push("second", [5, 1]);
  heap.push("third", [5, 2]);
  heap.push("urgent", [3, 99]);

  assertEquals([...heap.drain()].map((e) => e.key), [
    "urgent",
    "first",
    "second",
    "third",
  ]);
});

Deno.test("IndexedHeap with bigint priority handles values beyond MAX_SAFE_INTEGER", () => {
  const heap = new IndexedHeap<string, bigint>(null, {
    compare: (a, b) => a < b ? -1 : a > b ? 1 : 0,
  });
  // 9_007_199_254_740_993n exceeds Number.MAX_SAFE_INTEGER (2^53 - 1).
  // A number-based heap would lose precision; bigint preserves it.
  heap.push("small", 1n);
  heap.push("huge", 9_007_199_254_740_993n);
  heap.push("medium", 100n);

  assertEquals(heap.peek(), { key: "small", priority: 1n });
  assertEquals([...heap.drain()].map((e) => e.priority), [
    1n,
    100n,
    9_007_199_254_740_993n,
  ]);
});

Deno.test("IndexedHeap set and delete work under custom comparator", () => {
  const heap = new IndexedHeap<string>(null, { compare: descend });
  heap.push("a", 10);
  heap.push("b", 20);
  heap.push("c", 30);

  // Increase "a" to 100; under max-heap order, it bubbles up to the top.
  heap.set("a", 100);
  assertEquals(heap.peek(), { key: "a", priority: 100 });

  // Decrease "c" to 1; under max-heap order, it bubbles down.
  heap.set("c", 1);
  assertEquals([...heap.drain()].map((e) => e.priority), [100, 20, 1]);
});

Deno.test("IndexedHeap delete with replacement triggers correct sift under custom comparator", () => {
  // Max-heap shape after inserts (priorities, with "d" at index 4 etc.):
  //         d(52)
  //        /    \
  //     c(51)   f(5)
  //    /   \    /  \
  // r(1)  a(50) b(3) e(4)
  //
  // Deleting "c" (index 1) moves last "e" (priority 4) into index 1.
  // Parent of index 1 is "d" (priority 52). Under max-heap (descend),
  // 4 is less than 52, so "e" sifts DOWN. The new top remains "d".
  const heap = new IndexedHeap<string>([
    ["r", 1],
    ["a", 50],
    ["b", 3],
    ["c", 51],
    ["d", 52],
    ["e", 4],
    ["f", 5],
  ], { compare: descend });

  assertEquals(heap.peek(), { key: "d", priority: 52 });
  heap.delete("c");
  assertEquals(heap.peek(), { key: "d", priority: 52 });
  assertEquals(heap.size, 6);

  assertEquals([...heap.drain()].map((e) => e.priority), [52, 50, 5, 4, 3, 1]);
});

Deno.test("IndexedHeap.from() inherits comparator from source heap", () => {
  const minHeap = new IndexedHeap<string>([["a", 1], ["b", 5], ["c", 3]]);
  const minCopy = IndexedHeap.from(minHeap);
  assertEquals(minCopy.peek(), { key: "a", priority: 1 });

  const maxHeap = new IndexedHeap<string>([["a", 1], ["b", 5], ["c", 3]], {
    compare: descend,
  });
  const maxCopy = IndexedHeap.from(maxHeap);
  assertEquals(maxCopy.peek(), { key: "b", priority: 5 });
  assertEquals([...maxCopy.drain()].map((e) => e.priority), [5, 3, 1]);
});

Deno.test("IndexedHeap.from() with compare option overrides source comparator", () => {
  const minHeap = new IndexedHeap<string>([["a", 1], ["b", 5], ["c", 3]]);
  const maxFromMin = IndexedHeap.from(minHeap, { compare: descend });

  assertEquals(minHeap.peek(), { key: "a", priority: 1 }, "source unchanged");
  assertEquals(maxFromMin.peek(), { key: "b", priority: 5 });
  assertEquals([...maxFromMin.drain()].map((e) => e.priority), [5, 3, 1]);
});

Deno.test("IndexedHeap.from() iterable input accepts compare option", () => {
  const heap = IndexedHeap.from<string>(
    [["a", 1], ["b", 5], ["c", 3]],
    { compare: descend },
  );
  assertEquals(heap.peek(), { key: "b", priority: 5 });
  assertEquals([...heap.drain()].map((e) => e.priority), [5, 3, 1]);
});

Deno.test("IndexedHeap throws TypeError when compare option is not a function", () => {
  assertThrows(
    () =>
      new IndexedHeap<string>(null, {
        compare: 1 as unknown as (a: number, b: number) => number,
      }),
    TypeError,
    "the 'compare' option is not a function",
  );
  assertThrows(
    () =>
      new IndexedHeap<string>([["a", 1]], {
        compare: "asc" as unknown as (a: number, b: number) => number,
      }),
    TypeError,
    "the 'compare' option is not a function",
  );
  assertThrows(
    () =>
      IndexedHeap.from<string>([["a", 1]], {
        compare: {} as unknown as (a: number, b: number) => number,
      }),
    TypeError,
    "the 'compare' option is not a function",
  );
});

Deno.test("IndexedHeap peek wrapper is fresh; replacing priority is safe even with object priorities", () => {
  // Replacing the priority property on the returned wrapper is a no-op on
  // the heap because the wrapper is a fresh object. Mutating the priority
  // *contents* (e.g. `peeked.priority[0] = 0`) is undefined behavior — see
  // the class-level note on priority mutability.
  const heap = new IndexedHeap<string, [number, number]>(null, {
    compare: (a, b) => a[0] - b[0] || a[1] - b[1],
  });
  heap.push("a", [1, 0]);
  heap.push("b", [5, 0]);

  const peeked = heap.peek()!;
  (peeked as { priority: [number, number] }).priority = [999, 999];
  assertEquals(heap.peek()!.priority, [1, 0]);
});

/** Mulberry32: deterministic 32-bit PRNG for reproducible stress tests. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

Deno.test("IndexedHeap.from() stress test: heapify + index consistency", () => {
  const rand = mulberry32(99);
  const n = 300;
  const pairs: [number, number][] = [];
  const expected = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const priority = Math.floor(rand() * 10000);
    pairs.push([i, priority]);
    expected.set(i, priority);
  }

  const heap = IndexedHeap.from(pairs);
  assertEquals(heap.size, n);

  for (const [key, priority] of expected) {
    assertEquals(heap.has(key), true);
    assertEquals(heap.getPriority(key), priority);
  }

  heap.set(0, -1);
  assertEquals(heap.peek(), { key: 0, priority: -1 });
  heap.set(0, expected.get(0)!);

  heap.delete(n - 1);
  assertEquals(heap.has(n - 1), false);
  assertEquals(heap.size, n - 1);

  const popped: number[] = [];
  while (!heap.isEmpty()) {
    popped.push(heap.pop()!.priority);
  }
  for (let i = 1; i < popped.length; i++) {
    if (popped[i]! < popped[i - 1]!) {
      throw new Error(
        `Heap invariant violated after from(): ${popped[i - 1]} > ${
          popped[i]
        } at index ${i}`,
      );
    }
  }
  assertEquals(popped.length, n - 1);
});

Deno.test("IndexedHeap stress test: push N, pop all, verify sorted", () => {
  const rand = mulberry32(42);
  const heap = new IndexedHeap<number>();
  const n = 200;
  for (let i = 0; i < n; i++) {
    heap.push(i, Math.floor(rand() * 10000));
  }

  assertEquals(heap.size, n);

  const popped: number[] = [];
  while (!heap.isEmpty()) {
    popped.push(heap.pop()!.priority);
  }

  for (let i = 1; i < popped.length; i++) {
    if (popped[i]! < popped[i - 1]!) {
      throw new Error(
        `Heap invariant violated: ${popped[i - 1]} > ${
          popped[i]
        } at index ${i}`,
      );
    }
  }
  assertEquals(popped.length, n);
});

Deno.test("IndexedHeap stress test: push N, delete random subset, pop rest", () => {
  const rand = mulberry32(123);
  const heap = new IndexedHeap<number>();
  const n = 200;
  for (let i = 0; i < n; i++) {
    heap.push(i, Math.floor(rand() * 10000));
  }

  const toDelete = new Set<number>();
  for (let i = 0; i < n / 2; i++) {
    const key = Math.floor(rand() * n);
    if (!toDelete.has(key)) {
      toDelete.add(key);
      heap.delete(key);
    }
  }

  const remaining = n - toDelete.size;
  assertEquals(heap.size, remaining);

  const popped: number[] = [];
  while (!heap.isEmpty()) {
    popped.push(heap.pop()!.priority);
  }

  for (let i = 1; i < popped.length; i++) {
    if (popped[i]! < popped[i - 1]!) {
      throw new Error(
        `Heap invariant violated after deletes: ${popped[i - 1]} > ${
          popped[i]
        } at index ${i}`,
      );
    }
  }
  assertEquals(popped.length, remaining);
});
