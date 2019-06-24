import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg } from './utils.ts';
import { isAnyOf } from './is_any_of.ts';
import { isUndefined } from './is_undefined.ts';
import { isNull } from './is_null.ts';

export interface IMaybeDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isMaybe<T>(decoder: Decoder<T>, args: IMaybeDecoderOptions): Decoder<T | null | undefined>;
export function isMaybe<T>(decoder: PromiseDecoder<T>, args: IMaybeDecoderOptions): PromiseDecoder<T | null | undefined>;
export function isMaybe<T>(decoder: Decoder<T> | PromiseDecoder<T>, args: IMaybeDecoderOptions = {}) {
  return isAnyOf(
    [
      isUndefined(),
      isNull(),
      decoder,
    ],
    { msg: args.msg },
  ) as Decoder<T | null | undefined> | PromiseDecoder<T | null | undefined>;
}
