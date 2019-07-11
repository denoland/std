// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import {
  DecoderResult,
  DecoderSuccess,
  areDecoderErrors
} from "./decoder_result.ts";

/**
 * An object which facilitates the decoding of an `unknown` input
 * and returning a properly typed response (on success), or
 * returning any errors.
 *
 * @param decodeFn the function which is used to decode input values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Decoder<R, I = any> {
  constructor(
    /** The internal function this decoder uses to decode values */
    readonly decodeFn: (input: I) => DecoderResult<R>
  ) {}

  decode(input: Promise<I>): Promise<DecoderResult<R>>;
  decode(input: I): DecoderResult<R>;
  decode(input: I | Promise<I>): DecoderResult<R> | Promise<DecoderResult<R>> {
    if (input instanceof Promise) {
      return input.then((res): DecoderResult<R> => this.decodeFn(res));
    }

    return this.decodeFn(input);
  }

  /**
   * On decode success, transform a value using the provided
   * transformation function.
   */
  map<K>(fn: (input: R) => K): Decoder<K, I> {
    return new Decoder(
      (input: I): DecoderResult<K> => {
        const result = this.decodeFn(input);

        if (areDecoderErrors(result)) return result;

        return new DecoderSuccess(fn(result.value));
      }
    );
  }
}

/**
 * An object which facilitates the `async` decoding of an `unknown`
 * input and returning a properly typed response (on success), or
 * returning any errors.
 *
 * @param decodeFn the function which is used to decode input values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AsyncDecoder<R, I = any> {
  constructor(readonly decodeFn: (input: I) => Promise<DecoderResult<R>>) {}

  async decode(input: I | Promise<I>): Promise<DecoderResult<R>> {
    return await this.decodeFn(await input);
  }

  /**
   * On decode success, transform a value using the provided
   * transformation function.
   */
  map<K>(fn: (input: R) => K | Promise<K>): AsyncDecoder<K, I> {
    return new AsyncDecoder(
      async (input: I): Promise<DecoderResult<K>> => {
        const result = await this.decodeFn(input);

        if (areDecoderErrors(result)) return result;

        return new DecoderSuccess(await fn(result.value));
      }
    );
  }
}

// prettier makes this hard to read
// prettier-ignore
export type DecoderReturnType<T> = T extends Decoder<infer R> ? R
  : T extends AsyncDecoder<infer R> ? R
  : unknown;

// prettier makes this hard to read
// prettier-ignore
export type DecoderInputType<T> = T extends Decoder<unknown, infer I> ? I
  : T extends AsyncDecoder<unknown, infer I> ? I
  : unknown;
