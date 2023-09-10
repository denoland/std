// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  BinarySearchNode as BinarySearchNode_,
} from "./unstable/_binary_search_node.ts";

/** @deprecated (will be removed after 0.206.0) Do not use `BinarySearchNode` directly, but use `BinarySearchTree` from `collections/unstable/binary_search_tree.ts` */
export class BinarySearchNode<T> extends BinarySearchNode_<T> {}
/** @deprecated (will be removed after 0.206.0) Use "left" | "right" union class instead */
export type Direction = "left" | "right";
