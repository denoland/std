import { BigSource, Big } from "./big/mod.ts";

export function sqrt(value: BigSource): string {
  return (value instanceof Big ? value : new Big(value)).sqrt().toString();
}
