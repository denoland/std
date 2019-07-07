// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder, PromiseDecoder } from "./decoder.ts";
import {
  DecoderError,
  areDecoderErrors,
  DecoderResult
} from "./decoder_result.ts";
import { ok, errorLocation } from "./_util.ts";
import { ComposeDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";

const decoderName = "isObject";

function nonObjectError(
  input: unknown,
  options?: IsObjectOptions
): DecoderError[] {
  return applyOptionsToDecoderErrors(
    [
      new DecoderError(input, "must be a non-null object", {
        decoderName
      })
    ],
    options
  );
}

function unknownKeyError(value: unknown, key: string): DecoderError {
  return new DecoderError(value, `unknown key ["${key}"]`, {
    decoderName,
    location: errorLocation(key, ""),
    key
  });
}

function childError(
  child: DecoderError,
  value: object,
  key: string
): DecoderError {
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

function checkInputKeys<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  input: object,
  options: { allErrors?: boolean }
): DecoderError[] | undefined {
  const expectedkeys = Object.keys(decoderObject);
  const actualkeys = Object.keys(input);

  if (options.allErrors) {
    const invalidKeys = actualkeys.filter(
      (key): boolean => !expectedkeys.includes(key)
    );

    const errors = invalidKeys.map(
      (key): DecoderError => unknownKeyError(input, key)
    );

    if (errors.length > 0) return errors;
  } else {
    const invalidKey = actualkeys.find(
      (key): boolean => !expectedkeys.includes(key)
    );

    if (invalidKey !== undefined) {
      return [unknownKeyError(input, invalidKey)];
    }
  }
}

export interface IsObjectOptions extends ComposeDecoderOptions {
  noExcessProperties?: boolean;
}

export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IsObjectOptions
): Decoder<T>;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IsObjectOptions
): PromiseDecoder<T>;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IsObjectOptions = {}
): Decoder<T> | PromiseDecoder<T> {
  const hasPromiseDecoder = Object.values(decoderObject).some(
    (decoder): boolean => decoder instanceof PromiseDecoder
  );

  if (hasPromiseDecoder) {
    if (options.allErrors) {
      return new PromiseDecoder(
        async (input): Promise<DecoderResult<T>> => {
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

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entries: Array<[string, Decoder<any>]> = Object.entries(
            decoderObject
          );

          const resolvedEntries = await Promise.all(
            entries.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              async ([key, decoder]): Promise<[string, any] | undefined> => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const value = (input as { [key: string]: any })[key];

                const result = await decoder.decode(value);

                if (areDecoderErrors(result)) {
                  const errors = result.map(
                    (error): DecoderError => childError(error, input, key)
                  );

                  allErrors.push(...errors);
                  return;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return [key, result.value] as [string, any];
              }
            )
          );

          if (allErrors.length > 0) {
            return applyOptionsToDecoderErrors(allErrors, options);
          }

          return ok(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.fromEntries(resolvedEntries as Array<[string, any]>)
          );
        }
      );
    }

    return new PromiseDecoder(
      async (input): Promise<DecoderResult<T>> => {
        if (typeof input !== "object" || input === null) {
          return nonObjectError(input, options);
        }

        if (options.noExcessProperties) {
          const invalidKeys = checkInputKeys(decoderObject, input, options);

          if (invalidKeys) {
            return applyOptionsToDecoderErrors(invalidKeys, options);
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entries: Array<[string, Decoder<any>]> = Object.entries(
          decoderObject
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resultObj: { [key: string]: any } = {};

        for (const [key, decoder] of entries) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const value = (input as { [key: string]: any })[key];

          const result = await decoder.decode(value);

          if (areDecoderErrors(result)) {
            const errors = result.map(
              (error): DecoderError => childError(error, input, key)
            );

            return applyOptionsToDecoderErrors(errors, options);
          }

          resultObj[key] = result.value;
        }

        return ok(resultObj) as DecoderResult<T>;
      }
    );
  }

  return new Decoder(
    (input): DecoderResult<T> => {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Array<[string, Decoder<any>]> = Object.entries(
        decoderObject
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultObj: { [key: string]: any } = {};

      for (const [key, decoder] of entries) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (input as { [key: string]: any })[key];

        const result = decoder.decode(value);

        if (areDecoderErrors(result)) {
          const errors = result.map(
            (error): DecoderError => childError(error, input, key)
          );

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

      return ok(resultObj) as DecoderResult<T>;
    }
  );
}
