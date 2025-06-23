// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { BSTNode } from "./bst_node.ts";

export type Direction = "left" | "right";

export class BinarySearchNode<T> extends BSTNode<T> {
  declare left: BinarySearchNode<T> | null;
  declare right: BinarySearchNode<T> | null;
  declare parent: BinarySearchNode<T> | null;
  declare value: T;

  constructor(parent: BinarySearchNode<T> | null, value: T) {
    super(parent, value);
  }

  static from<T>(node: BinarySearchNode<T>): BinarySearchNode<T> {
    const copy: BinarySearchNode<T> = new BinarySearchNode(
      node.parent,
      node.value,
    );
    copy.left = node.left;
    copy.right = node.right;
    return copy;
  }

  directionFromParent(): Direction | null {
    return this.parent === null
      ? null
      : this === this.parent.left
      ? "left"
      : this === this.parent.right
      ? "right"
      : null;
  }

  findMinNode(): BinarySearchNode<T> {
    let minNode: BinarySearchNode<T> | null = this.left;
    while (minNode?.left) minNode = minNode.left;
    return minNode ?? this;
  }

  findMaxNode(): BinarySearchNode<T> {
    let maxNode: BinarySearchNode<T> | null = this.right;
    while (maxNode?.right) maxNode = maxNode.right;
    return maxNode ?? this;
  }

  findSuccessorNode(): BinarySearchNode<T> | null {
    if (this.right !== null) return this.right.findMinNode();
    let parent: BinarySearchNode<T> | null = this.parent;
    let direction: Direction | null = this.directionFromParent();
    while (parent && direction === "right") {
      direction = parent.directionFromParent();
      parent = parent.parent;
    }
    return parent;
  }
}
