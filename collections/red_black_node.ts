// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { RedBlackNode as RedBlackNode_ } from "./unstable/_red_black_node.ts";

/** @deprecated (will be removed after 0.206.0) Use "left" | "right" union type instead */
export type Direction = "left" | "right";
/** @deprecated (will be removed after 0.206.0) Do not use `RedBlackNode` directly, but use `RedBlackTree` from `collections/unstable/red_black_tree.ts` */
export class RedBlackNode<T> extends RedBlackNode_<T> {}
