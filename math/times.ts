import { BigSource, Big } from "./big/mod.ts";

export function times(multiplicand: BigSource, multiplier: BigSource): string {
  return (multiplicand instanceof Big ? multiplicand : new Big(multiplicand))
    .times(multiplier)
    .toString();
}
