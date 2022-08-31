// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/** This module is browser compatible. */

import { ascend } from "./_comparators.ts";
import { BinarySearchNode, Direction } from "./binary_search_node.ts";
export * from "./_comparators.ts";

/**
 * An unbalanced binary search tree. The values are in ascending order by default,
 * using JavaScript's built in comparison operators to sort the values.
 */
export class BinarySearchTree<T> implements Iterable<T> {
  protected root: BinarySearchNode<T> | null = null;
  protected _size = 0;
  constructor(
    protected compare: (a: T, b: T) => number = ascend,
  ) {}

  /** Creates a new binary search tree from an array like or iterable object. */
  static from<T>(
    collection: ArrayLike<T> | Iterable<T> | BinarySearchTree<T>,
  ): BinarySearchTree<T>;
  static from<T>(
    collection: ArrayLike<T> | Iterable<T> | BinarySearchTree<T>,
    options: {
      compare?: (a: T, b: T) => number;
    },
  ): BinarySearchTree<T>;
  static from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | BinarySearchTree<T>,
    options: {
      compare?: (a: U, b: U) => number;
      map: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): BinarySearchTree<U>;
  static from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | BinarySearchTree<T>,
    options?: {
      compare?: (a: U, b: U) => number;
      map?: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): BinarySearchTree<U> {
    let result: BinarySearchTree<U>;
    let unmappedValues: ArrayLike<T> | Iterable<T> = [];
    if (collection instanceof BinarySearchTree) {
      result = new BinarySearchTree(
        options?.compare ??
          (collection as unknown as BinarySearchTree<U>).compare,
      );
      if (options?.compare || options?.map) {
        unmappedValues = collection;
      } else {
        const nodes: BinarySearchNode<U>[] = [];
        if (collection.root) {
          result.root = BinarySearchNode.from(
            collection.root as unknown as BinarySearchNode<U>,
          );
          nodes.push(result.root);
        }
        while (nodes.length) {
          const node: BinarySearchNode<U> = nodes.pop()!;
          const left: BinarySearchNode<U> | null = node.left
            ? BinarySearchNode.from(node.left)
            : null;
          const right: BinarySearchNode<U> | null = node.right
            ? BinarySearchNode.from(node.right)
            : null;

          if (left) {
            left.parent = node;
            nodes.push(left);
          }
          if (right) {
            right.parent = node;
            nodes.push(right);
          }
        }
      }
    } else {
      result = (options?.compare
        ? new BinarySearchTree(options.compare)
        : new BinarySearchTree()) as BinarySearchTree<U>;
      unmappedValues = collection;
    }
    const values: Iterable<U> = options?.map
      ? Array.from(unmappedValues, options.map, options.thisArg)
      : unmappedValues as U[];
    for (const value of values) result.insert(value);
    return result;
  }

  /** The amount of values stored in the binary search tree. */
  get size(): number {
    return this._size;
  }

  protected findNode(value: T): BinarySearchNode<T> | null {
    let node: BinarySearchNode<T> | null = this.root;
    while (node) {
      const order: number = this.compare(value as T, node.value);
      if (order === 0) break;
      const direction: "left" | "right" = order < 0 ? "left" : "right";
      node = node[direction];
    }
    return node;
  }

  protected rotateNode(node: BinarySearchNode<T>, direction: Direction) {
    const replacementDirection: Direction = direction === "left"
      ? "right"
      : "left";
    if (!node[replacementDirection]) {
      throw new TypeError(
        `cannot rotate ${direction} without ${replacementDirection} child`,
      );
    }
    const replacement: BinarySearchNode<T> = node[replacementDirection]!;
    node[replacementDirection] = replacement[direction] ?? null;
    if (replacement[direction]) replacement[direction]!.parent = node;
    replacement.parent = node.parent;
    if (node.parent) {
      const parentDirection: Direction = node === node.parent[direction]
        ? direction
        : replacementDirection;
      node.parent[parentDirection] = replacement;
    } else {
      this.root = replacement;
    }
    replacement[direction] = node;
    node.parent = replacement;
  }

  protected insertNode(
    Node: typeof BinarySearchNode,
    value: T,
  ): BinarySearchNode<T> | null {
    if (!this.root) {
      this.root = new Node(null, value);
      this._size++;
      return this.root;
    } else {
      let node: BinarySearchNode<T> = this.root;
      while (true) {
        const order: number = this.compare(value, node.value);
        if (order === 0) break;
        const direction: Direction = order < 0 ? "left" : "right";
        if (node[direction]) {
          node = node[direction]!;
        } else {
          node[direction] = new Node(node, value);
          this._size++;
          return node[direction];
        }
      }
    }
    return null;
  }

  protected removeNode(
    value: T,
  ): BinarySearchNode<T> | null {
    let removeNode: BinarySearchNode<T> | null = this.findNode(value);
    if (removeNode) {
      const successorNode: BinarySearchNode<T> | null =
        !removeNode.left || !removeNode.right
          ? removeNode
          : removeNode.findSuccessorNode()!;
      const replacementNode: BinarySearchNode<T> | null = successorNode.left ??
        successorNode.right;
      if (replacementNode) replacementNode.parent = successorNode.parent;

      if (!successorNode.parent) {
        this.root = replacementNode;
      } else {
        successorNode.parent[successorNode.directionFromParent()!] =
          replacementNode;
      }

      if (successorNode !== removeNode) {
        removeNode.value = successorNode.value;
        removeNode = successorNode;
      }
      this._size--;
    }
    return removeNode;
  }

  /**
   * Adds the value to the binary search tree if it does not already exist in it.
   * Returns true if successful.
   */
  insert(value: T): boolean {
    return !!this.insertNode(BinarySearchNode, value);
  }

  /**
   * Removes node value from the binary search tree if found.
   * Returns true if found and removed.
   */
  remove(value: T): boolean {
    return !!this.removeNode(value);
  }

  /** Returns node value if found in the binary search tree. */
  find(value: T): T | null {
    return this.findNode(value)?.value ?? null;
  }

  /** Returns the minimum value in the binary search tree or null if empty. */
  min(): T | null {
    return this.root ? this.root.findMinNode().value : null;
  }

  /** Returns the maximum value in the binary search tree or null if empty. */
  max(): T | null {
    return this.root ? this.root.findMaxNode().value : null;
  }

  /** Removes all values from the binary search tree. */
  clear() {
    this.root = null;
    this._size = 0;
  }

  /** Checks if the binary search tree is empty. */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Returns an iterator that uses in-order (LNR) tree traversal for
   * retrieving values from the binary search tree.
   */
  *lnrValues(): IterableIterator<T> {
    const nodes: BinarySearchNode<T>[] = [];
    let node: BinarySearchNode<T> | null = this.root;
    while (nodes.length || node) {
      if (node) {
        nodes.push(node);
        node = node.left;
      } else {
        node = nodes.pop()!;
        yield node.value;
        node = node.right;
      }
    }
  }

  /**
   * Returns an iterator that uses reverse in-order (RNL) tree traversal for
   * retrieving values from the binary search tree.
   */
  *rnlValues(): IterableIterator<T> {
    const nodes: BinarySearchNode<T>[] = [];
    let node: BinarySearchNode<T> | null = this.root;
    while (nodes.length || node) {
      if (node) {
        nodes.push(node);
        node = node.right;
      } else {
        node = nodes.pop()!;
        yield node.value;
        node = node.left;
      }
    }
  }

  /**
   * Returns an iterator that uses pre-order (NLR) tree traversal for
   * retrieving values from the binary search tree.
   */
  *nlrValues(): IterableIterator<T> {
    const nodes: BinarySearchNode<T>[] = [];
    if (this.root) nodes.push(this.root);
    while (nodes.length) {
      const node: BinarySearchNode<T> = nodes.pop()!;
      yield node.value;
      if (node.right) nodes.push(node.right);
      if (node.left) nodes.push(node.left);
    }
  }

  /**
   * Returns an iterator that uses post-order (LRN) tree traversal for
   * retrieving values from the binary search tree.
   */
  *lrnValues(): IterableIterator<T> {
    const nodes: BinarySearchNode<T>[] = [];
    let node: BinarySearchNode<T> | null = this.root;
    let lastNodeVisited: BinarySearchNode<T> | null = null;
    while (nodes.length || node) {
      if (node) {
        nodes.push(node);
        node = node.left;
      } else {
        const lastNode: BinarySearchNode<T> = nodes[nodes.length - 1];
        if (lastNode.right && lastNode.right !== lastNodeVisited) {
          node = lastNode.right;
        } else {
          yield lastNode.value;
          lastNodeVisited = nodes.pop()!;
        }
      }
    }
  }

  /**
   * Returns an iterator that uses level order tree traversal for
   * retrieving values from the binary search tree.
   */
  *lvlValues(): IterableIterator<T> {
    const children: BinarySearchNode<T>[] = [];
    let cursor: BinarySearchNode<T> | null = this.root;
    while (cursor) {
      yield cursor.value;
      if (cursor.left) children.push(cursor.left);
      if (cursor.right) children.push(cursor.right);
      cursor = children.shift() ?? null;
    }
  }

  /**
   * Returns an iterator that uses in-order (LNR) tree traversal for
   * retrieving values from the binary search tree.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.lnrValues();
  }
}
