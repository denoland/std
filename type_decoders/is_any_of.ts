// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder, PromiseDecoder, DecoderReturnType } from "./decoder.ts";
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult
} from "./decoder_result.ts";
import {
  SimpleDecoderOptions,
  applyOptionsToDecoderErrors,
  raceToDecoderSuccess
} from "./util.ts";

const decoderName = "isAnyOf";

function childErrors(value: unknown, children: DecoderError[]): DecoderError[] {
  return children.map(
    (child): DecoderError =>
      new DecoderError(value, "invalid value", { decoderName, child })
  );
}

export interface IsAnyOfOptions extends SimpleDecoderOptions {
  decodeInParallel?: boolean;
}

export function isAnyOf<T extends Decoder<unknown>>(
  decoders: T[],
  options?: IsAnyOfOptions
): Decoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options?: IsAnyOfOptions
): PromiseDecoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options: IsAnyOfOptions = {}
): Decoder<DecoderReturnType<T>> | PromiseDecoder<DecoderReturnType<T>> {
  const hasPromiseDecoder = decoders.some(
    (decoder): boolean => decoder instanceof PromiseDecoder
  );

  if (hasPromiseDecoder) {
    if (options.decodeInParallel) {
      return new PromiseDecoder<DecoderReturnType<T>>(
        async (value): Promise<DecoderResult<DecoderReturnType<T>>> => {
          const promises = decoders.map(
            async (decoder): Promise<DecoderResult<DecoderReturnType<T>>> =>
              (await decoder.decode(value)) as DecoderResult<
                DecoderReturnType<T>
              >
          );

          const result = await raceToDecoderSuccess(promises);

          if (result instanceof DecoderSuccess) return result;

          return applyOptionsToDecoderErrors(
            childErrors(value, result),
            options
          );
        }
      );
    }

    return new PromiseDecoder<DecoderReturnType<T>>(
      async (value): Promise<DecoderResult<DecoderReturnType<T>>> => {
        const errors: DecoderError[] = [];

        for (const decoder of decoders) {
          const result = (await decoder.decode(value)) as DecoderResult<
            DecoderReturnType<T>
          >;

          if (result instanceof DecoderSuccess) return result;

          errors.push(...result);
        }

        return applyOptionsToDecoderErrors(childErrors(value, errors), options);
      }
    );
  }

  return new Decoder<DecoderReturnType<T>>(
    (value): DecoderResult<DecoderReturnType<T>> => {
      const errors: DecoderError[] = [];

      for (const decoder of decoders) {
        const result = decoder.decode(value) as DecoderResult<
          DecoderReturnType<T>
        >;

        if (result instanceof DecoderSuccess) return result;

        errors.push(...result);
      }

      return applyOptionsToDecoderErrors(childErrors(value, errors), options);
    }
  );
}
