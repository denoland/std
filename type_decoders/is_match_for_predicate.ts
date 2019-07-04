import { Decoder, PromiseDecoder } from './decoder.ts';
import { ok, err } from './_util.ts';
import { ISimpleDecoderOptions } from './helpers.ts';

const decoderName = 'isMatchForPredicate';
const defaultMsg = 'failed custom check';

export interface ICheckedWithDecoderOptions extends ISimpleDecoderOptions {
  promise?: boolean;
}

export function isMatchForPredicate<T>(
  fn: (value: T) => boolean | Promise<boolean>,
  options: ICheckedWithDecoderOptions & { promise: true },
): PromiseDecoder<T, T>;
export function isMatchForPredicate<T>(
  fn: (value: T) => boolean,
  options?: ICheckedWithDecoderOptions,
): Decoder<T, T>;
export function isMatchForPredicate<T>(
  fn: (value: T) => boolean | Promise<boolean>,
  options: ICheckedWithDecoderOptions = {},
) {
  if (options.promise) {
    return new PromiseDecoder(async (input: T) =>
      (await fn(input))
        ? ok(input)
        : err(input, defaultMsg, decoderName, options),
    );
  }

  return new Decoder((input: T) =>
    fn(input) ? ok(input) : err(input, defaultMsg, decoderName, options),
  );
}
