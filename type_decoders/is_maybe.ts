import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg } from './util.ts';
import { isAnyOf } from './is_any_of.ts';
import { isUndefined } from './is_undefined.ts';
import { isNull } from './is_null.ts';

export interface IMaybeDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isMaybe<T>(
  decoder: Decoder<T>,
  options?: IMaybeDecoderOptions,
): Decoder<T | null | undefined>;
export function isMaybe<T>(
  decoder: PromiseDecoder<T>,
  options?: IMaybeDecoderOptions,
): PromiseDecoder<T | null | undefined>;
export function isMaybe<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IMaybeDecoderOptions = {},
) {
  return isAnyOf([isUndefined(), isNull(), decoder], { msg: options.msg }) as
    | Decoder<T | null | undefined>
    | PromiseDecoder<T | null | undefined>;
}
