import { Decoder, PromiseDecoder, DecoderReturnType } from "./decoder.ts";
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult
} from "./decoder_result.ts";
import {
  ISimpleDecoderOptions,
  applyOptionsToDecoderErrors,
  raceToDecoderSuccess
} from "./util.ts";

const decoderName = "isAnyOf";

export interface IAnyOfDecoderOptions extends ISimpleDecoderOptions {
  decodeInParallel?: boolean;
}

export function isAnyOf<T extends Decoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions
): Decoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions
): PromiseDecoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options: IAnyOfDecoderOptions = {}
) {
  const hasPromiseDecoder = decoders.some(
    decoder => decoder instanceof PromiseDecoder
  );

  if (hasPromiseDecoder) {
    if (options.decodeInParallel) {
      return new PromiseDecoder<DecoderReturnType<T>>(async value => {
        const promises = decoders.map(
          async decoder =>
            (await decoder.decode(value)) as DecoderResult<DecoderReturnType<T>>
        );

        const result = await raceToDecoderSuccess(promises);

        if (result instanceof DecoderSuccess) return result;

        return applyOptionsToDecoderErrors(childErrors(value, result), options);
      });
    }

    return new PromiseDecoder<DecoderReturnType<T>>(async value => {
      const errors: DecoderError[] = [];

      for (const decoder of decoders) {
        const result = (await decoder.decode(value)) as DecoderResult<
          DecoderReturnType<T>
        >;

        if (result instanceof DecoderSuccess) return result;

        errors.push(...result);
      }

      return applyOptionsToDecoderErrors(childErrors(value, errors), options);
    });
  }

  return new Decoder<DecoderReturnType<T>>(value => {
    const errors: DecoderError[] = [];

    for (const decoder of decoders) {
      const result = decoder.decode(value) as DecoderResult<
        DecoderReturnType<T>
      >;

      if (result instanceof DecoderSuccess) return result;

      errors.push(...result);
    }

    return applyOptionsToDecoderErrors(childErrors(value, errors), options);
  });
}

function childErrors(value: unknown, children: DecoderError[]) {
  return children.map(
    child => new DecoderError(value, "invalid value", { decoderName, child })
  );
}
