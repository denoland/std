// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder, AsyncDecoder } from "./decoder.ts";
import {
  DecoderError,
  DecoderResult,
  areDecoderErrors
} from "./decoder_result.ts";

export class DecoderAssertError extends Error {
  constructor(public errors: DecoderError[]) {
    super(errors.map((error): string => error.message).join(". \n"));
  }
}

function handleResult<T>(result: DecoderResult<T>): T {
  if (areDecoderErrors(result)) throw new DecoderAssertError(result);

  return result.value;
}

/**
 * When passed a decoder argument, `assert()` returns a new function which
 * can be used to decode the same values as the provided decoder. This new
 * function passes its input to the provided decoder's `decode()` method
 * and, on decode success, unwraps the processed value and returns it
 * directly. On failure, a `DecoderAssertError` is thrown
 * (rather than returned).
 *
 * ```ts
 * const validator = assert(isNumber());
 * const value: number = validator(1);
 * const value: number = validator('1'); // will throw a `DecoderError`
 * ```
 */
export function assert<R, V>(
  decoder: Decoder<R, V>
): { (value: V): R; (value: Promise<V>): Promise<R> };

export function assert<R, V>(
  decoder: AsyncDecoder<R, V>
): (value: V | Promise<V>) => Promise<R>;

export function assert<R, V>(
  decoder: Decoder<R, V> | AsyncDecoder<R, V>
):
  | { (value: V): R; (value: Promise<V>): Promise<R> }
  | ((value: V | Promise<V>) => Promise<R>) {
  if (decoder instanceof AsyncDecoder) {
    return async (value: V | Promise<V>): Promise<R> =>
      handleResult(await decoder.decode(await value));
  }

  const decode = (value: V): R =>
    handleResult((decoder as Decoder<R, V>).decode(value));

  // I have no idea how to explicitly type this return value
  // such that typescript does not complain
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input: V | Promise<V>): any =>
    input instanceof Promise
      ? input.then((value): R => decode(value))
      : decode(input);
}
