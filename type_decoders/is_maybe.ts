import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isAnyOf } from "./is_any_of.ts";
import { isUndefined } from "./is_undefined.ts";
import { isNull } from "./is_null.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";
import { changeErrorDecoderName } from "./util.ts";

export interface IMaybeDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isMaybe<T>(
  decoder: Decoder<T>,
  options?: IMaybeDecoderOptions
): Decoder<T | null | undefined>;
export function isMaybe<T>(
  decoder: PromiseDecoder<T>,
  options?: IMaybeDecoderOptions
): PromiseDecoder<T | null | undefined>;
export function isMaybe<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IMaybeDecoderOptions = {}
) {
  return isAnyOf([isUndefined(), isNull(), decoder], {
    msg: changeErrorDecoderName("isMaybe", options.msg)
  }) as Decoder<T | null | undefined> | PromiseDecoder<T | null | undefined>;
}
