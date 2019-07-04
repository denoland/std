import { Decoder, PromiseDecoder } from "./decoder.ts";
import { ok, buildErrorLocationString, err } from "./_util.ts";
import {
  DecoderError,
  DecoderSuccess,
  areDecoderErrors
} from "./decoder_result.ts";
import {
  IComposeDecoderOptions,
  applyOptionsToDecoderErrors
} from "./helpers.ts";

const decoderName = "isTuple";

export interface ITupleDecoderOptions extends IComposeDecoderOptions {}

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> },
  options?: ITupleDecoderOptions
): Decoder<R>;

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> | PromiseDecoder<R[P]> },
  options?: ITupleDecoderOptions
): PromiseDecoder<R>;

export function isTuple<R extends [unknown, ...unknown[]]>(
  decoders: { [P in keyof R]: Decoder<R[P]> | PromiseDecoder<R[P]> },
  options: ITupleDecoderOptions = {}
) {
  const hasPromiseDecoder = decoders.some(
    decoder => decoder instanceof PromiseDecoder
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
          })
        );

        if (hasError || input.length !== decoders.length) {
          const errors = (results.filter(result =>
            areDecoderErrors(result)
          ) as DecoderError[][]).flat();

          if (input.length !== decoders.length) {
            errors.push(...invalidLengthError(decoders.length, input));
          }

          return applyOptionsToDecoderErrors(errors, options);
        }

        return ok(
          (results as DecoderSuccess<unknown>[]).map(result => result.value)
        );
      });
    }

    return new PromiseDecoder(async input => {
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
          const errors = result.map(error =>
            buildChildError(error, input, index)
          );

          return applyOptionsToDecoderErrors(errors, options);
        }

        tuple.push(result.value);
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
        const errors = result.map(error =>
          buildChildError(error, input, index)
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

    return ok(tuple);
  });
}

function nonArrayError(
  input: unknown,
  options: ITupleDecoderOptions | undefined
) {
  return err(input, "must be an array", decoderName, options);
}

function invalidLengthError(length: number, input: unknown) {
  return [
    new DecoderError(input, `array must have length ${length}`, {
      decoderName
    })
  ];
}

function buildChildError(child: DecoderError, value: unknown, key: number) {
  const location = buildErrorLocationString(key, child.location);

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
