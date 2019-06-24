import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg } from './util.ts';
import { isAnyOf } from './is_any_of.ts';
import { isNull } from './is_null.ts';

export interface INullableDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isNullable<T>(decoder: Decoder<T>, options?: INullableDecoderOptions): Decoder<T | null>;
export function isNullable<T>(decoder: PromiseDecoder<T>, options?: INullableDecoderOptions): PromiseDecoder<T | null>;
export function isNullable<T>(decoder: Decoder<T> | PromiseDecoder<T>, options: INullableDecoderOptions = {}) {
  return isAnyOf(
    [
      isNull(),
      decoder,
    ],
    { msg: options.msg },
  ) as Decoder<T | null> | PromiseDecoder<T | null>;
}
