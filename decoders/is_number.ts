import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './utils.ts';

export interface INumberDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isNumber(args: INumberDecoderOptions = {}) {
  const msg = args.msg || 'must be a number';

  return new Decoder(value =>
    Number.isFinite(value as any)
      ? ok(value as number)
      : err(value, msg),
  );
}
