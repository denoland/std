import { Decoder, PromiseDecoder, DecoderReturnType } from './decoder.ts';
import { DecoderSuccess, DecoderError, DecoderResult, areDecoderErrors } from './decoder_result.ts';
import { ISimpleDecoderOptions, applyDecoderErrorOptions } from './helpers.ts';

const decoderName = 'isAnyOf';

export interface IAnyOfDecoderOptions extends ISimpleDecoderOptions {
  decodeInParallel?: boolean;
}

export function isAnyOf<T extends Decoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions,
): Decoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions,
): PromiseDecoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options: IAnyOfDecoderOptions = {},
) {
  const hasPromiseDecoder = decoders.some(
    decoder => decoder instanceof PromiseDecoder,
  );

  if (hasPromiseDecoder) {
    if (options.decodeInParallel) {
      return new PromiseDecoder<DecoderReturnType<T>>(async value => {
        const promises = decoders.map(
          async (decoder, index) =>
            [index, await decoder.decode(value)] as [
              number,
              DecoderResult<DecoderReturnType<T>>
            ],
        );

        const result = await raceToDecoderSuccess(promises);

        if (result instanceof DecoderSuccess) return result;

        return applyDecoderErrorOptions(buildErrors(value, result), options);
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

      return applyDecoderErrorOptions(buildErrors(value, errors), options);
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

    return applyDecoderErrorOptions(buildErrors(value, errors), options);
  });
}

async function raceToDecoderSuccess<T>(
  promises: Promise<[number, DecoderResult<T>]>[],
  errors: DecoderError[] = [],
): Promise<DecoderSuccess<T> | DecoderError[]> {
  if (promises.length === 0) return errors;

  const res = await Promise.race(promises);

  if (areDecoderErrors(res[1])) {
    promises.splice(res[0], 1);

    errors.push(...(res[1] as DecoderError[]));

    return raceToDecoderSuccess(promises, errors);
  }

  return res[1];
}

function buildErrors(value: unknown, children: DecoderError[]) {
  return children.map(
    child => new DecoderError(value, 'invalid value', { decoderName, child }),
  );
}
