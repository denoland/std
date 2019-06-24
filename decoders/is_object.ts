import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError, DecoderResult } from './decoder_result.ts';
import { err, NestedDecoderErrorMsg, ok } from './utils.ts';

export interface IObjectDecoderOptions<T> {
  msg?: NestedDecoderErrorMsg<T>;
  keyMap?: { [P in keyof T]?: string | number };
}

export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> },
  options?: IObjectDecoderOptions<T>,
): Decoder<T> ;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options?: IObjectDecoderOptions<T>,
): PromiseDecoder<T> ;
export function isObject<T>(
  decoderObject: { [P in keyof T]: Decoder<T[P]> | PromiseDecoder<T[P]> },
  options: IObjectDecoderOptions<T> = {},
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

      for (const key in decoderObject) {
        if (!decoderObject.hasOwnProperty(key)) continue;

        let valueKey: string | number = key;

        if (options.keyMap && options.keyMap.hasOwnProperty(key)) {
          valueKey = options.keyMap[key];
        }

        // This can be improved to decode in parallel, rather then serially
        const result = await decoderObject[key].decode(value[valueKey]);

        if (result instanceof DecoderError) {
          const keyIsValidDotAccessor =
            typeof valueKey === 'string' && /^[a-zA-Z]+$/.test(valueKey);

          const location = (keyIsValidDotAccessor
            ? `.${key}`
            : `["${key}"]`
          ).concat(result.location);

          return err<T>((value as unknown) as T, msg || result.message, {
            location,
            child: result,
            key,
          });
        }

        resultObj[key] = result.value;
      }

      return ok(resultObj);
    });
  }

  return new Decoder<T>(value => {
    if (typeof value !== 'object' || value === null) {
      return err(value, msg || 'must be a non-null object');
    }

    const resultObj: any = {};

    for (const key in decoderObject) {
      if (!decoderObject.hasOwnProperty(key)) continue;

      let valueKey: string | number = key;

      if (options.keyMap && options.keyMap.hasOwnProperty(key)) {
        valueKey = options.keyMap[key];
      }

      const result = decoderObject[key].decode(value[valueKey]) as DecoderResult<unknown>;

      if (result instanceof DecoderError) {
        const keyIsValidDotAccessor =
          typeof valueKey === 'string' && /^[a-zA-Z]+$/.test(valueKey);

        const location = (keyIsValidDotAccessor
          ? `.${key}`
          : `["${key}"]`
        ).concat(result.location);

        return err<T>((value as unknown) as T, msg || result.message, {
          location,
          child: result,
          key,
        });
      }

      resultObj[key] = result.value;
    }

    return ok(resultObj);
  });
}
