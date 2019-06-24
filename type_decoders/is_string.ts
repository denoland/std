import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './util.ts';

export interface IStringDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isString(options: IStringDecoderOptions = {}) {
  const msg = options.msg || 'must be a string';

  return new Decoder(value =>
    typeof value === 'string'
      ? ok(value)
      : err(value, msg, { decoderName: 'isString' }),
  );
}
