import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './utils.ts';

export interface IStringDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isString(args: IStringDecoderOptions = {}) {
  const msg = args.msg || 'must be a string';

  return new Decoder(value =>
    typeof value === 'string'
      ? ok(value)
      : err(value, msg),
  );
}
