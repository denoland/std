import { Decoder, PromiseDecoder } from './decoder.ts';
import { isAnyOf } from './is_any_of.ts';
import { isExactly } from './is_exactly.ts';
import { ISimpleDecoderOptions } from './helpers.ts';

export interface INullableDecoderOptions extends ISimpleDecoderOptions {}

export function isNullable<T>(
  decoder: Decoder<T>,
  options?: INullableDecoderOptions,
): Decoder<T | null>;
export function isNullable<T>(
  decoder: PromiseDecoder<T>,
  options?: INullableDecoderOptions,
): PromiseDecoder<T | null>;
export function isNullable<T>(
  decoder: Decoder<T> | PromiseDecoder<T>,
  options: INullableDecoderOptions = {},
) {
  return isAnyOf([isExactly(null), decoder], {
    decoderName: options.decoderName || 'isNullable',
  }) as Decoder<T | null> | PromiseDecoder<T | null>;
}
