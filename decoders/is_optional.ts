// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
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

export function isOptional<R, V>(
  decoder: Decoder<R, V>,
  options?: IsOptionalOptions
): Decoder<R | undefined, V>;
export function isOptional<R, V>(
  decoder: PromiseDecoder<R, V>,
  options?: IsOptionalOptions
): PromiseDecoder<R | undefined, V>;
export function isOptional<R, V>(
  decoder: Decoder<R, V> | PromiseDecoder<R, V>,
  options: IsOptionalOptions = {}
): Decoder<R | undefined, V> | PromiseDecoder<R | undefined, V> {
  if (decoder instanceof PromiseDecoder) {
    return new PromiseDecoder(
      async (value: V): Promise<DecoderResult<R | undefined>> => {
        let result: DecoderResult<R | undefined> = undefinedDecoder.decode(
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
    (value: V): DecoderResult<R | undefined> => {
      let result: DecoderResult<R | undefined> = undefinedDecoder.decode(value);

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
