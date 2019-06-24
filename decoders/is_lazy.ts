import { Decoder, PromiseDecoder } from './decoder.ts';
import { DecoderErrorMsg } from './utils.ts';

export interface ILazyDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isLazy<T>(decoderFn: () => Decoder<T>, args: ILazyDecoderOptions): Decoder<T | null>;
export function isLazy<T>(decoderFn: () => PromiseDecoder<T>, args: ILazyDecoderOptions): PromiseDecoder<T | null>;
export function isLazy<T>(decoderFn: () => Decoder<T> | PromiseDecoder<T>, args: ILazyDecoderOptions = {}) {
  if (decoderFn() instanceof PromiseDecoder) {
    return new PromiseDecoder(value => (decoderFn() as PromiseDecoder<T>).decode(value));
  }
  
  return new Decoder(value => (decoderFn() as Decoder<T>).decode(value));
}
