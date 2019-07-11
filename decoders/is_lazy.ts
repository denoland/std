// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder, AsyncDecoder } from "./decoder.ts";
import { DecoderResult } from "./decoder_result.ts";

export interface IsLazyOptions {
  promise?: boolean;
}

export function isLazy<T>(
  decoderFn: () => Decoder<T>,
  options?: IsLazyOptions & { promise?: false }
): Decoder<T>;
export function isLazy<T>(
  decoderFn: () => AsyncDecoder<T>,
  options: IsLazyOptions & { promise: true }
): AsyncDecoder<T>;
export function isLazy<T>(
  decoderFn: () => Decoder<T> | AsyncDecoder<T>,
  options: IsLazyOptions = {}
): Decoder<T> | AsyncDecoder<T> {
  if (options.promise) {
    return new AsyncDecoder(
      (value): Promise<DecoderResult<T>> =>
        (decoderFn() as AsyncDecoder<T>).decode(value)
    );
  }

  return new Decoder(
    (value): DecoderResult<T> => (decoderFn() as Decoder<T>).decode(value)
  );
}
