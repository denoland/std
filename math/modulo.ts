import { BigSource, Big } from "./big/mod.ts";

export function mod(a: BigSource, b: BigSource): string {
  return (a instanceof Big ? a : new Big(a)).mod(b).toString();
}
