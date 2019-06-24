import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, err } from './utils.ts';

export interface INeverDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isNever(options: INeverDecoderOptions = {}) {
  const msg = options.msg || 'must not be present';

  return new Decoder<never>(value => err(value, msg));
}
