import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './util.ts';

export interface IIntegerDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isInteger(options: IIntegerDecoderOptions = {}) {
  const msg = options.msg || 'must be a whole number';

  return new Decoder(value =>
    Number.isInteger(value as any)
      ? ok(value as number)
      : err(value, msg, { decoderName: 'isInteger' }),
  );
}
