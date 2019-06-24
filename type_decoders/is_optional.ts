import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg } from './util.ts';
import { isAnyOf } from './is_any_of.ts';
import { isUndefined } from './is_undefined.ts';

export interface IOptionalDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isOptional<T>(
  decoder: Decoder<T>,
  options?: IOptionalDecoderOptions,
): Decoder<T | undefined>;
export function isOptional<T>(
  decoder: PromiseDecoder<T>,
  options?: IOptionalDecoderOptions,
): PromiseDecoder<T | undefined>;
export function isOptional<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: IOptionalDecoderOptions = {},
) {
  return isAnyOf([isUndefined(), decoder], { msg: options.msg }) as
    | Decoder<T | undefined>
    | PromiseDecoder<T | undefined>;
}
