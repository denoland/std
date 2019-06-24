import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './utils.ts';

export interface ILessThanDecoderOptions {
  msg?: DecoderErrorMsg;
  promise?: boolean;
}

export function isComparedTo<T>(
  fn: (value: T) => boolean,
  args?: ILessThanDecoderOptions,
): Decoder<T, T>;
export function isComparedTo<T>(
  fn: (value: T) => Promise<boolean>,
  args: ILessThanDecoderOptions & { promise: true },
): PromiseDecoder<T, T>;
export function isComparedTo<T>(
  fn: (value: T) => boolean | Promise<boolean>,
  args: ILessThanDecoderOptions = {},
) {
  const msg = args.msg || 'must be a number';

  if (args.promise) {
    return new PromiseDecoder(async (input: T) => 
      (await fn(input)) ? ok(input) : err(input, msg),
    );
  }

  return new Decoder((input: T) => 
    fn(input) ? ok(input) : err(input, msg),
  );
}
