import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg } from './utils.ts';
import { isAnyOf } from './is_any_of.ts';
import { isNull } from './is_null.ts';

export interface INullableDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isNullable<T>(decoder: Decoder<T>, args: INullableDecoderOptions): Decoder<T | null>;
export function isNullable<T>(decoder: PromiseDecoder<T>, args: INullableDecoderOptions): PromiseDecoder<T | null>;
export function isNullable<T>(decoder: Decoder<T> | PromiseDecoder<T>, args: INullableDecoderOptions = {}) {
  return isAnyOf(
    [
      isNull(),
      decoder,
    ],
    { msg: args.msg },
  ) as Decoder<T | null> | PromiseDecoder<T | null>;
}
