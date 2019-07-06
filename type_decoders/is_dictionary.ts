import { Decoder, PromiseDecoder } from "./decoder.ts";
import { DecoderError, areDecoderErrors } from "./decoder_result.ts";
import { ok, errorLocation } from "./_util.ts";
import { IComposeDecoderOptions, applyOptionsToDecoderErrors } from "./util.ts";

const decoderName = "isDictionary";

export interface IDictionaryDecoderOptions extends IComposeDecoderOptions {}

// TODO(@thefliik): verify that two optional params is ok by style guide

export function isDictionary<R, V = any>(
  valueDecoder: Decoder<R, V>,
  options?: IDictionaryDecoderOptions
): Decoder<{ [key: string]: R }, V>;
export function isDictionary<R, V = any>(
  valueDecoder: Decoder<R, V>,
  keyDecoder: Decoder<string, string>,
  options?: IDictionaryDecoderOptions
): Decoder<{ [key: string]: R }, V>;
export function isDictionary<R, V = any>(
  decoder: PromiseDecoder<R, V>,
  options?: IDictionaryDecoderOptions
): PromiseDecoder<{ [key: string]: R }, V>;
export function isDictionary<R, V = any>(
  valueDecoder: Decoder<R, V> | PromiseDecoder<R, V>,
  keyDecoder: Decoder<string, string> | PromiseDecoder<string, string>,
  options?: IDictionaryDecoderOptions
): PromiseDecoder<{ [key: string]: R }, V>;
export function isDictionary<R, V = any>(
  decoder: Decoder<R, V> | PromiseDecoder<R, V>,
  optionalA?:
    | IDictionaryDecoderOptions
    | Decoder<string, string>
    | PromiseDecoder<string, string>,
  optionalB?: IDictionaryDecoderOptions
) {
  let keyDecoder:
    | Decoder<string, string>
    | PromiseDecoder<string, string>
    | undefined;
  let options: IDictionaryDecoderOptions = {};

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
      return new PromiseDecoder(async (input: V) => {
        if (typeof input !== "object" || input === null) {
          return nonObjectError(input, options);
        }

        let hasError = false;

        const results = await Promise.all(
          Object.entries(input).map(async ([entryKey, entryValue]) => {
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
          })
        );

        if (hasError) {
          const errors: DecoderError[] = [];

          results.forEach(result => {
            if (result[0] instanceof DecoderError) {
              errors.push(...(result as DecoderError[]));
            }
          });

          return applyOptionsToDecoderErrors(errors, options);
        }

        return ok(Object.fromEntries(results as [string, R][]));
      });
    }

    return new PromiseDecoder(async (input: V) => {
      if (typeof input !== "object" || input === null) {
        return nonObjectError(input, options);
      }

      const resultObject: { [key: string]: R } = {};

      for (const [entryKey, entryValue] of Object.entries(input)) {
        let key = entryKey;

        if (keyDecoder) {
          const keyResult = await asyncDecodeKey(keyDecoder!, entryKey, input);

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
    });
  }

  return new Decoder((input: V) => {
    if (typeof input !== "object" || input === null) {
      return nonObjectError(input, options);
    }

    const resultObject: { [key: string]: R } = {};

    const entries: [string, V][] = Object.entries(input);
    const allErrors: DecoderError[] = [];

    for (const [entryKey, entryValue] of entries) {
      let key = entryKey;

      if (keyDecoder) {
        const keyResult = (keyDecoder as Decoder<string, string>).decode(
          entryKey
        );

        if (areDecoderErrors(keyResult)) {
          const errors = keyResult.map(error =>
            childKeyError(input, error, entryKey)
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
        const errors = valueResult.map(error =>
          childValueError(error, input, entryKey)
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
  });
}

async function asyncDecodeKey(
  decoder: Decoder<string, unknown> | PromiseDecoder<string, unknown>,
  key: string,
  input: unknown
) {
  const keyResult = await decoder.decode(key);

  if (areDecoderErrors(keyResult)) {
    return keyResult.map(error => childKeyError(input, error, key));
  }

  return keyResult;
}

async function asyncDecodeValue<R, V>(
  decoder: Decoder<R, V> | PromiseDecoder<R, V>,
  value: V,
  input: unknown,
  key: string
) {
  const valueResult = await decoder.decode(value);

  if (areDecoderErrors(valueResult)) {
    return valueResult.map(error => childValueError(error, input, key));
  }

  return valueResult;
}

function childKeyError(input: unknown, child: DecoderError, key: string) {
  const location = errorLocation(key, "");

  return new DecoderError(input, `invalid key ["${key}"] > ${child.message}`, {
    decoderName,
    child,
    location,
    key
  });
}

function childValueError(child: DecoderError, value: unknown, key: string) {
  const location = errorLocation(key, child.location);
  const keyName = typeof key === "string" ? `"${key}"` : key;

  return new DecoderError(
    value,
    `invalid value for key [${keyName}] > ${child.message}`,
    {
      decoderName,
      child,
      location,
      key
    }
  );
}

function nonObjectError(input: unknown, options?: IDictionaryDecoderOptions) {
  return applyOptionsToDecoderErrors(
    [
      new DecoderError(input, "must be a non-null object", {
        decoderName
      })
    ],
    options
  );
}
