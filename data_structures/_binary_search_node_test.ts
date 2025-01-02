// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { BinarySearchNode } from "./_binary_search_node.ts";

let parent: BinarySearchNode<number>;
let child: BinarySearchNode<number>;
function beforeEach() {
  parent = new BinarySearchNode(null, 5);
  child = new BinarySearchNode(parent, 7);
  parent.right = child;
}

Deno.test("BinarySearchNode", () => {
  beforeEach();
  assertStrictEquals(parent.parent, null);
  assertStrictEquals(parent.left, null);
  assertStrictEquals(parent.right, child);
  assertStrictEquals(parent.value, 5);

  assertStrictEquals(child.parent, parent);
  assertStrictEquals(child.left, null);
  assertStrictEquals(child.right, null);
  assertStrictEquals(child.value, 7);
});

Deno.test("BinarySearchNode.from() - deep copy", () => {
  // Construct a small test tree:
  //         (root:5)
  //        /        \
  // (left:3)        (right:7)
  //       \
  //       (4)
  //
  const root = new BinarySearchNode<number>(null, 5);
  const leftChild = new BinarySearchNode<number>(root, 3);
  const rightChild = new BinarySearchNode<number>(root, 7);
  root.left = leftChild;
  root.right = rightChild;

  // Add a right child to the left child
  const leftRightChild = new BinarySearchNode<number>(leftChild, 4);
  leftChild.right = leftRightChild;

  // Invoke the new from() logic to perform a deep copy
  const rootClone = BinarySearchNode.from(root);

  // 1. rootClone is a different reference from root but has the same value
  assert(rootClone !== root);
  assertStrictEquals(rootClone.value, 5);
  // The root node's parent must be null
  assertStrictEquals(rootClone.parent, null);

  // 2. Verify the cloned leftChild
  assert(rootClone.left !== null);
  assert(rootClone.left !== leftChild);
  assertStrictEquals(rootClone.left!.value, 3);
  // Verify the cloned leftChild's parent points to the new rootClone
  assertStrictEquals(rootClone.left!.parent, rootClone);

  // 3. Verify the cloned rightChild
  assert(rootClone.right !== null);
  assert(rootClone.right !== rightChild);
  assertStrictEquals(rootClone.right!.value, 7);
  assertStrictEquals(rootClone.right!.parent, rootClone);

  // 4. Verify the cloned leftRightChild
  const clonedLeftRightChild = rootClone.left!.right;
  assert(clonedLeftRightChild !== null);
  // It should not be the same as the original leftRightChild
  assert(clonedLeftRightChild !== leftRightChild);
  // But the value should be 4
  assertStrictEquals(clonedLeftRightChild!.value, 4);
  // And its parent should point to the cloned leftChild
  assertStrictEquals(clonedLeftRightChild!.parent, rootClone.left);
});

Deno.test("BinarySearchNode.directionFromParent()", () => {
  beforeEach();
  const child2 = new BinarySearchNode(parent, 3);
  assertEquals(child2.directionFromParent(), null);
  parent.left = child2;
  assertEquals(child2.directionFromParent(), "left");
  assertEquals(parent.directionFromParent(), null);
  assertEquals(child.directionFromParent(), "right");
});

Deno.test("BinarySearchNode.findMinNode()", () => {
  beforeEach();
  assertStrictEquals(parent.findMinNode(), parent);
  const child2 = new BinarySearchNode(parent, 3);
  parent.left = child2;
  assertStrictEquals(parent.findMinNode(), child2);
  const child3 = new BinarySearchNode(child2, 4);
  child2.right = child3;
  assertStrictEquals(parent.findMinNode(), child2);
  const child4 = new BinarySearchNode(child2, 2);
  child2.left = child4;
  assertStrictEquals(parent.findMinNode(), child4);
});

Deno.test("BinarySearchNode.findMaxNode()", () => {
  beforeEach();
  assertStrictEquals(parent.findMaxNode(), child);
  const child2 = new BinarySearchNode(child, 6);
  child.left = child2;
  assertStrictEquals(parent.findMaxNode(), child);
  const child3 = new BinarySearchNode(child2, 6.5);
  child2.right = child3;
  assertStrictEquals(parent.findMaxNode(), child);
  const child4 = new BinarySearchNode(child2, 8);
  child.right = child4;
  assertStrictEquals(parent.findMaxNode(), child4);
  parent.right = null;
  assertStrictEquals(parent.findMaxNode(), parent);
});

Deno.test("BinarySearchNode.findSuccessorNode()", () => {
  beforeEach();
  assertStrictEquals(parent.findSuccessorNode(), child);
  assertStrictEquals(child.findSuccessorNode(), null);
  const child2 = new BinarySearchNode(child, 6);
  child.left = child2;
  assertStrictEquals(parent.findSuccessorNode(), child2);
  assertStrictEquals(child.findSuccessorNode(), null);
});
