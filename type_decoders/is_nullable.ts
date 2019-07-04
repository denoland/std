import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isExactly } from "./is_exactly.ts";
import {
  ISimpleDecoderOptions,
  applyOptionsToDecoderErrors
} from "./helpers.ts";
import { isDecoderSuccess, DecoderError } from "./decoder_result.ts";

const decoderName = "isNullable";
const nullDecoder = isExactly(null);

export interface INullableDecoderOptions extends ISimpleDecoderOptions {}

export function isNullable<T>(
  decoder: Decoder<T>,
  options?: INullableDecoderOptions
): Decoder<T | null>;
export function isNullable<T>(
  decoder: PromiseDecoder<T>,
  options?: INullableDecoderOptions
): PromiseDecoder<T | null>;
export function isNullable<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: INullableDecoderOptions = {}
) {
  if (decoder instanceof PromiseDecoder) {
    return new PromiseDecoder(async value => {
      let result = nullDecoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      result = await decoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      return applyOptionsToDecoderErrors(
        result.map(
          error =>
            new DecoderError(value, `${error.message} OR must be null`, {
              child: error,
              decoderName
            })
        ),
        options
      );
    });
  }

  return new Decoder(value => {
    let result = nullDecoder.decode(value);

    if (isDecoderSuccess(result)) return result;

    result = decoder.decode(value);

    if (isDecoderSuccess(result)) return result;

    return applyOptionsToDecoderErrors(
      result.map(
        error =>
          new DecoderError(value, `${error.message} OR must be null`, {
            child: error,
            decoderName
          })
      ),
      options
    );
  });
}
