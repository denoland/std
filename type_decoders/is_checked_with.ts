import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './util.ts';

const decoderName = 'isCheckedWith';

export interface ICheckedWithDecoderOptions {
  msg?: DecoderErrorMsg;
  promise?: boolean;
}

export function isCheckedWith<T>(
  fn: (value: T) => boolean,
  options?: ICheckedWithDecoderOptions,
): Decoder<T, T>;
export function isCheckedWith<T>(
  fn: (value: T) => Promise<boolean>,
  options: ICheckedWithDecoderOptions & { promise: true },
): PromiseDecoder<T, T>;
export function isCheckedWith<T>(
  fn: (value: T) => boolean | Promise<boolean>,
  options: ICheckedWithDecoderOptions = {},
) {
  const msg = options.msg || 'failed custom check';

  if (options.promise) {
    return new PromiseDecoder(async (input: T) => 
      (await fn(input)) ? ok(input) : err(input, msg, { decoderName }),
    );
  }

  return new Decoder((input: T) => 
    fn(input) ? ok(input) : err(input, msg, { decoderName }),
  );
}
