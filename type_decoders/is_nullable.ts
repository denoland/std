// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isExactly } from "./is_exactly.ts";
import { SimpleDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";
import {
  isDecoderSuccess,
  DecoderError,
  DecoderResult
} from "./decoder_result.ts";

const decoderName = "isNullable";
const nullDecoder = isExactly(null);

export type IsNullableOptions = SimpleDecoderOptions;

export function isNullable<R, I>(
  decoder: Decoder<R, I>,
  options?: IsNullableOptions
): Decoder<R | null, I>;
export function isNullable<R, I>(
  decoder: PromiseDecoder<R, I>,
  options?: IsNullableOptions
): PromiseDecoder<R | null, I>;
export function isNullable<R, I>(
  decoder: Decoder<R, I> | PromiseDecoder<R, I>,
  options: IsNullableOptions = {}
): Decoder<R | null, I> | PromiseDecoder<R | null, I> {
  if (decoder instanceof PromiseDecoder) {
    return new PromiseDecoder(
      async (value: I): Promise<DecoderResult<R | null>> => {
        let result: DecoderResult<R | null> = nullDecoder.decode(value);

        if (isDecoderSuccess(result)) return result;

        result = await decoder.decode(value);

        if (isDecoderSuccess(result)) return result;

        return applyOptionsToDecoderErrors(
          result.map(
            (error): DecoderError =>
              new DecoderError(value, `${error.message} OR must be null`, {
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
    (value: I): DecoderResult<R | null> => {
      let result: DecoderResult<R | null> = nullDecoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      result = decoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      return applyOptionsToDecoderErrors(
        result.map(
          (error): DecoderError =>
            new DecoderError(value, `${error.message} OR must be null`, {
              child: error,
              decoderName
            })
        ),
        options
      );
    }
  );
}
