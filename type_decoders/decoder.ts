import {
  DecoderResult,
  DecoderSuccess,
  areDecoderErrors
} from "./decoder_result.ts";

/**
 * An object which can be used to validate and process `unknown` values
 * and cast them to the appropriate typescript type.
 *
 * @param decodeFn the function which is used to decode input values
 */
export class Decoder<R, I = any> {
  constructor(private decodeFn: (input: I) => DecoderResult<R>) {}

  decode(input: Promise<I>): Promise<DecoderResult<R>>;
  decode(input: I): DecoderResult<R>;
  decode(input: I | Promise<I>) {
    if (input instanceof Promise) return input.then(res => this.decodeFn(res));

    return this.decodeFn(input);
  }

  /**
   * On decode success, transform a value using the provided
   * transformation function.
   */
  map<K>(fn: (input: R) => K) {
    return new Decoder((input: I) => {
      const result = this.decodeFn(input);

      if (areDecoderErrors(result)) return result;

      return new DecoderSuccess(fn(result.value));
    });
  }
}

/**
 * An object which can be used to validate and process `unknown` values
 * and cast them to the appropriate typescript type. Unlike `Decoder`,
 * `PromiseDecoder` can receive a `decodeFn` which returns a promise.
 *
 * @param decodeFn the function which is used to decode input values
 */
export class PromiseDecoder<R, I = any> {
  constructor(private decodeFn: (input: I) => Promise<DecoderResult<R>>) {}

  async decode(input: I | Promise<I>) {
    return await this.decodeFn(await input);
  }

  /**
   * On decode success, transform a value using the provided
   * transformation function.
   */
  map<K>(fn: (input: R) => K | Promise<K>) {
    return new PromiseDecoder(async (input: I) => {
      const result = await this.decodeFn(input);

      if (areDecoderErrors(result)) return result;

      return new DecoderSuccess(await fn(result.value));
    });
  }
}

// prettier makes this hard to read
// prettier-ignore
export type DecoderReturnType<T> = T extends Decoder<infer R> ? R
  : T extends PromiseDecoder<infer R> ? R
  : unknown;

// prettier makes this hard to read
// prettier-ignore
export type DecoderInputType<T> = T extends Decoder<unknown, infer I> ? I
  : T extends PromiseDecoder<unknown, infer I> ? I
  : unknown;
