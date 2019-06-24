import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './util.ts';

export interface INumberDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isNumber(options: INumberDecoderOptions = {}) {
  const msg = options.msg || 'must be a number';

  return new Decoder(value =>
    Number.isFinite(value as any)
      ? ok(value as number)
      : err(value, msg, { decoderName: 'isNumber' }),
  );
}
