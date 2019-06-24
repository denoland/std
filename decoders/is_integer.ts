import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './utils.ts';

export interface IIntegerDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isInteger(args: IIntegerDecoderOptions = {}) {
  const msg = args.msg || 'must be a whole number';

  return new Decoder(value =>
    Number.isInteger(value as any)
      ? ok(value as number)
      : err(value, msg),
  );
}
