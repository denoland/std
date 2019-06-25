import { Decoder, PromiseDecoder } from "./decoder.ts";

export function isLazy<T>(decoderFn: () => Decoder<T>): Decoder<T | null>;
export function isLazy<T>(
  decoderFn: () => PromiseDecoder<T>
): PromiseDecoder<T | null>;
export function isLazy<T>(decoderFn: () => Decoder<T> | PromiseDecoder<T>) {
  if (decoderFn() instanceof PromiseDecoder) {
    return new PromiseDecoder(value =>
      (decoderFn() as PromiseDecoder<T>).decode(value)
    );
  }

  return new Decoder(value => (decoderFn() as Decoder<T>).decode(value));
}
