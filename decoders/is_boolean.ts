import { Decoder } from './decoder.ts';
import { ok, err, DecoderErrorMsg } from './utils.ts';

export interface IBooleanDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isBoolean(args: IBooleanDecoderOptions = {}) {
  const msg = args.msg || 'must be a boolean';

  return new Decoder(value =>
    typeof value === 'boolean' ? ok(value) : err(value, msg),
  );
}
