import { Decoder, PromiseDecoder } from './decoder.ts';

export interface IRecursiveDecoderOptions {
  promise?: boolean;
}

export function isRecursive<T>(
  decoderFn: () => Decoder<T>,
  options?: IRecursiveDecoderOptions & { promise?: false },
): Decoder<T | null>;
export function isRecursive<T>(
  decoderFn: () => PromiseDecoder<T>,
  options: IRecursiveDecoderOptions & { promise: true },
): PromiseDecoder<T | null>;
export function isRecursive<T>(
  decoderFn: () => Decoder<T> | PromiseDecoder<T>,
  options: IRecursiveDecoderOptions = {},
) {
  if (options.promise) {
    return new PromiseDecoder(value =>
      (decoderFn() as PromiseDecoder<T>).decode(value),
    );
  }

  return new Decoder(value => (decoderFn() as Decoder<T>).decode(value));
}
