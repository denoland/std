import { Decoder, PromiseDecoder } from "./decoder.ts";
import {
  DecoderError,
  DecoderResult,
  areDecoderErrors
} from "./decoder_result.ts";

export class DecoderAssertError extends Error {
  constructor(public errors: DecoderError[]) {
    super(errors.map(error => error.message).join(". \n"));
  }
}

/**
 * When passed a decoder argument, `assert()` returns a new function which
 * can be used to decode the same values as the provided decoder. This new
 * function passes its input to the provided decoder's `decode()` method
 * and, on decode success, unwraps the processed value and returns it
 * directly. On failure, a `DecoderError` is thrown (rather than returned).
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
  decoder: PromiseDecoder<R, V>
): (value: V | Promise<V>) => Promise<R>;

export function assert<R, V>(decoder: Decoder<R, V> | PromiseDecoder<R, V>) {
  if (decoder instanceof PromiseDecoder) {
    return async (value: V | Promise<V>) =>
      handleResult(await decoder.decode(await value));
  }

  const decode = (value: V) =>
    handleResult((decoder as Decoder<R, V>).decode(value));

  return (input: V) =>
    input instanceof Promise
      ? input.then(value => decode(value))
      : decode(input);
}

function handleResult<T>(result: DecoderResult<T>) {
  if (areDecoderErrors(result)) throw new DecoderAssertError(result);

  return result.value;
}
