import { Decoder, PromiseDecoder } from "./decoder.ts";
import { DecoderError, areDecoderErrors } from "./decoder_result.ts";
import { ok, errorLocation } from "./_util.ts";
import { IComposeDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";

const decoderName = "isObject";

export interface IObjectDecoderOptions extends IComposeDecoderOptions {
  noExcessProperties?: boolean;
}

export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IObjectDecoderOptions
): Decoder<T>;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IObjectDecoderOptions
): PromiseDecoder<T>;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IObjectDecoderOptions = {}
) {
  const hasPromiseDecoder = Object.values(decoderObject).some(
    decoder => decoder instanceof PromiseDecoder
  );

  if (hasPromiseDecoder) {
    if (options.allErrors) {
      return new PromiseDecoder(async input => {
        if (typeof input !== "object" || input === null) {
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
              const errors = result.map(error => childError(error, input, key));

              allErrors.push(...errors);
              return;
            }

            return [key, result.value] as [string, T];
          })
        );

        if (allErrors.length > 0) {
          return applyOptionsToDecoderErrors(allErrors, options);
        }

        return ok(Object.fromEntries(resolvedEntries as [string, T][]));
      });
    }

    return new PromiseDecoder(async input => {
      if (typeof input !== "object" || input === null) {
        return nonObjectError(input, options);
      }

      if (options.noExcessProperties) {
        const invalidKeys = checkInputKeys(decoderObject, input, options);

        if (invalidKeys) {
          return applyOptionsToDecoderErrors(invalidKeys, options);
        }
      }

      const entries = Object.entries<Decoder<T>>(decoderObject as any);
      const resultObj: { [key: string]: unknown } = {};

      for (const [key, decoder] of entries) {
        const value = (input as { [key: string]: unknown })[key];

        const result = await decoder.decode(value);

        if (areDecoderErrors(result)) {
          const errors = result.map(error => childError(error, input, key));

          return applyOptionsToDecoderErrors(errors, options);
        }

        resultObj[key] = result.value;
      }

      return ok(resultObj);
    });
  }

  return new Decoder(input => {
    if (typeof input !== "object" || input === null) {
      return nonObjectError(input, options);
    }

    const allErrors: DecoderError[] = [];

    if (options.noExcessProperties) {
      const invalidKeys = checkInputKeys(decoderObject, input, options);

      if (invalidKeys) {
        if (!options.allErrors) {
          return applyOptionsToDecoderErrors(invalidKeys, options);
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
        const errors = result.map(error => childError(error, input, key));

        if (options.allErrors) {
          allErrors.push(...errors);
          continue;
        }

        return applyOptionsToDecoderErrors(errors, options);
      }

      resultObj[key] = result.value;
    }

    if (allErrors.length > 0) {
      return applyOptionsToDecoderErrors(allErrors, options);
    }

    return ok(resultObj);
  });
}

function checkInputKeys<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  input: object,
  options: { allErrors?: boolean }
) {
  const expectedkeys = Object.keys(decoderObject);
  const actualkeys = Object.keys(input);

  if (options.allErrors) {
    const invalidKeys = actualkeys.filter(key => !expectedkeys.includes(key));

    const errors = invalidKeys.map(key => unknownKeyError(input, key));

    if (errors.length > 0) return errors;
  } else {
    const invalidKey = actualkeys.find(key => !expectedkeys.includes(key));

    if (invalidKey !== undefined) {
      return [unknownKeyError(input, invalidKey)];
    }
  }
}

/*
 * Error building functions
 */

function nonObjectError(input: unknown, options?: IObjectDecoderOptions) {
  return applyOptionsToDecoderErrors(
    [
      new DecoderError(input, "must be a non-null object", {
        decoderName
      })
    ],
    options
  );
}

function unknownKeyError(value: unknown, key: string) {
  return new DecoderError(value, `unknown key ["${key}"]`, {
    decoderName,
    location: errorLocation(key, ""),
    key
  });
}

function childError(child: DecoderError, value: object, key: string) {
  let message: string;
  let location: string | undefined;
  let errorKey: string | undefined = key;

  if (value.hasOwnProperty(key)) {
    location = errorLocation(key, child.location);
    message = `invalid value for key ["${key}"] > ${child.message}`;
  } else {
    message = `missing required key ["${key}"]`;
    location = undefined;
    errorKey = undefined;
  }

  return new DecoderError(value, message, {
    decoderName,
    child,
    location,
    key: errorKey
  });
}
