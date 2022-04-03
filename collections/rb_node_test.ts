import { assertStrictEquals } from "../testing/asserts.ts";
import { RBNode } from "./rb_node.ts";

Deno.test("[collections/RBNode] constructor and from", () => {
  const parent: RBNode<number> = new RBNode(null, 5);
  const child: RBNode<number> = new RBNode(parent, 7);
  parent.left = child;
  assertStrictEquals(parent.red, true);
  parent.red = false;
  const parentClone: RBNode<number> = RBNode.from(parent);
  const childClone: RBNode<number> = RBNode.from(child);

  assertStrictEquals(parent.parent, null);
  assertStrictEquals(parent.left, child);
  assertStrictEquals(parent.right, null);
  assertStrictEquals(parent.value, 5);
  assertStrictEquals(parent.red, false);

  assertStrictEquals(child.parent, parent);
  assertStrictEquals(child.left, null);
  assertStrictEquals(child.right, null);
  assertStrictEquals(child.value, 7);
  assertStrictEquals(child.red, true);

  assertStrictEquals(parentClone.parent, null);
  assertStrictEquals(parentClone.left, child);
  assertStrictEquals(parentClone.right, null);
  assertStrictEquals(parentClone.value, 5);
  assertStrictEquals(parentClone.red, false);

  assertStrictEquals(childClone.parent, parent);
  assertStrictEquals(childClone.left, null);
  assertStrictEquals(childClone.right, null);
  assertStrictEquals(childClone.value, 7);
  assertStrictEquals(childClone.red, true);
});
