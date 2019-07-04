import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError, areDecoderErrors } from './decoder_result.ts';
import { ok, buildErrorLocationString } from './_util.ts';
import { IComposeDecoderOptions, applyDecoderErrorOptions } from './helpers.ts';

const decoderName = 'isObject';

export interface IObjectDecoderOptions extends IComposeDecoderOptions {
  noExcessProperties?: boolean;
}

export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IObjectDecoderOptions,
): Decoder<T>;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IObjectDecoderOptions,
): PromiseDecoder<T>;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IObjectDecoderOptions = {},
) {
  const hasPromiseDecoder = Object.values(decoderObject).some(
    decoder => decoder instanceof PromiseDecoder,
  );

  if (hasPromiseDecoder) {
    if (options.allErrors) {
      return new PromiseDecoder(async input => {
        if (typeof input !== 'object' || input === null) {
          return nonObjectError(input, options);
        }

        const allErrors: DecoderError[] = [];

        if (options.noExcessProperties) {
          const invalidKeys = checkInputKeys(decoderObject, input, options);

          if (invalidKeys) {
            allErrors.push(...invalidKeys);
          }
        }

        const entries = Object.entries<Decoder<T>>(decoderObject as any);

        const resolvedEntries = await Promise.all(
          entries.map(async ([key, decoder]) => {
            const value = (input as { [key: string]: unknown })[key];

            const result = await decoder.decode(value);

            if (areDecoderErrors(result)) {
              const errors = result.map(error =>
                buildChildError(error, input, key),
              );

              allErrors.push(...errors);
              return;
            }

            return [key, result.value] as [string, T];
          }),
        );

        if (allErrors.length > 0) {
          return applyDecoderErrorOptions(allErrors, options);
        }

        return ok(Object.fromEntries(resolvedEntries as [string, T][]));
      });
    }

    return new PromiseDecoder(async input => {
      if (typeof input !== 'object' || input === null) {
        return nonObjectError(input, options);
      }

      if (options.noExcessProperties) {
        const invalidKeys = checkInputKeys(decoderObject, input, options);

        if (invalidKeys) {
          return applyDecoderErrorOptions(invalidKeys, options);
        }
      }

      const entries = Object.entries<Decoder<T>>(decoderObject as any);
      const resultObj: { [key: string]: unknown } = {};

      for (const [key, decoder] of entries) {
        const value = (input as { [key: string]: unknown })[key];

        const result = await decoder.decode(value);

        if (areDecoderErrors(result)) {
          const errors = result.map(error =>
            buildChildError(error, input, key),
          );

          return applyDecoderErrorOptions(errors, options);
        }

        resultObj[key] = result.value;
      }

      return ok(resultObj);
    });
  }

  return new Decoder(input => {
    if (typeof input !== 'object' || input === null) {
      return nonObjectError(input, options);
    }

    const allErrors: DecoderError[] = [];

    if (options.noExcessProperties) {
      const invalidKeys = checkInputKeys(decoderObject, input, options);

      if (invalidKeys) {
        if (!options.allErrors) {
          return applyDecoderErrorOptions(invalidKeys, options);
        }

        allErrors.push(...invalidKeys);
      }
    }

    const entries = Object.entries<Decoder<T>>(decoderObject as any);
    const resultObj: { [key: string]: unknown } = {};

    for (const [key, decoder] of entries) {
      const value = (input as { [key: string]: unknown })[key];

      const result = decoder.decode(value);

      if (areDecoderErrors(result)) {
        const errors = result.map(error => buildChildError(error, input, key));

        if (options.allErrors) {
          allErrors.push(...errors);
          continue;
        }

        return applyDecoderErrorOptions(errors, options);
      }

      resultObj[key] = result.value;
    }

    if (allErrors.length > 0) {
      return applyDecoderErrorOptions(allErrors, options);
    }

    return ok(resultObj);
  });
}

function checkInputKeys<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  input: object,
  options: { allErrors?: boolean },
) {
  const expectedkeys = Object.keys(decoderObject);
  const actualkeys = Object.keys(input);

  if (options.allErrors) {
    const invalidKeys = actualkeys.filter(key => !expectedkeys.includes(key));

    const errors = invalidKeys.map(key => buildKeyError(input, key));

    if (errors.length > 0) return errors;
  } else {
    const invalidKey = actualkeys.find(key => !expectedkeys.includes(key));

    if (invalidKey !== undefined) {
      return [buildKeyError(input, invalidKey)];
    }
  }
}

/*
 * Error building functions
 */

function nonObjectError(input: unknown, options?: IObjectDecoderOptions) {
  return applyDecoderErrorOptions(
    [
      new DecoderError(input, 'must be a non-null object', {
        decoderName,
      }),
    ],
    options,
  );
}

function buildChildError(child: DecoderError, value: object, key: string) {
  let location: string;
  let message: string;
  let errorKey: string | undefined = key;

  if (value.hasOwnProperty(key)) {
    location = buildErrorLocationString(key, child.location);
    message = `invalid value for key ["${key}"] > ${child.message}`;
  }
  else {
    location = child.location;
    message = `missing key ["${key}"]`;
    errorKey = undefined;
  }

  return new DecoderError(value, message, {
    decoderName,
    child,
    location,
    key: errorKey,
  });
}

function buildKeyError(value: unknown, key: string) {
  const keyName = typeof key === 'string' ? `"${key}"` : key;

  return new DecoderError(value, `unknown key [${keyName}]`, {
    decoderName,
    key,
  });
}
