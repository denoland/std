import { Decoder, PromiseDecoder } from "./decoder.ts";
import {
  DecoderError,
  areDecoderErrors,
  DecoderResult
} from "./decoder_result.ts";
import { ok, errorLocation } from "./_util.ts";
import { ComposeDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";

const decoderName = "isDictionary";

function childKeyError(
  input: unknown,
  child: DecoderError,
  key: string
): DecoderError {
  const location = errorLocation(key, "");

  return new DecoderError(input, `invalid key ["${key}"] > ${child.message}`, {
    decoderName,
    child,
    location,
    key
  });
}

function childValueError(
  child: DecoderError,
  value: unknown,
  key: string
): DecoderError {
  const location = errorLocation(key, child.location);

  return new DecoderError(
    value,
    `invalid value for key ["${key}"] > ${child.message}`,
    {
      decoderName,
      child,
      location,
      key
    }
  );
}

async function asyncDecodeKey(
  decoder: Decoder<string, string> | PromiseDecoder<string, string>,
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
): Promise<DecoderResult<string>> {
  const keyResult = await decoder.decode(key);

  if (areDecoderErrors(keyResult)) {
    return keyResult.map(
      (error): DecoderError => childKeyError(input, error, key)
    );
  }

  return keyResult;
}

async function asyncDecodeValue<R, V>(
  decoder: Decoder<R, V> | PromiseDecoder<R, V>,
  value: V,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  key: string
): Promise<DecoderResult<R>> {
  const valueResult = await decoder.decode(value);

  if (areDecoderErrors(valueResult)) {
    return valueResult.map(
      (error): DecoderError => childValueError(error, input, key)
    );
  }

  return valueResult;
}

function nonObjectError(
  input: unknown,
  options?: IsDictionaryOptions
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

export type IsDictionaryOptions = ComposeDecoderOptions;

export function isDictionary<R, V>(
  valueDecoder: Decoder<R, V>,
  options?: IsDictionaryOptions
): Decoder<{ [key: string]: R }, V>;
export function isDictionary<R, V>(
  valueDecoder: Decoder<R, V>,
  keyDecoder: Decoder<string, string>,
  options?: IsDictionaryOptions
): Decoder<{ [key: string]: R }, V>;
export function isDictionary<R, V>(
  decoder: PromiseDecoder<R, V>,
  options?: IsDictionaryOptions
): PromiseDecoder<{ [key: string]: R }, V>;
export function isDictionary<R, V>(
  valueDecoder: Decoder<R, V> | PromiseDecoder<R, V>,
  keyDecoder: Decoder<string, string> | PromiseDecoder<string, string>,
  options?: IsDictionaryOptions
): PromiseDecoder<{ [key: string]: R }, V>;
export function isDictionary<R, V>(
  decoder: Decoder<R, V> | PromiseDecoder<R, V>,
  optionalA?:
    | IsDictionaryOptions
    | Decoder<string, string>
    | PromiseDecoder<string, string>,
  optionalB?: IsDictionaryOptions
): Decoder<{ [key: string]: R }, V> | PromiseDecoder<{ [key: string]: R }, V> {
  let keyDecoder:
    | Decoder<string, string>
    | PromiseDecoder<string, string>
    | undefined;
  let options: IsDictionaryOptions = {};

  if (optionalA) {
    if (optionalA instanceof Decoder || optionalA instanceof PromiseDecoder) {
      keyDecoder = optionalA;
    } else {
      options = optionalA;
    }
  }

  if (optionalB) {
    options = optionalB;
  }

  if (
    decoder instanceof PromiseDecoder ||
    keyDecoder instanceof PromiseDecoder
  ) {
    if (options.allErrors) {
      return new PromiseDecoder(
        async (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input: any
        ): Promise<
          DecoderResult<{
            [x: string]: R;
          }>
        > => {
          if (typeof input !== "object" || input === null) {
            return nonObjectError(input, options);
          }

          let hasError = false;

          const results = await Promise.all(
            Object.entries(input as { [key: string]: V }).map(
              async ([entryKey, entryValue]): Promise<
                DecoderError[] | [string, R]
              > => {
                let key = entryKey;

                if (keyDecoder) {
                  const keyResult = await asyncDecodeKey(
                    keyDecoder!,
                    entryKey,
                    input
                  );

                  if (areDecoderErrors(keyResult)) {
                    hasError = true;
                    return keyResult;
                  }

                  key = keyResult.value;
                }

                const valueResult = await asyncDecodeValue(
                  decoder,
                  entryValue,
                  input,
                  entryKey
                );

                if (areDecoderErrors(valueResult)) {
                  hasError = true;
                  return valueResult;
                }

                return [key, valueResult.value] as [string, R];
              }
            )
          );

          if (hasError) {
            const errors: DecoderError[] = [];

            results.forEach(
              (result): void => {
                if (result[0] instanceof DecoderError) {
                  errors.push(...(result as DecoderError[]));
                }
              }
            );

            return applyOptionsToDecoderErrors(errors, options);
          }

          return ok(Object.fromEntries(results as Array<[string, R]>));
        }
      );
    }

    return new PromiseDecoder(
      async (
        input: V
      ): Promise<
        DecoderResult<{
          [key: string]: R;
        }>
      > => {
        if (typeof input !== "object" || input === null) {
          return nonObjectError(input, options);
        }

        const resultObject: { [key: string]: R } = {};

        for (const [entryKey, entryValue] of Object.entries(input)) {
          let key = entryKey;

          if (keyDecoder) {
            const keyResult = await asyncDecodeKey(
              keyDecoder!,
              entryKey,
              input
            );

            if (areDecoderErrors(keyResult)) {
              return applyOptionsToDecoderErrors(keyResult, options);
            }

            key = keyResult.value;
          }

          const valueResult = await asyncDecodeValue(
            decoder,
            entryValue,
            input,
            entryKey
          );

          if (areDecoderErrors(valueResult)) {
            return applyOptionsToDecoderErrors(valueResult, options);
          }

          resultObject[key] = valueResult.value;
        }

        return ok(resultObject);
      }
    );
  }

  return new Decoder(
    (
      input: V
    ): DecoderResult<{
      [key: string]: R;
    }> => {
      if (typeof input !== "object" || input === null) {
        return nonObjectError(input, options);
      }

      const resultObject: { [key: string]: R } = {};

      const entries: Array<[string, V]> = Object.entries(input);
      const allErrors: DecoderError[] = [];

      for (const [entryKey, entryValue] of entries) {
        let key = entryKey;

        if (keyDecoder) {
          const keyResult = (keyDecoder as Decoder<string, string>).decode(
            entryKey
          );

          if (areDecoderErrors(keyResult)) {
            const errors = keyResult.map(
              (error): DecoderError => childKeyError(input, error, entryKey)
            );

            if (options.allErrors) {
              allErrors.push(...errors);
              continue;
            }

            return applyOptionsToDecoderErrors(errors, options);
          }

          key = keyResult.value;
        }

        const valueResult = decoder.decode(entryValue);

        if (areDecoderErrors(valueResult)) {
          const errors = valueResult.map(
            (error): DecoderError => childValueError(error, input, entryKey)
          );

          if (options.allErrors) {
            allErrors.push(...errors);
            continue;
          }

          return applyOptionsToDecoderErrors(errors, options);
        }

        resultObject[key] = valueResult.value;
      }

      if (allErrors.length > 0)
        return applyOptionsToDecoderErrors(allErrors, options);

      return ok(resultObject);
    }
  );
}
