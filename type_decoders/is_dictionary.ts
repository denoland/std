import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderError } from './decoder_result.ts';
import { err, DecoderErrorMsg, ok, buildErrorLocationString } from './util.ts';

const decoderName = 'isDictionary';

export interface IDictionaryDecoderOptions<V> {
  msg?: DecoderErrorMsg<V>;
}

export function isDictionary<R, V = unknown>(
  decoder: Decoder<R, V>,
  options?: IDictionaryDecoderOptions<V>,
): Decoder<R[], V>;
export function isDictionary<R, V = unknown>(
  decoder: PromiseDecoder<R, V>,
  options?: IDictionaryDecoderOptions<V>,
): PromiseDecoder<R[], V>;
export function isDictionary<R, V = unknown>(
  decoder: Decoder<R, V> | PromiseDecoder<R, V>,
  options: IDictionaryDecoderOptions<V> = {},
) {
  if (decoder instanceof Decoder) {
    return new Decoder((input: V) => {
      if (typeof input !== 'object' || input === null) {
        err(input, (options && options.msg) || 'must be a non-null object');
      }

      const obj: { [key: string]: R } = {};

      for (const key in input) {
        if (!input.hasOwnProperty(key)) continue;

        const result = decoder.decode((input as any)[key]);

        if (result instanceof DecoderError) {
          return buildError(result, key, input, options.msg);
        }

        obj[key] = result.value;
      }

      return ok(obj);
    });
  }

  return new PromiseDecoder(async (input: V) => {
    if (typeof input !== 'object' || input === null) {
      err(input, (options && options.msg) || 'must be a non-null object');
    }

    const obj: { [key: string]: R } = {};

    for (const key in input) {
      if (!input.hasOwnProperty(key)) continue;

      const result = await decoder.decode((input as any)[key]);

      if (result instanceof DecoderError) {
        return buildError(result, key, input, options.msg);
      }

      obj[key] = result.value;
    }

    return ok(obj);
  });
}

function buildError(
  result: DecoderError,
  key: string | number,
  input: unknown,
  providedMsg?: DecoderErrorMsg,
) {
  const location = buildErrorLocationString(key, result.location);
  const propertyKey = typeof key === 'string' ? `"${key}"` : key;
  const msg =
    providedMsg || `invalid key [${propertyKey}] value > ${result.message}`;

  return err(input, msg, {
    decoderName,
    child: result,
    location,
    key,
  });
}
