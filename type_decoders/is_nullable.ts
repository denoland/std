import { Decoder, PromiseDecoder } from './decoder.ts';
import { isExactly } from './is_exactly.ts';
import { SimpleDecoderOptions, applyOptionsToDecoderErrors } from './util.ts';
import {
  isDecoderSuccess,
  DecoderError,
  DecoderResult,
} from './decoder_result.ts';

const decoderName = 'isNullable';
const nullDecoder = isExactly(null);

export type IsNullableOptions = SimpleDecoderOptions;

export function isNullable<T>(
  decoder: Decoder<T>,
  options?: IsNullableOptions,
): Decoder<T | null>;
export function isNullable<T>(
  decoder: PromiseDecoder<T>,
  options?: IsNullableOptions,
): PromiseDecoder<T | null>;
export function isNullable<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IsNullableOptions = {},
): Decoder<T | null> | PromiseDecoder<T | null> {
  if (decoder instanceof PromiseDecoder) {
    return new PromiseDecoder(
      async (value): Promise<DecoderResult<T | null>> => {
        let result: DecoderResult<T | null> = nullDecoder.decode(value);

        if (isDecoderSuccess(result)) return result;

        result = await decoder.decode(value);

        if (isDecoderSuccess(result)) return result;

        return applyOptionsToDecoderErrors(
          result.map(
            (error): DecoderError =>
              new DecoderError(value, `${error.message} OR must be null`, {
                child: error,
                decoderName,
              }),
          ),
          options,
        );
      },
    );
  }

  return new Decoder(
    (value): DecoderResult<T | null> => {
      let result: DecoderResult<T | null> = nullDecoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      result = decoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      return applyOptionsToDecoderErrors(
        result.map(
          (error): DecoderError =>
            new DecoderError(value, `${error.message} OR must be null`, {
              child: error,
              decoderName,
            }),
        ),
        options,
      );
    },
  );
}
