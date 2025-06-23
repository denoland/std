// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A generic Binary Search Tree (BST) node class.
 *
 * @example Creating a new BSTNode.
 * ```ts
 * import { BSTNode } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * const node = new BSTNode<number>(null, 42);
 * assertEquals(node.value, 42);
 * assertEquals(node.left, null);
 * assertEquals(node.right, null);
 * assertEquals(node.parent, null);
 * ```
 *
 * @typeparam T The type of the values stored in the binary tree.
 */
export class BSTNode<T> {
  /**
   * The left child node, or null if there is no left child.
   *
   * @example Checking the left child of a node in a binary search tree.
   * ```ts
   * import { BinarySearchTree } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const tree = new BinarySearchTree<number>();
   *
   * assertEquals(tree.insert(42), true);
   * assertEquals(tree.insert(21), true);
   *
   * const root = tree.getRoot();
   * const leftChild = root?.left;
   *
   * assertEquals(leftChild?.value, 21);
   * ```
   */
  left: BSTNode<T> | null;

  /**
   * The right child node, or null if there is no right child.
   *
   * @example Checking the right child of a node in a binary search tree.
   * ```ts
   * import { BinarySearchTree } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const tree = new BinarySearchTree<number>();
   *
   * assertEquals(tree.insert(21), true);
   * assertEquals(tree.insert(42), true);
   *
   * const root = tree.getRoot();
   * const leftChild = root?.left;
   *
   * assertEquals(leftChild?.value, 42);
   * ```
   */
  right: BSTNode<T> | null;

  /**
   * The parent of this node, or null if there is no parent.
   *
   * @example Checking the parent of a node in a binary search tree.
   * ```ts
   * import { BinarySearchTree } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const tree = new BinarySearchTree<number>();
   *
   * assertEquals(tree.insert(42), true);
   * assertEquals(tree.insert(21), true);
   *
   * const root = tree.getRoot();
   * const leftChild = root?.left;
   *
   * assertEquals(leftChild?.parent?.value, 42);
   * ```
   */
  parent: BSTNode<T> | null;

  /**
   * The value stored at this node.
   *
   * @example Accessing the value of a node in a binary search tree.
   * ```ts
   * import { BinarySearchTree } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const tree = new BinarySearchTree<number>();
   * assertEquals(tree.insert(42), true);
   *
   * const root = tree.getRoot();
   * assertEquals(root?.value, 42);
   * ```
   */
  value: T;

  /**
   * Creates a new BSTNode.
   * @param parent The parent node, or null if this is the root node.
   * @param value The value of the node.
   */
  constructor(parent: BSTNode<T> | null, value: T) {
    this.left = null;
    this.right = null;
    this.parent = parent;
    this.value = value;
  }
}
