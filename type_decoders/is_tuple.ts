import { Decoder, PromiseDecoder } from './decoder.ts';
import { ok, buildErrorLocationString, err } from './_util.ts';
import { DecoderError, DecoderSuccess, areDecoderErrors } from './decoder_result.ts';
import { IComposeDecoderOptions, applyDecoderErrorOptions } from './helpers.ts';

const decoderName = 'isTuple';

export interface ITupleDecoderOptions extends IComposeDecoderOptions {}

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> },
  options?: ITupleDecoderOptions,
): Decoder<R>;

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> | PromiseDecoder<R[P]> },
  options?: ITupleDecoderOptions,
): PromiseDecoder<R>;

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> | PromiseDecoder<R[P]> },
  options: ITupleDecoderOptions = {},
) {
  const hasPromiseDecoder = decoders.some(
    decoder => decoder instanceof PromiseDecoder,
  );

  if (hasPromiseDecoder) {
    if (options.allErrors) {
      return new PromiseDecoder(async input => {
        if (!Array.isArray(input)) {
          return nonArrayError(input, options);
        }

        let hasError = false;

        const results = await Promise.all(
          decoders.map(async (decoder, index) => {
            const result = await decoder.decode(input[index]);

            if (areDecoderErrors(result)) {
              hasError = true;
              return result.map(error => buildChildError(error, input, index));
            }

            return result;
          }),
        );

        if (hasError) {
          const errors = (results.filter(result =>
            areDecoderErrors(result),
          ) as DecoderError[][]).flat();

          return applyDecoderErrorOptions(errors, options);
        }

        return ok(
          (results as DecoderSuccess<unknown>[]).map(result => result.value),
        );
      });
    }

    return new PromiseDecoder(async input => {
      if (!Array.isArray(input)) {
        return nonArrayError(input, options);
      }

      const tuple: unknown[] = [];
      let index = 0;

      for (const decoder of decoders) {
        const result = await decoder.decode(input[index]);

        if (areDecoderErrors(result)) {
          const errors = result.map(error =>
            buildChildError(error, input, index),
          );

          return applyDecoderErrorOptions(errors, options);
        }

        tuple.push(result.value);
        index++;
      }

      return ok(tuple);
    });
  }

  return new Decoder(input => {
    if (!Array.isArray(input)) {
      return nonArrayError(input, options);
    }

    const tuple: unknown[] = [];
    const allErrors: DecoderError[] = [];
    let index = 0;

    for (const decoder of decoders) {
      const result = (decoder as Decoder<unknown, unknown>).decode(
        input[index],
      );

      if (areDecoderErrors(result)) {
        const errors = result.map(error =>
          buildChildError(error, input, index),
        );

        if (options.allErrors) {
          allErrors.push(...errors);
          continue;
        }

        return applyDecoderErrorOptions(errors, options);
      }

      tuple.push(result.value);
      index++;
    }

    if (allErrors.length > 0)
      return applyDecoderErrorOptions(allErrors, options);

    return ok(tuple);
  });
}

function nonArrayError(
  input: unknown,
  options: ITupleDecoderOptions | undefined,
) {
  return err(input, 'must be an array', decoderName, options);
}

function buildChildError(child: DecoderError, value: unknown, key: number) {
  const location = buildErrorLocationString(key, child.location);

  return new DecoderError(
    value,
    `invalid array element [${key}] > ${child.message}`,
    {
      decoderName,
      child,
      location,
      key,
    },
  );
}
