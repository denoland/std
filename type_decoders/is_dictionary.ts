import { Decoder, PromiseDecoder } from "./decoder.ts";
import { DecoderError, DecoderErrorMsgArg } from "./decoder_result.ts";
import { err, ok, buildErrorLocationString } from "./util.ts";

const decoderName = "isDictionary";

export interface IDictionaryDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isDictionary<R, V = unknown>(
  decoder: Decoder<R, V>,
  options?: IDictionaryDecoderOptions
): Decoder<R[], V>;
export function isDictionary<R, V = unknown>(
  decoder: PromiseDecoder<R, V>,
  options?: IDictionaryDecoderOptions
): PromiseDecoder<R[], V>;
export function isDictionary<R, V = unknown>(
  decoder: Decoder<R, V> | PromiseDecoder<R, V>,
  options: IDictionaryDecoderOptions = {}
) {
  if (decoder instanceof Decoder) {
    return new Decoder((input: V) => {
      if (typeof input !== "object" || input === null) {
        err(input, "must be a non-null object", options && options.msg);
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
    if (typeof input !== "object" || input === null) {
      err(input, "must be a non-null object", options && options.msg);
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
  providedMsg?: DecoderErrorMsgArg
) {
  const location = buildErrorLocationString(key, result.location);
  const propertyKey = typeof key === "string" ? `"${key}"` : key;

  return err(
    input,
    `invalid key [${propertyKey}] value > ${result.message}`,
    providedMsg,
    {
      decoderName,
      child: result,
      location,
      key
    }
  );
}
