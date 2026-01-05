// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A generic Binary Search Tree (BST) node interface.
 * It is implemented by the internal node classes of the binary search tree and
 * red black tree.
 *
 * @example Getting a reference to a BinarySearchTreeNode<T>.
 * ```ts
 * import { BinarySearchTree<T> } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * const tree = new BinarySearchTree<number>();
 * 
 * assertEquals(tree.insert(42), true);
 * 
 * const root = tree.getRoot();
 * 
 * assertEquals(node.value, 42);
 * assertEquals(node.left, null);
 * assertEquals(node.right, null);
 * assertEquals(node.parent, null);
 * ```
 *
 * @typeparam T The type of the values stored in the binary tree.
 */
export interface BinarySearchTreeNode<T> {
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
  left: BinarySearchTreeNode<T> | null;

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
  right: BinarySearchTreeNode<T> | null;

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
  parent: BinarySearchTreeNode<T> | null;

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
}
