// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isExactly } from "./is_exactly.ts";
import { SimpleDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";
import {
  DecoderError,
  isDecoderSuccess,
  DecoderResult
} from "./decoder_result.ts";

const decoderName = "isMaybe";
const undefinedDecoder = isExactly(undefined);
const nullDecoder = isExactly(null);

export type IsMaybeOptions = SimpleDecoderOptions;

export function isMaybe<T>(
  decoder: Decoder<T>,
  options?: IsMaybeOptions
): Decoder<T | null | undefined>;
export function isMaybe<T>(
  decoder: PromiseDecoder<T>,
  options?: IsMaybeOptions
): PromiseDecoder<T | null | undefined>;
export function isMaybe<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IsMaybeOptions = {}
): Decoder<T | null | undefined> | PromiseDecoder<T | null | undefined> {
  if (decoder instanceof PromiseDecoder) {
    return new PromiseDecoder(
      async (value): Promise<DecoderResult<T | null | undefined>> => {
        let result: DecoderResult<
          T | null | undefined
        > = undefinedDecoder.decode(value);

        if (isDecoderSuccess(result)) return result;

        result = nullDecoder.decode(value);

        if (isDecoderSuccess(result)) return result;

        result = await decoder.decode(value);

        if (isDecoderSuccess(result)) return result;

        return applyOptionsToDecoderErrors(
          result.map(
            (error): DecoderError =>
              new DecoderError(
                value,
                `${error.message} OR must be null OR must be undefined`,
                {
                  child: error,
                  decoderName
                }
              )
          ),
          options
        );
      }
    );
  }

  return new Decoder(
    (value): DecoderResult<T | null | undefined> => {
      let result: DecoderResult<T | null | undefined> = undefinedDecoder.decode(
        value
      );

      if (isDecoderSuccess(result)) return result;

      result = nullDecoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      result = decoder.decode(value);

      if (isDecoderSuccess(result)) return result;

      return applyOptionsToDecoderErrors(
        result.map(
          (error): DecoderError =>
            new DecoderError(
              value,
              `${error.message} OR must be null OR must be undefined`,
              {
                child: error,
                decoderName
              }
            )
        ),
        options
      );
    }
  );
}
