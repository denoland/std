// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { assertStrictEquals } from "@std/assert";
import { BSTNode } from "./bst_node.ts";

let parent: BSTNode<number>;
let child: BSTNode<number>;
function beforeEach() {
  parent = new BSTNode(null, 5);
  child = new BSTNode(parent, 7);
  parent.right = child;
}

Deno.test("BSTNode", () => {
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
