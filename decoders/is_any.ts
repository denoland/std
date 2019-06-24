import { Decoder } from './decoder.ts';
import { ok } from './utils.ts';

export function isAny<T = unknown>() {
  return new Decoder(value => ok(value as T));
}
