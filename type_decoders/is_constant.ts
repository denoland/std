import { Decoder } from "./decoder.ts";
import { ok } from "./_util.ts";

export function isConstant<T>(constant: T) {
  return new Decoder(() => ok(constant));
}
