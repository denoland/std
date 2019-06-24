import { Decoder, DecoderInputType, PromiseDecoder } from './decoder.ts';
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult,
} from './decoder_result.ts';
import { NestedDecoderErrorMsg, err, ok } from './util.ts';

type SubtractOne<T extends number> = [
  -1,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
][T];

type ChainOfDecoderReturnType<T extends unknown[]> = T[SubtractOne<
  T['length']
>];

const decoderName = 'isChainOf';

export interface IChainOfDecoderOptions {
  msg?: string | ((args: {value: unknown, error: DecoderError}) => string);
}

export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [I in keyof T]: Decoder<T[I]> },
  options?: IChainOfDecoderOptions,
): Decoder<R, I>;
export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [I in keyof T]: Decoder<T[I]> | PromiseDecoder<T[I]> },
  options?: IChainOfDecoderOptions,
): PromiseDecoder<R, I>;
export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [I in keyof T]: Decoder<T[I]> },
  options: IChainOfDecoderOptions = {},
) {
  if (decoders.some(decoder => decoder instanceof PromiseDecoder)) {
    return new PromiseDecoder<R, I>(async value => {
      const result = await decoders.reduce(async (prev, curr) => {
        return (prev instanceof DecoderSuccess
          ? await curr.decode(prev.value)
          : prev) as DecoderResult<R>;
      }, Promise.resolve(ok<R>((value as unknown) as R)));

      if (result instanceof DecoderError) {
        return err(result.value, options.msg || result.message, {
          decoderName,
          child: result,
          location: result.location,
        });
      }

      return result;
    });
  }

  return new Decoder<R, I>(value => {
    const result = decoders.reduce((prev, curr) => {
      return (prev instanceof DecoderSuccess
        ? curr.decode(prev.value)
        : prev) as DecoderResult<R>;
    }, ok<R>((value as unknown) as R));

    if (result instanceof DecoderError) {
      return err(result.value, options.msg || result.message, {
        decoderName,
        child: result,
        location: result.location,
      });
    }

    return result;
  });
}
