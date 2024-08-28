// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { DoublyLinkedList } from "./doubly_linked_list.ts";

Deno.test("DoublyLinkedList.from() creates a linked list from an iterable object", () => {
  const list = DoublyLinkedList.from([2, 3, 4, 5]);
  assertEquals(list.length, 4);
  assertEquals([...list], [2, 3, 4, 5]);
});

Deno.test("DoublyLinkedList.push() adds the value to the back of the list", () => {
  const list = new DoublyLinkedList<string>();
  list.push("hello", "world");

  assertEquals(list.length, 2);
  assertEquals([...list], ["hello", "world"]);
});

Deno.test("DoublyLinkedList.pop() removes the last node and returns its value", () => {
  const list = DoublyLinkedList.from([10, 100, 1000]);

  assertEquals(list.pop(), 1000);
  assertEquals(list.pop(), 100);
  assertEquals(list.pop(), 10);
  assertEquals(list.length, 0);
  assertEquals(list.pop(), undefined);
});

Deno.test("DoublyLinkedList.unshift() adds the value to the front of the list", () => {
  const list = new DoublyLinkedList<string>();
  list.unshift("hello", "world");

  assertEquals(list.length, 2);
  assertEquals([...list], ["world", "hello"]);
});

Deno.test("DoublyLinkedList.shift() removes the first node and returns its value", () => {
  const list = DoublyLinkedList.from([10, 100, 1000]);

  assertEquals(list.shift(), 10);
  assertEquals(list.shift(), 100);
  assertEquals(list.shift(), 1000);
  assertEquals(list.length, 0);
  assertEquals(list.shift(), undefined);
});

Deno.test("DoublyLinkedList.insert() adds the value to the given index", () => {
  const list = DoublyLinkedList.from(["c", "f"]);

  list.insert("a", 0);
  list.insert("b", 1);
  list.insert("e", 3);
  list.insert("g", list.length);
  list.insert("d", 1);

  assertEquals(list.length, 7);
  assertEquals([...list], ["a", "d", "b", "c", "e", "f", "g"]);
});

Deno.test("DoublyLinkedList.insert() throws if the given index is out of range", () => {
  const list = new DoublyLinkedList<number>();

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

Deno.test("DoublyLinkedList.remove() removes the node at the given index and returns its value", () => {
  const list = DoublyLinkedList.from(["a", "b", "c", "d", "e", "f", "g", "h"]);
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

  const empty = new DoublyLinkedList();
  assertEquals(empty.remove(0), undefined);
});

Deno.test("DoublyLinkedList.includes() checks if the list contains the given value", () => {
  const list = new DoublyLinkedList<string>();
  assertEquals(list.includes("x"), false);

  list.push("x", "y", "z");
  list.push("s", "t", "u");

  assertEquals([...list], ["x", "y", "z", "s", "t", "u"]);

  assertEquals(list.includes("x"), true);
  assertEquals(list.includes("z"), true);
  assertEquals(list.includes("u"), true);

  assertEquals(list.includes("a"), false);
  assertEquals(list.includes("b"), false);
});

Deno.test("DoublyLinkedList.clear() removes all linked list's nodes", () => {
  const list = DoublyLinkedList.from(["hello", "world"]);
  assertEquals(list.length, 2);

  list.clear();

  assertEquals(list.length, 0);
  assertEquals(list.pop(), undefined);
  assertEquals(list.shift(), undefined);
});
