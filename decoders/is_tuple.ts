// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder, PromiseDecoder } from "./decoder.ts";
import { ok, errorLocation, err } from "./_util.ts";
import {
  DecoderError,
  DecoderSuccess,
  areDecoderErrors,
  DecoderResult
} from "./decoder_result.ts";
import { ComposeDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";

const decoderName = "isTuple";

function nonArrayError(
  input: unknown,
  options: IsTupleOptions | undefined
): DecoderError[] {
  return err(input, "must be an array", decoderName, options);
}

function invalidLengthError(length: number, input: unknown): DecoderError[] {
  return [
    new DecoderError(input, `array must have length ${length}`, {
      decoderName
    })
  ];
}

function childError(
  child: DecoderError,
  value: unknown,
  key: number
): DecoderError {
  const location = errorLocation(key, child.location);

  return new DecoderError(
    value,
    `invalid element [${key}] > ${child.message}`,
    {
      decoderName,
      child,
      location,
      key
    }
  );
}

export type IsTupleOptions = ComposeDecoderOptions;

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> },
  options?: IsTupleOptions
): Decoder<R>;

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> | PromiseDecoder<R[P]> },
  options?: IsTupleOptions
): PromiseDecoder<R>;

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> | PromiseDecoder<R[P]> },
  options: IsTupleOptions = {}
): Decoder<R> | PromiseDecoder<R> {
  const hasPromiseDecoder = decoders.some(
    (decoder): boolean => decoder instanceof PromiseDecoder
  );

  if (hasPromiseDecoder) {
    if (options.allErrors) {
      return new PromiseDecoder(
        async (input): Promise<DecoderResult<R>> => {
          if (!Array.isArray(input)) {
            return nonArrayError(input, options);
          }

          let hasError = false;

          const results = await Promise.all(
            decoders.map(
              async (decoder, index): Promise<DecoderResult<unknown>> => {
                const result = await decoder.decode(input[index]);

                if (areDecoderErrors(result)) {
                  hasError = true;
                  return result.map(
                    (error): DecoderError => childError(error, input, index)
                  );
                }

                return result;
              }
            )
          );

          if (hasError || input.length !== decoders.length) {
            const errors = (results.filter(
              (result): boolean => areDecoderErrors(result)
            ) as DecoderError[][]).flat();

            if (input.length !== decoders.length) {
              errors.push(...invalidLengthError(decoders.length, input));
            }

            return applyOptionsToDecoderErrors(errors, options);
          }

          return ok(
            (results as Array<DecoderSuccess<unknown>>).map(
              (result): unknown => result.value
            )
          ) as DecoderSuccess<R>;
        }
      );
    }

    return new PromiseDecoder(
      async (input): Promise<DecoderResult<R>> => {
        if (!Array.isArray(input)) {
          return nonArrayError(input, options);
        } else if (input.length !== decoders.length) {
          return applyOptionsToDecoderErrors(
            invalidLengthError(decoders.length, input),
            options
          );
        }

        const tuple: unknown[] = [];
        let index = -1;

        for (const decoder of decoders) {
          index++;

          const result = await decoder.decode(input[index]);

          if (areDecoderErrors(result)) {
            const errors = result.map(
              (error): DecoderError => childError(error, input, index)
            );

            return applyOptionsToDecoderErrors(errors, options);
          }

          tuple.push(result.value);
        }

        return ok(tuple) as DecoderSuccess<R>;
      }
    );
  }

  return new Decoder(
    (input): DecoderResult<R> => {
      if (!Array.isArray(input)) {
        return nonArrayError(input, options);
      }

      const tuple: unknown[] = [];
      const allErrors: DecoderError[] = [];
      let index = -1;

      if (input.length !== decoders.length) {
        if (!options.allErrors) {
          return applyOptionsToDecoderErrors(
            invalidLengthError(decoders.length, input),
            options
          );
        }

        allErrors.push(...invalidLengthError(decoders.length, input));
      }

      for (const decoder of decoders) {
        index++;

        const result = (decoder as Decoder<unknown, unknown>).decode(
          input[index]
        );

        if (areDecoderErrors(result)) {
          const errors = result.map(
            (error): DecoderError => childError(error, input, index)
          );

          if (options.allErrors) {
            allErrors.push(...errors);
            continue;
          }

          return applyOptionsToDecoderErrors(errors, options);
        }

        tuple.push(result.value);
      }

      if (allErrors.length > 0)
        return applyOptionsToDecoderErrors(allErrors, options);

      return ok(tuple) as DecoderSuccess<R>;
    }
  );
}
