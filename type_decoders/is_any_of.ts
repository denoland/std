import { Decoder, PromiseDecoder, DecoderReturnType } from "./decoder.ts";
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult,
  DecoderErrorMsgArg
} from "./decoder_result.ts";
import { err } from "./util.ts";

const decoderName = "isAnyOf";

export interface IAnyOfDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isAnyOf<T extends Decoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions
): Decoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions
): PromiseDecoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options: IAnyOfDecoderOptions = {}
) {
  if (decoders.some(decoder => decoder instanceof PromiseDecoder)) {
    return new PromiseDecoder<DecoderReturnType<T>>(async value => {
      let results: DecoderResult<DecoderReturnType<T>>[] = [];

      for (const decoder of decoders) {
        const result = (await decoder.decode(value)) as DecoderResult<
          DecoderReturnType<T>
        >;

        if (result instanceof DecoderSuccess) return result;

        results.push(result);
      }

      const defaultMsg = results
        .map(result => (result as DecoderError).message)
        .join(" OR ");

      const error = results.pop();

      return err(error.value, defaultMsg, options.msg, { decoderName });
    });
  }

  return new Decoder<DecoderReturnType<T>>(value => {
    let results: DecoderResult<DecoderReturnType<T>>[] = [];

    for (const decoder of decoders) {
      const result = decoder.decode(value) as DecoderResult<
        DecoderReturnType<T>
      >;

      if (result instanceof DecoderSuccess) return result;

      results.push(result);
    }

    const defaultMsg = results
      .map(result => (result as DecoderError).message)
      .join(" OR ");

    const error = results.pop();

    return err(error.value, defaultMsg, options.msg, { decoderName });
  });
}
