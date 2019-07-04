import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError, DecoderResult, DecoderSuccess, areDecoderErrors } from './decoder_result.ts';
import { ok, buildErrorLocationString } from './_util.ts';
import { IComposeDecoderOptions, applyDecoderErrorOptions } from './helpers.ts';

const decoderName = 'isArray';

export interface IArrayDecoderOptions extends IComposeDecoderOptions {}

export function isArray<R = unknown, V = unknown>(
  options?: IArrayDecoderOptions,
): Decoder<R[], V>;

export function isArray<R, V = unknown>(
  decoder: Decoder<R, V>,
  options?: IArrayDecoderOptions,
): Decoder<R[], V>;

export function isArray<R, V = unknown>(
  decoder: PromiseDecoder<R, V>,
  options?: IArrayDecoderOptions,
): PromiseDecoder<R[], V>;

export function isArray<R, V = unknown>(
  decoder?: Decoder<R, V> | PromiseDecoder<R, V> | IArrayDecoderOptions,
  options: IArrayDecoderOptions = {},
) {
  if (!(decoder instanceof Decoder || decoder instanceof PromiseDecoder)) {
    return new Decoder<R[], V>((input: V) =>
      Array.isArray(input)
        ? ok<R[]>(input.slice())
        : nonArrayError(input, options),
    );
  }
  if (decoder instanceof PromiseDecoder) {
    if (options.allErrors) {
      return new PromiseDecoder(async (input: V) => {
        if (!Array.isArray(input)) return nonArrayError(input, options);

        let hasError = false;

        const results = await Promise.all(
          input.map(async item => {
            const result = await decoder.decode(item);

            if (!hasError && areDecoderErrors(result)) {
              hasError = true;
            }

            return result;
          }),
        );

        if (hasError) {
          const errors: DecoderError[] = [];

          results.forEach((result, index) => {
            if (Array.isArray(result)) {
              errors.push(
                ...result.map(error => buildChildError(error, input, index)),
              );
            }
          });

          return applyDecoderErrorOptions(errors, options);
        }

        const elements = results.map(
          result => (result as DecoderSuccess<R>).value,
        );

        return ok(elements);
      });
    }

    return new PromiseDecoder(async (input: V) => {
      if (!Array.isArray(input)) return nonArrayError(input, options);

      const elements: R[] = [];
      let index = 0;

      for (const el of input) {
        const result = await decoder.decode(el);

        const errors = handleDecoderResult(result, input, index, elements);
        index++;

        if (errors) {
          return applyDecoderErrorOptions(errors, options);
        }
      }

      return ok(elements);
    });
  }

  return new Decoder((input: V) => {
    if (!Array.isArray(input)) return nonArrayError(input, options);

    const elements: R[] = [];
    let index = 0;

    const allErrors: DecoderError[] = [];

    for (const el of input) {
      const result = decoder.decode(el);

      const errors = handleDecoderResult(result, input, index, elements);
      index++;

      if (errors) {
        if (!options.allErrors) {
          return applyDecoderErrorOptions(errors, options);
        }

        allErrors.push(...errors);
      }
    }

    if (allErrors.length > 0)
      return applyDecoderErrorOptions(allErrors, options);

    return ok(elements);
  });
}

function nonArrayError(value: unknown, options: IArrayDecoderOptions = {}) {
  return applyDecoderErrorOptions(
    [
      new DecoderError(value, 'must be an array', {
        decoderName,
      }),
    ],
    options,
  );
}

function handleDecoderResult<T>(
  result: DecoderResult<T>,
  input: object,
  key: number,
  resultObj: T[],
) {
  if (areDecoderErrors(result)) {
    return result.map(error => buildChildError(error, input, key));
  }

  // store the valid value on the result object
  resultObj.push(result.value);
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
