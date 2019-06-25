import { Decoder, PromiseDecoder } from "./decoder.ts";
import { isAnyOf } from "./is_any_of.ts";
import { isUndefined } from "./is_undefined.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";
import { changeErrorDecoderName } from "./util.ts";

export interface IOptionalDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isOptional<T>(
  decoder: Decoder<T>,
  options?: IOptionalDecoderOptions
): Decoder<T | undefined>;
export function isOptional<T>(
  decoder: PromiseDecoder<T>,
  options?: IOptionalDecoderOptions
): PromiseDecoder<T | undefined>;
export function isOptional<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IOptionalDecoderOptions = {}
) {
  return isAnyOf([isUndefined(), decoder], {
    msg: changeErrorDecoderName("isOptional", options.msg)
  }) as Decoder<T | undefined> | PromiseDecoder<T | undefined>;
}
