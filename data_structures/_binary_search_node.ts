// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export type Direction = "left" | "right";

export class BinarySearchNode<T> {
  left: BinarySearchNode<T> | null;
  right: BinarySearchNode<T> | null;
  parent: BinarySearchNode<T> | null;
  value: T;

  constructor(parent: BinarySearchNode<T> | null, value: T) {
    this.left = null;
    this.right = null;
    this.parent = parent;
    this.value = value;
  }

  static from<T>(node: BinarySearchNode<T>): BinarySearchNode<T> {
    // New deep copy
    // 1. Create a brand new node (with no parent at first)
    const clone = new BinarySearchNode<T>(null, node.value);

    // 2. Recursively clone the left subtree
    if (node.left) {
      clone.left = BinarySearchNode.from(node.left);
      clone.left.parent = clone;
    }

    // 3. Recursively clone the right subtree
    if (node.right) {
      clone.right = BinarySearchNode.from(node.right);
      clone.right.parent = clone;
    }

    // 4. We do NOT copy over 'parent' from the old node!  Instead, when the
    //    parent's 'from()' call links the child, it sets child.parent = parent.
    //    This ensures the copied tree has all new references.

    return clone;
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
