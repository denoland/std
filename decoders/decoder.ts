import { DecoderResult, DecoderError } from './decoder_result.ts';
import { ok } from './utils.ts';

export type DecoderReturnType<T> = T extends Decoder<infer R>
  ? R
  : T extends PromiseDecoder<infer R>
  ? R
  : unknown;

export type DecoderFn<R, V = unknown> = () =>
  | Decoder<R, V>
  | PromiseDecoder<R, V>;

export class Decoder<R, V = unknown> {
  constructor(private decodeFn: (value: V) => DecoderResult<R>) {}

  /**
   * Decodes a value of type <T> and returns a Result<R>
   */
  decode(value: V): DecoderResult<R>;
  decode(value: Promise<V>): Promise<DecoderResult<R>>;
  decode(value: Promise<V> | V) {
    if (value instanceof Promise) return value.then(res => this.decodeFn(res));

    return this.decodeFn(value);
  }

  /**
   * Chains decoder result transformations
   * @param fn The transformation function
   */
  map<K>(fn: (value: R) => K): Decoder<K> {
    return new Decoder((value: V) => {
      const result = this.decodeFn(value);

      if (result instanceof DecoderError) return result;

      return ok(fn(result.value));
    });
  }
}

export class PromiseDecoder<R, V = unknown> {
  constructor(private decodeFn: (value: V) => Promise<DecoderResult<R>>) {}

  /**
   * Decodes a value of type <T> and returns a Result<R>
   */
  async decode(value: V) {
    return await this.decodeFn(await value);
  }

  /**
   * Chains decoder result transformations
   * @param fn The transformation function
   */
  map<K>(fn: (value: R) => K | Promise<K>): PromiseDecoder<K> {
    return new PromiseDecoder(async (value: V) => {
      const result = await this.decodeFn(value);

      if (result instanceof DecoderError) return result;

      return ok(await fn(result.value));
    });
  }
}

// export class Decoder<R extends DecoderResult<unknown> | Promise<DecoderResult<unknown>>, V = unknown> {
//   constructor(private decodeFn: (value: V) => R) {}

//   /**
//    * Question: is there a reason why someone might want to receive a promise inside a decoder function?
//    * Currently it is impossible to receive a promise value in a decoder function (though it is possible
//    * to return a promise).
//    */

//   /**
//    * Decodes a value of type <T> and returns a Result<R>
//    */
//   decode(value: Promise<V>): R extends Promise<unknown> ? R : Promise<R>;
//   decode(value: V): R;
//   decode(value: Promise<V> | V) {
//     if (value instanceof Promise) return value.then(res => this.decodeFn(res));

//     return this.decodeFn(value);
//   }

//   // /**
//   //  * Chains decoder result transformations
//   //  * @param fn The transformation function
//   //  */
//   // map<K>(fn: (value: Promise<T>) => Promise<K>): Decoder<K>;
//   // map<K>(fn: (value: T) => Promise<K>): Decoder<K>;
//   // map<K>(fn: (value: T) => K): Decoder<K>;
//   // map<K>(fn: (value: T) => K): Decoder<K> {
//   //   return new Decoder<K>((value: unknown) => {
//   //     const result = this.decodeFn(value);

//   //     if (result instanceof Promise) {
//   //       return result.then(next => (next instanceof Err) ? next : new Ok(fn(next.value)))
//   //     }

//   //     if (result instanceof Err) return result;

//   //     return new Ok(fn(result.value));
//   //   });
//   // }
// }
