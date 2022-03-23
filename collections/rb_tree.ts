/** This module is browser compatible. */

import { ascend, BSTree } from "./bs_tree.ts";
import { direction, RBNode } from "./rb_node.ts";
export * from "./_comparators.ts";

/**
 * A red-black tree. This is a kind of self-balancing binary search tree.
 * The values are in ascending order by default,
 * using JavaScript's built in comparison operators to sort the values.
 */
export class RBTree<T> extends BSTree<T> {
  declare protected root: RBNode<T> | null;

  constructor(
    compare: (a: T, b: T) => number = ascend,
  ) {
    super(compare);
  }

  /** Creates a new red-black tree from an array like or iterable object. */
  static override from<T>(
    collection: ArrayLike<T> | Iterable<T> | RBTree<T>,
  ): RBTree<T>;
  static override from<T>(
    collection: ArrayLike<T> | Iterable<T> | RBTree<T>,
    options: {
      Node?: typeof RBNode;
      compare?: (a: T, b: T) => number;
    },
  ): RBTree<T>;
  static override from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | RBTree<T>,
    options: {
      compare?: (a: U, b: U) => number;
      map: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): RBTree<U>;
  static override from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | RBTree<T>,
    options?: {
      compare?: (a: U, b: U) => number;
      map?: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): RBTree<U> {
    let result: RBTree<U>;
    let unmappedValues: ArrayLike<T> | Iterable<T> = [];
    if (collection instanceof RBTree) {
      result = new RBTree(
        options?.compare ?? (collection as unknown as RBTree<U>).compare,
      );
      if (options?.compare || options?.map) {
        unmappedValues = collection;
      } else {
        const nodes: RBNode<U>[] = [];
        if (collection.root) {
          result.root = RBNode.from(collection.root as unknown as RBNode<U>);
          nodes.push(result.root);
        }
        while (nodes.length) {
          const node: RBNode<U> = nodes.pop()!;
          const left: RBNode<U> | null = node.left
            ? RBNode.from(node.left)
            : null;
          const right: RBNode<U> | null = node.right
            ? RBNode.from(node.right)
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
        ? new RBTree(options.compare)
        : new RBTree()) as RBTree<U>;
      unmappedValues = collection;
    }
    const values: Iterable<U> = options?.map
      ? Array.from(unmappedValues, options.map, options.thisArg)
      : unmappedValues as U[];
    for (const value of values) result.insert(value);
    return result;
  }

  protected removeFixup(parent: RBNode<T> | null, current: RBNode<T> | null) {
    while (parent && !current?.red) {
      const direction: direction = parent.left === current ? "left" : "right";
      const siblingDirection: direction = direction === "right"
        ? "left"
        : "right";
      let sibling: RBNode<T> | null = parent[siblingDirection];

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
    let node = this.insertNode(RBNode, value) as (RBNode<T> | null);
    if (node) {
      while (node.parent?.red) {
        let parent: RBNode<T> = node.parent!;
        const parentDirection: direction = parent.directionFromParent()!;
        const uncleDirection: direction = parentDirection === "right"
          ? "left"
          : "right";
        const uncle: RBNode<T> | null = parent.parent![uncleDirection] ?? null;

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
    const node = this.removeNode(value) as (RBNode<T> | null);
    if (node && !node.red) {
      this.removeFixup(node.parent, node.left ?? node.right);
    }
    return !!node;
  }
}
