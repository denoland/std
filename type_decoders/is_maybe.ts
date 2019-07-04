import { Decoder, PromiseDecoder } from './decoder.ts';
import { isAnyOf } from './is_any_of.ts';
import { isExactly } from './is_exactly.ts';
import { ISimpleDecoderOptions } from './helpers.ts';

export interface IMaybeDecoderOptions extends ISimpleDecoderOptions {}

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
  return isAnyOf([isExactly(undefined), isExactly(null), decoder], {
    decoderName: options.decoderName || 'isMaybe',
  }) as Decoder<T | null | undefined> | PromiseDecoder<T | null | undefined>;
}
