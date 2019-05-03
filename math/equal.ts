import { BigSource, Big } from "./big/mod.ts";

export function eq(a: BigSource, b: BigSource): boolean {
  return (a instanceof Big ? a : new Big(a)).eq(b);
}
