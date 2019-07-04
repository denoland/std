import { Decoder, PromiseDecoder } from './decoder.ts';
import { isAnyOf } from './is_any_of.ts';
import { isExactly } from './is_exactly.ts';
import { ISimpleDecoderOptions } from './helpers.ts';

export interface IOptionalDecoderOptions extends ISimpleDecoderOptions {}

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
  return isAnyOf([isExactly(undefined), decoder], {
    decoderName: options.decoderName || 'isOptional',
  }) as Decoder<T | undefined> | PromiseDecoder<T | undefined>;
}
