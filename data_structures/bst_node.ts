// Copyright 2025 the Deno authors. MIT license.
// This module is browser compatible.

export class BSTNode<T> {
  left: BSTNode<T> | null;
  right: BSTNode<T> | null;
  parent: BSTNode<T> | null;
  value: T;

  constructor(parent: BSTNode<T> | null, value: T) {
    this.left = null;
    this.right = null;
    this.parent = parent;
    this.value = value;
  }
}
