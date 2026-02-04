// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "../assert/equals.ts";
import { BinarySearchTree } from "./unstable_binary_search_tree.ts";

Deno.test("BinarySearchTree.ceiling()", () => {
  const tree: BinarySearchTree<number> = BinarySearchTree.from(
    [4, 2, 1, 3, 6, 5, 7],
  );
  assertEquals(tree.ceiling(0.5), 1);
  assertEquals(tree.ceiling(1), 1);
  assertEquals(tree.ceiling(1.5), 2);
  assertEquals(tree.ceiling(3.5), 4);
  assertEquals(tree.ceiling(6.5), 7);
  assertEquals(tree.ceiling(7), 7);
  assertEquals(tree.ceiling(7.5), null);
});

Deno.test("BinarySearchTree.floor()", () => {
  const tree: BinarySearchTree<number> = BinarySearchTree.from(
    [4, 2, 1, 3, 6, 5, 7],
  );
  assertEquals(tree.floor(0.5), null);
  assertEquals(tree.floor(1), 1);
  assertEquals(tree.floor(1.5), 1);
  assertEquals(tree.floor(4.5), 4);
  assertEquals(tree.floor(6.5), 6);
  assertEquals(tree.floor(7), 7);
  assertEquals(tree.floor(7.5), 7);
});

Deno.test("BinarySearchTree.higher()", () => {
  const tree: BinarySearchTree<number> = BinarySearchTree.from(
    [4, 2, 1, 3, 6, 5, 7],
  );
  assertEquals(tree.higher(0.5), 1);
  assertEquals(tree.higher(1), 2);
  assertEquals(tree.higher(1.5), 2);
  assertEquals(tree.higher(3.5), 4);
  assertEquals(tree.higher(6.5), 7);
  assertEquals(tree.higher(7), null);
  assertEquals(tree.higher(7.5), null);
});

Deno.test("BinarySearchTree.lower()", () => {
  const tree: BinarySearchTree<number> = BinarySearchTree.from(
    [4, 2, 1, 3, 6, 5, 7],
  );
  assertEquals(tree.lower(0.5), null);
  assertEquals(tree.lower(1), null);
  assertEquals(tree.lower(1.5), 1);
  assertEquals(tree.lower(4.5), 4);
  assertEquals(tree.lower(6.5), 6);
  assertEquals(tree.lower(7), 6);
  assertEquals(tree.lower(7.5), 7);
});
