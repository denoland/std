import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './util.ts';

export interface INullDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isNull(options: INullDecoderOptions = {}) {
  const msg = options.msg || 'must be null';

  return new Decoder(value =>
    value === null
      ? ok(value as null)
      : err(value, msg, { decoderName: 'isNull' }),
  );
}
