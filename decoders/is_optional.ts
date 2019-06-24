import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg } from './utils.ts';
import { isAnyOf } from './is_any_of.ts';
import { isUndefined } from './is_undefined.ts';

export interface IOptionalDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isOptional<T>(decoder: Decoder<T>, args: IOptionalDecoderOptions): Decoder<T | undefined>;
export function isOptional<T>(decoder: PromiseDecoder<T>, args: IOptionalDecoderOptions): PromiseDecoder<T | undefined>;
export function isOptional<T>(decoder: Decoder<T> | PromiseDecoder<T>, args: IOptionalDecoderOptions = {}) {
  return isAnyOf(
    [
      isUndefined(),
      decoder,
    ],
    { msg: args.msg },
  ) as Decoder<T | undefined> | PromiseDecoder<T | undefined>;
}
