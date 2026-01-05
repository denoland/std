// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { BinarySearchNode, Direction } from "./_binary_search_node.ts";
import { BinarySearchTree as StableBinarySearchTree } from "./binary_search_tree.ts";
import { internals } from "./_binary_search_tree_internals.ts";

const {
  getRoot,
  setRoot,
  setSize,
  getCompare,
} = internals;

/**
 * An unbalanced binary search tree. The values are in ascending order by default,
 * using JavaScript's built-in comparison operators to sort the values.
 *
 * For performance, it's recommended that you use a self-balancing binary search
 * tree instead of this one unless you are extending this to create a
 * self-balancing tree. See {@link RedBlackTree} for an example of how BinarySearchTree
 * can be extended to create a self-balancing binary search tree.
 *
 * | Method        | Average Case | Worst Case |
 * | ------------- | ------------ | ---------- |
 * | find(value)   | O(log n)     | O(n)       |
 * | insert(value) | O(log n)     | O(n)       |
 * | remove(value) | O(log n)     | O(n)       |
 * | min()         | O(log n)     | O(n)       |
 * | max()         | O(log n)     | O(n)       |
 *
 * @example Usage
 * ```ts
 * import {
 *   BinarySearchTree,
 *   ascend,
 *   descend,
 * } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * const values = [3, 10, 13, 4, 6, 7, 1, 14];
 * const tree = new BinarySearchTree<number>();
 * values.forEach((value) => tree.insert(value));
 * assertEquals([...tree], [1, 3, 4, 6, 7, 10, 13, 14]);
 * assertEquals(tree.min(), 1);
 * assertEquals(tree.max(), 14);
 * assertEquals(tree.find(42), null);
 * assertEquals(tree.find(7), 7);
 * assertEquals(tree.remove(42), false);
 * assertEquals(tree.remove(7), true);
 * assertEquals([...tree], [1, 3, 4, 6, 10, 13, 14]);
 *
 * const invertedTree = new BinarySearchTree<number>(descend);
 * values.forEach((value) => invertedTree.insert(value));
 * assertEquals([...invertedTree], [14, 13, 10, 7, 6, 4, 3, 1]);
 * assertEquals(invertedTree.min(), 14);
 * assertEquals(invertedTree.max(), 1);
 * assertEquals(invertedTree.find(42), null);
 * assertEquals(invertedTree.find(7), 7);
 * assertEquals(invertedTree.remove(42), false);
 * assertEquals(invertedTree.remove(7), true);
 * assertEquals([...invertedTree], [14, 13, 10, 6, 4, 3, 1]);
 *
 * const words = new BinarySearchTree<string>((a, b) =>
 *   ascend(a.length, b.length) || ascend(a, b)
 * );
 * ["truck", "car", "helicopter", "tank", "train", "suv", "semi", "van"]
 *   .forEach((value) => words.insert(value));
 * assertEquals([...words], [
 *   "car",
 *   "suv",
 *   "van",
 *   "semi",
 *   "tank",
 *   "train",
 *   "truck",
 *   "helicopter",
 * ]);
 * assertEquals(words.min(), "car");
 * assertEquals(words.max(), "helicopter");
 * assertEquals(words.find("scooter"), null);
 * assertEquals(words.find("tank"), "tank");
 * assertEquals(words.remove("scooter"), false);
 * assertEquals(words.remove("tank"), true);
 * assertEquals([...words], [
 *   "car",
 *   "suv",
 *   "van",
 *   "semi",
 *   "train",
 *   "truck",
 *   "helicopter",
 * ]);
 * ```
 *
 * @typeparam T The type of the values stored in the binary search tree.
 */
export class BinarySearchTree<T> extends StableBinarySearchTree<T> {
  /**
   * Construct an empty binary search tree.
   *
   * To create a binary search tree from an array like, an iterable object, or an
   * existing binary search tree, use the {@link BinarySearchTree.from} method.
   *
   * @param compare A custom comparison function to sort the values in the tree.
   * By default, the values are sorted in ascending order.
   */
  constructor(compare?: (a: T, b: T) => number) {
    super(compare);
  }

  /**
   * Creates a new binary search tree from an array like, an iterable object,
   * or an existing binary search tree.
   *
   * A custom comparison function can be provided to sort the values in a
   * specific order. By default, the values are sorted in ascending order,
   * unless a {@link BinarySearchTree} is passed, in which case the comparison
   * function is copied from the input tree.
   *
   * @example Creating a binary search tree from an array like
   * ```ts no-assert
   * import { BinarySearchTree } from "@std/data-structures";
   *
   * const tree = BinarySearchTree.from<number>([42, 43, 41]);
   * ```
   *
   * @example Creating a binary search tree from an iterable object
   * ```ts no-assert
   * import { BinarySearchTree } from "@std/data-structures";
   *
   * const tree = BinarySearchTree.from<number>((function*() {
   *   yield 42;
   *   yield 43;
   *   yield 41;
   * })());
   * ```
   *
   * @example Creating a binary search tree from an existing binary search tree
   * ```ts no-assert
   * import { BinarySearchTree } from "@std/data-structures";
   *
   * const tree = BinarySearchTree.from<number>([42, 43, 41]);
   * const copy = BinarySearchTree.from(tree);
   * ```
   *
   * @example Creating a binary search tree from an array like with a custom comparison function
   * ```ts no-assert
   * import { BinarySearchTree, descend } from "@std/data-structures";
   *
   * const tree = BinarySearchTree.from<number>(
   *   [42, 43, 41],
   *   { compare: descend }
   * );
   * ```
   *
   * @typeparam T The type of the values stored in the binary search tree.
   * @param collection An array like, an iterable, or existing binary search tree.
   * @param options An optional options object to customize the comparison function.
   * @returns A new binary search tree created from the passed collection.
   */
  static override from<T>(
    collection: ArrayLike<T> | Iterable<T> | StableBinarySearchTree<T>,
    options?: {
      compare?: (a: T, b: T) => number;
    },
  ): BinarySearchTree<T>;
  /**
   * Create a new binary search tree from an array like, an iterable object, or
   * an existing binary search tree.
   *
   * A custom mapping function can be provided to transform the values before
   * inserting them into the tree.
   *
   * A custom comparison function can be provided to sort the values in a
   * specific order. A custom mapping function can be provided to transform the
   * values before inserting them into the tree. By default, the values are
   * sorted in ascending order, unless a {@link BinarySearchTree} is passed, in
   * which case the comparison function is copied from the input tree. The
   * comparison operator is used to sort the values in the tree after mapping
   * the values.
   *
   * @example Creating a binary search tree from an array like with a custom mapping function
   * ```ts no-assert
   * import { BinarySearchTree } from "@std/data-structures";
   *
   * const tree = BinarySearchTree.from<number, string>(
   *   [42, 43, 41],
   *   { map: (value) => value.toString() }
   * );
   * ```
   *
   * @typeparam T The type of the values in the passed collection.
   * @typeparam U The type of the values stored in the binary search tree.
   * @typeparam V The type of the `this` value when calling the mapping function. Defaults to `undefined`.
   * @param collection An array like, an iterable, or existing binary search tree.
   * @param options The options object to customize the mapping and comparison functions. The `thisArg` property can be used to set the `this` value when calling the mapping function.
   * @returns A new binary search tree containing the mapped values from the passed collection.
   */
  static override from<T, U, V = undefined>(
    collection: ArrayLike<T> | Iterable<T> | StableBinarySearchTree<T>,
    options: {
      compare?: (a: U, b: U) => number;
      map: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): BinarySearchTree<U>;
  static override from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | StableBinarySearchTree<T>,
    options?: {
      compare?: (a: U, b: U) => number;
      map?: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): BinarySearchTree<U> {
    const result = new BinarySearchTree<U>(options?.compare);
    const stableTree = super.from<T, U, V>(
      collection,
      // Cast to use types of `from<T, U, V = undefined>` instead of `from<T>`.
      // The latter happens by default, even though we call `super.from<T, U, V>`.
      options as { map: (value: T, index: number) => U },
    );
    setRoot(result, getRoot(stableTree));
    setSize(result, stableTree.size);
    return result;
  }

  /**
   * Finds the node matching the given selection criteria.
   *
   * When searching for higher nodes, returns the lowest node that is higher than
   * the value. When searching for lower nodes, returns the highest node that is
   * lower than the value.
   *
   * By default, only accepts a node exactly matching the passed value and returns
   * it if found.
   *
   * @param value The value to search for
   * @param select Whether to accept nodes that are higher or lower than the value
   * @param returnIfFound Whether a node matching the value itself is accepted
   * @returns The node that matched, or null if none matched
   */
  #findNode(
    value: T,
    select?: "higher" | "lower",
    returnIfFound: boolean = true,
  ): BinarySearchNode<T> | null {
    const compare = getCompare(this);

    let node: BinarySearchNode<T> | null = getRoot(this);
    let result: BinarySearchNode<T> | null = null;
    while (node) {
      const order = compare(value, node.value);
      if (order === 0 && returnIfFound) return node;

      let direction: Direction = order < 0 ? "left" : "right";
      if (select === "higher" && order === 0) {
        direction = "right";
      } else if (select === "lower" && order === 0) {
        direction = "left";
      }

      if (
        (select === "higher" && direction === "left") ||
        (select === "lower" && direction === "right")
      ) {
        result = node;
      }

      node = node[direction];
    }
    return result;
  }

  /**
   * Finds the lowest (leftmost) value in the binary search tree which is
   * greater than or equal to the given value, or null if the given value
   * is higher than all elements of the tree.
   *
   * The complexity of this operation depends on the underlying structure of the
   * tree. Refer to the documentation of the structure itself for more details.
   *
   * @example Finding values in the tree
   * ```ts
   * import { BinarySearchTree } from "@std/data-structures/unstable-binary-search-tree";
   * import { assertEquals } from "@std/assert";
   *
   * const tree = BinarySearchTree.from<number>([42]);
   *
   * assertEquals(tree.ceiling(41), 42);
   * assertEquals(tree.ceiling(42), 42);
   * assertEquals(tree.ceiling(43), null);
   * ```
   *
   * @param value The value to search for in the binary search tree.
   * @returns The ceiling if it was found, or null if not.
   */
  ceiling(value: T): T | null {
    return this.#findNode(value, "higher")?.value ?? null;
  }

  /**
   * Finds the highest (rightmost) value in the binary search tree which is
   * less than or equal to the given value, or null if the given value
   * is lower than all elements of the tree.
   *
   * The complexity of this operation depends on the underlying structure of the
   * tree. Refer to the documentation of the structure itself for more details.
   *
   * @example Finding values in the tree
   * ```ts
   * import { BinarySearchTree } from "@std/data-structures/unstable-binary-search-tree";
   * import { assertEquals } from "@std/assert";
   *
   * const tree = BinarySearchTree.from<number>([42]);
   *
   * assertEquals(tree.floor(41), null);
   * assertEquals(tree.floor(42), 42);
   * assertEquals(tree.floor(43), 42);
   * ```
   *
   * @param value The value to search for in the binary search tree.
   * @returns The floor if it was found, or null if not.
   */
  floor(value: T): T | null {
    return this.#findNode(value, "lower")?.value ?? null;
  }

  /**
   * Finds the lowest (leftmost) value in the binary search tree which is
   * strictly greater than the given value, or null if the given value
   * is higher than or equal to all elements of the tree
   *
   * The complexity of this operation depends on the underlying structure of the
   * tree. Refer to the documentation of the structure itself for more details.
   *
   * @example Finding values in the tree
   * ```ts
   * import { BinarySearchTree } from "@std/data-structures/unstable-binary-search-tree";
   * import { assertEquals } from "@std/assert";
   *
   * const tree = BinarySearchTree.from<number>([42]);
   *
   * assertEquals(tree.higher(41), 42);
   * assertEquals(tree.higher(42), null);
   * assertEquals(tree.higher(43), null);
   * ```
   *
   * @param value The value to search for in the binary search tree.
   * @returns The higher value if it was found, or null if not.
   */
  higher(value: T): T | null {
    return this.#findNode(value, "higher", false)?.value ?? null;
  }

  /**
   * Finds the highest (rightmost) value in the binary search tree which is
   * strictly less than the given value, or null if the given value
   * is lower than or equal to all elements of the tree
   *
   * The complexity of this operation depends on the underlying structure of the
   * tree. Refer to the documentation of the structure itself for more details.
   *
   * @example Finding values in the tree
   * ```ts
   * import { BinarySearchTree } from "@std/data-structures/unstable-binary-search-tree";
   * import { assertEquals } from "@std/assert";
   *
   * const tree = BinarySearchTree.from<number>([42]);
   *
   * assertEquals(tree.lower(41), null);
   * assertEquals(tree.lower(42), null);
   * assertEquals(tree.lower(43), 42);
   * ```
   *
   * @param value The value to search for in the binary search tree.
   * @returns The lower value if it was found, or null if not.
   */
  lower(value: T): T | null {
    return this.#findNode(value, "lower", false)?.value ?? null;
  }
}
