// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/** This module is browser compatible. */

import { ascend, BinarySearchTree } from "./binary_search_tree.ts";
import { Direction, RedBlackNode } from "./red_black_node.ts";
export * from "./_comparators.ts";

/**
 * A red-black tree. This is a kind of self-balancing binary search tree.
 * The values are in ascending order by default,
 * using JavaScript's built in comparison operators to sort the values.
 */
export class RedBlackTree<T> extends BinarySearchTree<T> {
  declare protected root: RedBlackNode<T> | null;

  constructor(
    compare: (a: T, b: T) => number = ascend,
  ) {
    super(compare);
  }

  /** Creates a new red-black tree from an array like or iterable object. */
  static override from<T>(
    collection: ArrayLike<T> | Iterable<T> | RedBlackTree<T>,
  ): RedBlackTree<T>;
  static override from<T>(
    collection: ArrayLike<T> | Iterable<T> | RedBlackTree<T>,
    options: {
      Node?: typeof RedBlackNode;
      compare?: (a: T, b: T) => number;
    },
  ): RedBlackTree<T>;
  static override from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | RedBlackTree<T>,
    options: {
      compare?: (a: U, b: U) => number;
      map: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): RedBlackTree<U>;
  static override from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | RedBlackTree<T>,
    options?: {
      compare?: (a: U, b: U) => number;
      map?: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): RedBlackTree<U> {
    let result: RedBlackTree<U>;
    let unmappedValues: ArrayLike<T> | Iterable<T> = [];
    if (collection instanceof RedBlackTree) {
      result = new RedBlackTree(
        options?.compare ?? (collection as unknown as RedBlackTree<U>).compare,
      );
      if (options?.compare || options?.map) {
        unmappedValues = collection;
      } else {
        const nodes: RedBlackNode<U>[] = [];
        if (collection.root) {
          result.root = RedBlackNode.from(
            collection.root as unknown as RedBlackNode<U>,
          );
          nodes.push(result.root);
        }
        while (nodes.length) {
          const node: RedBlackNode<U> = nodes.pop()!;
          const left: RedBlackNode<U> | null = node.left
            ? RedBlackNode.from(node.left)
            : null;
          const right: RedBlackNode<U> | null = node.right
            ? RedBlackNode.from(node.right)
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
        ? new RedBlackTree(options.compare)
        : new RedBlackTree()) as RedBlackTree<U>;
      unmappedValues = collection;
    }
    const values: Iterable<U> = options?.map
      ? Array.from(unmappedValues, options.map, options.thisArg)
      : unmappedValues as U[];
    for (const value of values) result.insert(value);
    return result;
  }

  protected removeFixup(
    parent: RedBlackNode<T> | null,
    current: RedBlackNode<T> | null,
  ) {
    while (parent && !current?.red) {
      const direction: Direction = parent.left === current ? "left" : "right";
      const siblingDirection: Direction = direction === "right"
        ? "left"
        : "right";
      let sibling: RedBlackNode<T> | null = parent[siblingDirection];

      if (sibling?.red) {
        sibling.red = false;
        parent.red = true;
        this.rotateNode(parent, direction);
        sibling = parent[siblingDirection];
      }
      if (sibling) {
        if (!sibling.left?.red && !sibling.right?.red) {
          sibling!.red = true;
          current = parent;
          parent = current.parent;
        } else {
          if (!sibling[siblingDirection]?.red) {
            sibling[direction]!.red = false;
            sibling.red = true;
            this.rotateNode(sibling, siblingDirection);
            sibling = parent[siblingDirection!];
          }
          sibling!.red = parent.red;
          parent.red = false;
          sibling![siblingDirection]!.red = false;
          this.rotateNode(parent, direction);
          current = this.root;
          parent = null;
        }
      }
    }
    if (current) current.red = false;
  }

  /**
   * Adds the value to the binary search tree if it does not already exist in it.
   * Returns true if successful.
   */
  override insert(value: T): boolean {
    let node = this.insertNode(RedBlackNode, value) as (RedBlackNode<T> | null);
    if (node) {
      while (node.parent?.red) {
        let parent: RedBlackNode<T> = node.parent!;
        const parentDirection: Direction = parent.directionFromParent()!;
        const uncleDirection: Direction = parentDirection === "right"
          ? "left"
          : "right";
        const uncle: RedBlackNode<T> | null = parent.parent![uncleDirection] ??
          null;

        if (uncle?.red) {
          parent.red = false;
          uncle.red = false;
          parent.parent!.red = true;
          node = parent.parent!;
        } else {
          if (node === parent[uncleDirection]) {
            node = parent;
            this.rotateNode(node, parentDirection);
            parent = node.parent!;
          }
          parent.red = false;
          parent.parent!.red = true;
          this.rotateNode(parent.parent!, uncleDirection);
        }
      }
      this.root!.red = false;
    }
    return !!node;
  }

  /**
   * Removes node value from the binary search tree if found.
   * Returns true if found and removed.
   */
  override remove(value: T): boolean {
    const node = this.removeNode(value) as (RedBlackNode<T> | null);
    if (node && !node.red) {
      this.removeFixup(node.parent, node.left ?? node.right);
    }
    return !!node;
  }
}
