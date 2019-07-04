import { Decoder, DecoderInputType, PromiseDecoder } from './decoder.ts';
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult,
  areDecoderErrors,
} from './decoder_result.ts';
import { ok } from './_util.ts';
import { ISimpleDecoderOptions, applyDecoderErrorOptions } from './helpers.ts';

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

export interface IChainOfDecoderOptions extends ISimpleDecoderOptions {}

// TODO(@thefliik): See if someone else can improve the typing of the decoders arg

export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [P in keyof T]: Decoder<T[P], any> },
  options?: IChainOfDecoderOptions,
): Decoder<R, I>;
export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [P in keyof T]: Decoder<T[P], any> | PromiseDecoder<T[P], any> },
  options?: IChainOfDecoderOptions,
): PromiseDecoder<R, I>;
export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [P in keyof T]: Decoder<T[P], any> | PromiseDecoder<T[P], any> },
  options: IChainOfDecoderOptions = {},
): Decoder<R, I> | PromiseDecoder<R, I> {
  if (decoders.some(decoder => decoder instanceof PromiseDecoder)) {
    return new PromiseDecoder<R, I>(async value => {
      const result = await decoders.reduce(async (prev, curr) => {
        return (prev instanceof DecoderSuccess
          ? await curr.decode(prev.value)
          : prev) as DecoderResult<R>;
      }, Promise.resolve(ok(value as unknown) as DecoderResult<R>));

      if (areDecoderErrors(result)) {
        return applyDecoderErrorOptions(buildChildErrors(value, result), options);
      }

      return result;
    });
  }

  return new Decoder<R, I>(value => {
    const result = decoders.reduce(
      (prev, curr) => {
        return (prev instanceof DecoderSuccess
          ? curr.decode(prev.value)
          : prev) as DecoderResult<R>;
      },
      ok(value as unknown) as DecoderResult<R>,
    );

    if (areDecoderErrors(result)) {
      return applyDecoderErrorOptions(buildChildErrors(value, result), options);
    }

    return result;
  });
}

function buildChildErrors(input: unknown, children: DecoderError[]) {
  return children.map(
    child =>
      new DecoderError(input, child.message, {
        decoderName,
        child,
      }),
  );
}
