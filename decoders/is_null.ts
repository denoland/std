import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './utils.ts';

export interface INullDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isNull(args: INullDecoderOptions = {}) {
  const msg = args.msg || 'must be null';

  return new Decoder(value =>
    value === null
      ? ok(value as null)
      : err(value, msg),
  );
}
