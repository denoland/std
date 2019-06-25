import { Decoder } from "./decoder.ts";
import { ok } from "./util.ts";

export function isConstant<T>(constant: T) {
  return new Decoder(() => ok(constant));
}
