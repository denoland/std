import { Decoder } from './decoder.ts';
import { ok } from './utils.ts';

export function isConstant<T>(constant: T) {
  return new Decoder(() => ok(constant));
}
