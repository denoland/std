import { Decoder, PromiseDecoder } from "./decoder.ts";
import { DecoderResult } from "./decoder_result.ts";

export interface IsLazyOptions {
  promise?: boolean;
}

export function isLazy<T>(
  decoderFn: () => Decoder<T>,
  options?: IsLazyOptions & { promise?: false }
): Decoder<T>;
export function isLazy<T>(
  decoderFn: () => PromiseDecoder<T>,
  options: IsLazyOptions & { promise: true }
): PromiseDecoder<T>;
export function isLazy<T>(
  decoderFn: () => Decoder<T> | PromiseDecoder<T>,
  options: IsLazyOptions = {}
): Decoder<T> | PromiseDecoder<T> {
  if (options.promise) {
    return new PromiseDecoder(
      (value): Promise<DecoderResult<T>> =>
        (decoderFn() as PromiseDecoder<T>).decode(value)
    );
  }

  return new Decoder(
    (value): DecoderResult<T> => (decoderFn() as Decoder<T>).decode(value)
  );
}
