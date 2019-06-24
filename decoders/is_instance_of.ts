import { Decoder } from './decoder.ts';
import { ok, err, DecoderErrorMsg } from './utils.ts';

export interface IInstanceOfDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isInstanceOf<T extends new (...args: any) => any>(
  clazz: T,
  args: IInstanceOfDecoderOptions = {},
) {
  const msg = args.msg || `must be an instance of ${clazz.name}`;

  return new Decoder(value =>
    value instanceof clazz
      ? ok(value as InstanceType<T>)
      : err(value, msg),
  );
}
