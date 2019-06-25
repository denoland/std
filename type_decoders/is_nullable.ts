import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isAnyOf } from "./is_any_of.ts";
import { isNull } from "./is_null.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";
import { changeErrorDecoderName } from "./util.ts";

export interface INullableDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isNullable<T>(
  decoder: Decoder<T>,
  options?: INullableDecoderOptions
): Decoder<T | null>;
export function isNullable<T>(
  decoder: PromiseDecoder<T>,
  options?: INullableDecoderOptions
): PromiseDecoder<T | null>;
export function isNullable<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: INullableDecoderOptions = {}
) {
  return isAnyOf([isNull(), decoder], {
    msg: changeErrorDecoderName("isNullable", options.msg)
  }) as Decoder<T | null> | PromiseDecoder<T | null>;
}
