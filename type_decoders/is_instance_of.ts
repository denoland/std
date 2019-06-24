import { Decoder } from './decoder.ts';
import { ok, err, DecoderErrorMsg } from './util.ts';

export interface IInstanceOfDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isInstanceOf<T extends new (...args: any) => any>(
  clazz: T,
  options: IInstanceOfDecoderOptions = {},
) {
  const msg = options.msg || `must be an instance of ${clazz.name}`;

  return new Decoder(value =>
    value instanceof clazz
      ? ok(value as InstanceType<T>)
      : err(value, msg, { decoderName: 'isInstanceOf' }),
  );
}
