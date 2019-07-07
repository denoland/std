import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isExactly } from "./is_exactly.ts";
import { SimpleDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";
import {
  isDecoderSuccess,
  DecoderError,
  DecoderResult
} from "./decoder_result.ts";

const decoderName = "isOptional";
const undefinedDecoder = isExactly(undefined);

export type IsOptionalOptions = SimpleDecoderOptions;

export function isOptional<T>(
  decoder: Decoder<T>,
  options?: IsOptionalOptions
): Decoder<T | undefined>;
export function isOptional<T>(
  decoder: PromiseDecoder<T>,
  options?: IsOptionalOptions
): PromiseDecoder<T | undefined>;
export function isOptional<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IsOptionalOptions = {}
): Decoder<T | undefined> | PromiseDecoder<T | undefined> {
  if (decoder instanceof PromiseDecoder) {
    return new PromiseDecoder(
      async (value): Promise<DecoderResult<T | undefined>> => {
        let result: DecoderResult<T | undefined> = undefinedDecoder.decode(
          value
        );

        if (isDecoderSuccess(result)) return result;

        result = await decoder.decode(value);

        if (isDecoderSuccess(result)) return result;

        return applyOptionsToDecoderErrors(
          result.map(
            (error): DecoderError =>
              new DecoderError(value, `${error.message} OR must be undefined`, {
                child: error,
                decoderName
              })
          ),
          options
        );
      }
    );
  }

  return new Decoder(
    (value): DecoderResult<T | undefined> => {
      let result: DecoderResult<T | undefined> = undefinedDecoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      result = decoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      return applyOptionsToDecoderErrors(
        result.map(
          (error): DecoderError =>
            new DecoderError(value, `${error.message} OR must be undefined`, {
              child: error,
              decoderName
            })
        ),
        options
      );
    }
  );
}
