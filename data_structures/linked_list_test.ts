// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { LinkedList } from "./linked_list.ts";

Deno.test("LinkedList.from() creates a linked list from an iterable object", () => {
  const list = LinkedList.from([2, 3, 4, 5]);
  assertEquals(list.length, 4);
  assertEquals([...list], [2, 3, 4, 5]);
});

Deno.test("LinkedList.push() adds the value to the back of the list", () => {
  const list = new LinkedList<string>();
  list.push("hello");
  list.push("world");

  assertEquals(list.length, 2);
  assertEquals([...list], ["hello", "world"]);
});

Deno.test("LinkedList.pop() removes the last node and returns its value", () => {
  const list = LinkedList.from([10, 100, 1000]);

  assertEquals(list.pop(), 1000);
  assertEquals(list.pop(), 100);
  assertEquals(list.pop(), 10);
  assertEquals(list.length, 0);
  assertEquals(list.pop(), undefined);
});

Deno.test("LinkedList.unshift() adds the value to the front of the list", () => {
  const list = new LinkedList<string>();
  list.unshift("hello");
  list.unshift("world");

  assertEquals(list.length, 2);
  assertEquals([...list], ["world", "hello"]);
});

Deno.test("LinkedList.shift() removes the first node and returns its value", () => {
  const list = LinkedList.from([10, 100, 1000]);

  assertEquals(list.shift(), 10);
  assertEquals(list.shift(), 100);
  assertEquals(list.shift(), 1000);
  assertEquals(list.length, 0);
  assertEquals(list.shift(), undefined);
});

Deno.test("LinkedList.insert() adds the value to the given index", () => {
  const list = LinkedList.from(["c", "f"]);

  list.insert("a", 0);
  list.insert("b", 1);
  list.insert("e", 3);
  list.insert("g", list.length);
  list.insert("d", 1);

  assertEquals(list.length, 7);
  assertEquals([...list], ["a", "d", "b", "c", "e", "f", "g"]);
});

Deno.test("LinkedList.insert() throws if the given index is out of range", () => {
  const list = new LinkedList<number>();

  assertThrows(
    () => list.insert(10, -3),
    RangeError,
    "Cannot insert the value: The index is out of range",
  );

  assertThrows(
    () => list.insert(11, list.length + 1),
    RangeError,
    "Cannot insert the value: The index is out of range",
  );
});

Deno.test("LinkedList.remove() removes the node at the given index and returns its value", () => {
  const list = LinkedList.from(["a", "b", "c", "d", "e", "f", "g", "h"]);
  assertEquals(list.length, 8);

  assertEquals(list.remove(0), "a");
  assertEquals([...list], ["b", "c", "d", "e", "f", "g", "h"]);
  assertEquals(list.length, 7);

  assertEquals(list.remove(list.length - 1), "h");
  assertEquals([...list], ["b", "c", "d", "e", "f", "g"]);
  assertEquals(list.length, 6);

  assertEquals(list.remove(1), "c");
  assertEquals([...list], ["b", "d", "e", "f", "g"]);
  assertEquals(list.length, 5);

  assertEquals(list.remove(3), "f");
  assertEquals([...list], ["b", "d", "e", "g"]);
  assertEquals(list.length, 4);

  assertEquals(list.remove(-2), undefined);
  assertEquals(list.remove(list.length), undefined);

  const empty = new LinkedList();
  assertEquals(empty.remove(0), undefined);
});

Deno.test("LinkedList.has() checks if the list contains the given value", () => {
  const list = new LinkedList<string>();
  assertEquals(list.has("x"), false);

  list.push("x");
  list.push("y");
  list.push("z");
  list.push("s");
  list.push("t");
  list.push("u");

  assertEquals([...list], ["x", "y", "z", "s", "t", "u"]);

  assertEquals(list.has("x"), true);
  assertEquals(list.has("z"), true);
  assertEquals(list.has("u"), true);

  assertEquals(list.has("a"), false);
  assertEquals(list.has("b"), false);
});

Deno.test("LinkedList.clear() removes all linked list's nodes", () => {
  const list = LinkedList.from(["hello", "world"]);
  assertEquals(list.length, 2);

  list.clear();

  assertEquals(list.length, 0);
  assertEquals(list.pop(), undefined);
  assertEquals(list.shift(), undefined);
});
