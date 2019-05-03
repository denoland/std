import { BigSource, Big } from "./big/mod.ts";

export function lt(a: BigSource, b: BigSource): boolean {
  return (a instanceof Big ? a : new Big(a)).lt(b);
}
