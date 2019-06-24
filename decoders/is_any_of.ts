import { Decoder, PromiseDecoder, DecoderReturnType } from './decoder.ts';
import {
  DecoderSuccess,
  DecoderError,
  DecoderResult,
} from './decoder_result.ts';
import { NestedDecoderErrorMsg, err } from './utils.ts';

export interface IAnyOfDecoderOptions {
  msg?: NestedDecoderErrorMsg;
}

export function isAnyOf<T extends Decoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions,
): Decoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options?: IAnyOfDecoderOptions,
): PromiseDecoder<DecoderReturnType<T>>;
export function isAnyOf<T extends Decoder<unknown> | PromiseDecoder<unknown>>(
  decoders: T[],
  options: IAnyOfDecoderOptions = {},
) {
  if (decoders.some(decoder => decoder instanceof PromiseDecoder)) {
    return new PromiseDecoder<DecoderReturnType<T>>(async value => {
      let result: DecoderResult<DecoderReturnType<T>>;
  
      for (const decoder of decoders) {
        result = (await decoder.decode(value)) as DecoderResult<DecoderReturnType<T>>;
  
        if (result instanceof DecoderSuccess) return result;
      }
  
      return err(result.value, options.msg || (result as DecoderError).message, {
        child: result as DecoderError,
        location: (result as DecoderError).location,
      });
    });
  }

  return new Decoder<DecoderReturnType<T>>(value => {
    let result: DecoderResult<DecoderReturnType<T>>;

    for (const decoder of decoders) {
      result = decoder.decode(value) as DecoderResult<DecoderReturnType<T>>;

      if (result instanceof DecoderSuccess) return result;
    }

    return err(result.value, options.msg || (result as DecoderError).message, {
      child: result as DecoderError,
      location: (result as DecoderError).location,
    });
  });
}
