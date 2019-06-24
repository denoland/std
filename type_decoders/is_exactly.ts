import { Decoder } from './decoder.ts';
import { ok, err, DecoderErrorMsg } from './util.ts';

export interface IExactlyDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isExactly<T>(exact: T, options: IExactlyDecoderOptions = {}) {
  const msg = options.msg || `must be exactly ${exact}`;

  return new Decoder(value =>
    value === exact
      ? ok(value as T)
      : err(value, msg, { decoderName: 'isExactly' }),
  );
}
