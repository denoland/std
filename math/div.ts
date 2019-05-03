import { BigSource, Big } from "./big/mod.ts";

export function div(dividend: BigSource, divisor: BigSource): string {
  return (dividend instanceof Big ? dividend : new Big(dividend))
    .div(divisor)
    .toString();
}
