import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError } from './decoder_result.ts';
import { err, DecoderErrorMsg, ok } from './utils.ts';

export interface IDictionaryDecoderOptions<V> {
  msg?: DecoderErrorMsg<V>;
}

export function isDictionary<R, V = unknown>(
  decoder: Decoder<R, V>,
  args?: IDictionaryDecoderOptions<V>,
): Decoder<R[], V>;
export function isDictionary<R, V = unknown>(
  decoder: PromiseDecoder<R, V>,
  args?: IDictionaryDecoderOptions<V>,
): PromiseDecoder<R[], V>;
export function isDictionary<R, V = unknown>(
  decoder: Decoder<R, V> | PromiseDecoder<R, V>,
  args: IDictionaryDecoderOptions<V> = {},
) {
  const msg = (args && args.msg) || 'must be an array of {{msg}} elements';

  if (decoder instanceof Decoder) {
    return new Decoder((input: V) => {
      if (typeof input !== 'object' || input === null) {
        err(input, msg)
      }
      
      const obj: {[key: string]: R} = {};

      for (const key in input) {
        if (!input.hasOwnProperty(key)) continue;

        const result = decoder.decode((input as any)[key]);

        if (result instanceof DecoderError) {
          const keyIsValidDotAccessor =
            typeof key === 'string' && /^[a-zA-Z]+$/.test(key);

          const location = (keyIsValidDotAccessor
            ? `.${key}`
            : `["${key}"]`
          ).concat(result.location);


          return err(input, msg, {
            child: result,
            location,
            key,
          });
        }

        obj[key] = result.value;
      }

      return ok(obj);
    });
  }

  return new PromiseDecoder(async (input: V) => {
    if (typeof input !== 'object' || input === null) {
      err(input, msg)
    }
    
    const obj: {[key: string]: R} = {};

    for (const key in input) {
      if (!input.hasOwnProperty(key)) continue;

      const result = await decoder.decode((input as any)[key]);

      if (result instanceof DecoderError) {
        const keyIsValidDotAccessor =
          typeof key === 'string' && /^[a-zA-Z]+$/.test(key);

        const location = (keyIsValidDotAccessor
          ? `.${key}`
          : `["${key}"]`
        ).concat(result.location);

        return err(input, msg, {
          child: result,
          location,
          key,
        });
      }

      obj[key] = result.value;
    }

    return ok(obj);
  });
}
