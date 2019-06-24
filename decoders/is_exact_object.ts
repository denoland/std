import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError, DecoderResult } from './decoder_result.ts';
import { err, NestedDecoderErrorMsg, ok } from './utils.ts';

export interface IExactObjectDecoderOptions<T> {
  msg?: NestedDecoderErrorMsg<T>;
  keyMap?: { [P in keyof T]?: string | number };
}

export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IExactObjectDecoderOptions<T>,
): Decoder<T>;
export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IExactObjectDecoderOptions<T>,
): PromiseDecoder<T>;
export function isExactObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IExactObjectDecoderOptions<T> = {},
) {
  const msg = options.msg;

  if (
    Object.values(decoderObject).some(
      decoder => decoder instanceof PromiseDecoder,
    )
  ) {
    return new PromiseDecoder<T>(async value => {
      if (typeof value !== 'object' || value === null) {
        return err(value, msg || 'must be a non-null object');
      }

      const resultObj: any = {};
      const valueKeys: (string | number)[] = [];

      for (const key in decoderObject) {
        if (!decoderObject.hasOwnProperty(key)) continue;

        let valueKey: string | number = key;

        if (options.keyMap && options.keyMap.hasOwnProperty(key)) {
          valueKey = options.keyMap[key];
        }

        if (!value.hasOwnProperty(valueKey)) {
          return err(value, msg);
        }

        // This can be improved to decode in parallel, rather then serially
        const result = await decoderObject[key].decode(value[valueKey]);
        valueKeys.push(valueKey);

        if (result instanceof DecoderError) {
          return buildError(result, key, msg);
        }

        resultObj[key] = result.value;
      }

      const extraKeys = Object.keys(value).filter(
        key => !valueKeys.includes(key),
      );

      if (extraKeys.length > 0) {
        return err(value, msg);
      }

      return ok(resultObj);
    });
  }

  return new Decoder<T>(value => {
    if (typeof value !== 'object' || value === null) {
      return err(value, msg || 'must be a non-null object');
    }

    const resultObj: any = {};
    const valueKeys: (string | number)[] = [];

    for (const key in decoderObject) {
      if (!decoderObject.hasOwnProperty(key)) continue;

      let valueKey: string | number = key;

      if (options.keyMap && options.keyMap.hasOwnProperty(key)) {
        valueKey = options.keyMap[key];
      }

      if (!value.hasOwnProperty(valueKey)) {
        return err(value, msg);
      }

      // This can be improved to decode in parallel, rather then serially
      const result = decoderObject[key].decode(
        value[valueKey],
      ) as DecoderResult<T>;
      valueKeys.push(valueKey);

      if (result instanceof DecoderError) {
        return buildError(result, key, msg);
      }

      resultObj[key] = result.value;
    }

    const extraKeys = Object.keys(value).filter(
      key => !valueKeys.includes(key),
    );

    if (extraKeys.length > 0) {
      return err(value, msg);
    }

    return ok(resultObj);
  });
}

function buildError<T>(
  error: DecoderError,
  key: string | number,
  msg?: NestedDecoderErrorMsg<T>,
) {
  const keyIsValidDotAccessor =
    typeof key === 'string' && /^[a-zA-Z]+$/.test(key);

  const location = (keyIsValidDotAccessor ? `.${key}` : `["${key}"]`).concat(
    error.location,
  );

  return err<T>(error.value as T, msg || error.message, {
    location,
    child: error,
    key,
  });
}
