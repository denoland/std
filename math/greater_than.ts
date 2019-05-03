import { BigSource, Big } from "./big/mod.ts";

export function gt(a: BigSource, b: BigSource): boolean {
  return (a instanceof Big ? a : new Big(a)).gt(b);
}
