import { Decoder } from './decoder.ts';
import { DecoderSuccess, DecoderError, DecoderResult } from './decoder_result.ts';
import { NestedDecoderErrorMsg, err, ok } from './utils.ts';

type SubtractOne<T extends number> = [
  -1,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19
][T];

/**
 * Plucks the last type in a tuple of length 20 or less.
 * Else returns the first type in a tuple.
 */
export type ChainOfDecoderReturn<T extends unknown[]> = T[SubtractOne<
  T['length']
>] extends Decoder<infer R>
  ? R
  : T[0];

export interface IChainOfDecoderOptions {
  msg?: NestedDecoderErrorMsg;
}

export function isChainOf<
  T extends Array<Decoder<unknown>>,
  R = ChainOfDecoderReturn<T>
>(decoders: T, options: IChainOfDecoderOptions = {}): Decoder<R> {
  const msg = options.msg;

  return new Decoder<R>(value => {
    const result = decoders.reduce((prev, curr) => {
      return (prev instanceof DecoderSuccess
        ? curr.decode(prev.value)
        : prev) as DecoderResult<R>;
    }, ok<R>(value as R));

    if (result instanceof DecoderError) {
      return err(result.value, msg || result.message, {
        child: result,
        location: result.location,
      });
    }

    return result;
  });
}
