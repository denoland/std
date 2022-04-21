/** This module is browser compatible. */

export type direction = "left" | "right";

export class BSNode<T> {
  left: BSNode<T> | null;
  right: BSNode<T> | null;
  constructor(public parent: BSNode<T> | null, public value: T) {
    this.left = null;
    this.right = null;
  }

  static from<T>(node: BSNode<T>): BSNode<T> {
    const copy: BSNode<T> = new BSNode(node.parent, node.value);
    copy.left = node.left;
    copy.right = node.right;
    return copy;
  }

  directionFromParent(): direction | null {
    return this.parent === null
      ? null
      : this === this.parent.left
      ? "left"
      : this === this.parent.right
      ? "right"
      : null;
  }

  findMinNode(): BSNode<T> {
    let minNode: BSNode<T> | null = this.left;
    while (minNode?.left) minNode = minNode.left;
    return minNode ?? this;
  }

  findMaxNode(): BSNode<T> {
    let maxNode: BSNode<T> | null = this.right;
    while (maxNode?.right) maxNode = maxNode.right;
    return maxNode ?? this;
  }

  findSuccessorNode(): BSNode<T> | null {
    if (this.right !== null) return this.right.findMinNode();
    let parent: BSNode<T> | null = this.parent;
    let direction: direction | null = this.directionFromParent();
    while (parent && direction === "right") {
      direction = parent.directionFromParent();
      parent = parent.parent;
    }
    return parent;
  }
}
