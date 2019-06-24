import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError, DecoderResult } from './decoder_result.ts';
import {
  err,
  NestedDecoderErrorMsg,
  ok,
  buildErrorLocationString,
} from './util.ts';

const decoderName = 'isObject';

export interface IObjectDecoderOptions<T> {
  msg?: NestedDecoderErrorMsg;
  keyMap?: { [P in keyof T]?: string | number };
}

export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IObjectDecoderOptions<T>,
): Decoder<T>;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IObjectDecoderOptions<T>,
): PromiseDecoder<T>;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IObjectDecoderOptions<T> = {},
) {
  if (
    Object.values(decoderObject).some(
      decoder => decoder instanceof PromiseDecoder,
    )
  ) {
    return new PromiseDecoder<T>(async input => {
      if (typeof input !== 'object' || input === null) {
        return err(input, options.msg || 'must be a non-null object', {
          decoderName,
        });
      }

      const resultObj: any = {};

      for (const key in decoderObject) {
        if (!decoderObject.hasOwnProperty(key)) continue;

        // if a `keyMap` options argument has been provided,
        // then we need to get the mappedValueKey for this key.
        let mappedValueKey: string | number = key;

        // check to make sure the mappedValueKey exists on the input
        // and return an error if it doesn't
        const error = checkMappedValueKey(input, key, mappedValueKey, options);

        if (error instanceof DecoderError) return error;

        const result = await decoderObject[key].decode(input[mappedValueKey]);

        if (result instanceof DecoderError) {
          return buildError(result, input, key, mappedValueKey, options);
        }

        // store the valid value on the result object
        resultObj[key] = result.value;
      }

      return ok(resultObj);
    });
  }

  return new Decoder(input => {
    if (typeof input !== 'object' || input === null) {
      return err(input, options.msg || 'must be a non-null object', {
        decoderName,
      });
    }

    const resultObj: any = {};

    for (const key in decoderObject) {
      if (!decoderObject.hasOwnProperty(key)) continue;

      // if a `keyMap` options argument has been provided,
      // then we need to get the mappedValueKey for this key.
      let mappedValueKey: string | number = key;

      // check to make sure the mappedValueKey exists on the input
      // and return an error if it doesn't
      const error = checkMappedValueKey(input, key, mappedValueKey, options);

      if (error instanceof DecoderError) return error;

      const result = decoderObject[key].decode(
        input[mappedValueKey],
      ) as DecoderResult<T>;

      if (result instanceof DecoderError) {
        return buildError(result, input, key, mappedValueKey, options);
      }

      // store the valid value on the result object
      resultObj[key] = result.value;
    }

    return ok(resultObj);
  });
}

function checkMappedValueKey<T>(
  value: unknown,
  key: string,
  valueKey: string,
  options?: IObjectDecoderOptions<T>,
) {
  if (options.keyMap && options.keyMap.hasOwnProperty(key)) {
    valueKey = options.keyMap[key];
  }

  if (!value.hasOwnProperty(valueKey)) {
    const propertyKey =
      typeof valueKey === 'string' ? `"${valueKey}"` : valueKey;
    const msg =
      (options && options.msg) || `missing required key [${propertyKey}]`;

    return err(value, msg, { decoderName });
  }
}

function buildError<T>(
  result: DecoderError,
  value: unknown,
  key: string,
  valueKey: string,
  options?: IObjectDecoderOptions<T>,
) {
  const location = buildErrorLocationString(valueKey, result.location);
  const propertyKey = typeof valueKey === 'string' ? `"${valueKey}"` : valueKey;
  const msg =
    (options && options.msg) ||
    `invalid key [${propertyKey}] value > ${result.message}`;

  return err(value, msg, {
    decoderName,
    child: result,
    location,
    key,
  });
}
