/** This module is browser compatible. */

import { BSNode, direction } from "./bs_node.ts";
export type { direction };

export class RBNode<T> extends BSNode<T> {
  declare parent: RBNode<T> | null;
  declare left: RBNode<T> | null;
  declare right: RBNode<T> | null;
  red: boolean;

  constructor(parent: RBNode<T> | null, value: T) {
    super(parent, value);
    this.red = true;
  }

  static override from<T>(node: RBNode<T>): RBNode<T> {
    const copy: RBNode<T> = new RBNode(node.parent, node.value);
    copy.left = node.left;
    copy.right = node.right;
    copy.red = node.red;
    return copy;
  }
}
