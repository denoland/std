import { Decoder, DecoderInputType, PromiseDecoder } from "./decoder.ts";
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult,
  areDecoderErrors
} from "./decoder_result.ts";
import { ok } from "./_util.ts";
import { SimpleDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";

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
  T["length"]
>];

const decoderName = "isChainOf";

function childErrors(input: unknown, children: DecoderError[]): DecoderError[] {
  return children.map(
    (child): DecoderError =>
      new DecoderError(input, child.message, {
        decoderName,
        child
      })
  );
}

export type IsChainOfOptions = SimpleDecoderOptions;

export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [P in keyof T]: Decoder<T[P]> },
  options?: IsChainOfOptions
): Decoder<R, I>;
export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IsChainOfOptions
): PromiseDecoder<R, I>;
export function isChainOf<
  T extends [unknown, ...unknown[]],
  R = ChainOfDecoderReturnType<T>,
  I = DecoderInputType<T[0]>
>(
  decoders: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IsChainOfOptions = {}
): Decoder<R, I> | PromiseDecoder<R, I> {
  if (decoders.some((decoder): boolean => decoder instanceof PromiseDecoder)) {
    return new PromiseDecoder<R, I>(
      async (value): Promise<DecoderResult<R>> => {
        let result = ok(value as unknown) as DecoderResult<R>;

        for (const decoder of decoders) {
          if (!(result instanceof DecoderSuccess)) break;

          result = (await decoder.decode(result.value)) as DecoderResult<R>;
        }

        if (areDecoderErrors(result)) {
          return applyOptionsToDecoderErrors(
            childErrors(value, result),
            options
          );
        }

        return result;
      }
    );
  }

  return new Decoder<R, I>(
    (value): DecoderResult<R> => {
      const result = decoders.reduce(
        (prev, curr): DecoderResult<R> => {
          return (prev instanceof DecoderSuccess
            ? curr.decode(prev.value)
            : prev) as DecoderResult<R>;
        },
        ok(value as unknown) as DecoderResult<R>
      );

      if (areDecoderErrors(result)) {
        return applyOptionsToDecoderErrors(childErrors(value, result), options);
      }

      return result;
    }
  );
}
