// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder, AsyncDecoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { SimpleDecoderOptions } from "./util.ts";
import { DecoderResult } from "./decoder_result.ts";

const decoderName = "isMatchForPredicate";
const defaultMsg = "failed custom check";

export interface IsMatchForPredicateOptions extends SimpleDecoderOptions {
  promise?: boolean;
}

export function isMatchForPredicate<T>(
  fn: (value: T) => boolean | Promise<boolean>,
  options: IsMatchForPredicateOptions & { promise: true }
): AsyncDecoder<T, T>;
export function isMatchForPredicate<T>(
  fn: (value: T) => boolean,
  options?: IsMatchForPredicateOptions
): Decoder<T, T>;
export function isMatchForPredicate<T>(
  fn: (value: T) => boolean | Promise<boolean>,
  options: IsMatchForPredicateOptions = {}
): Decoder<T, T> | AsyncDecoder<T, T> {
  if (options.promise) {
    return new AsyncDecoder(
      async (input: T): Promise<DecoderResult<T>> =>
        (await fn(input))
          ? ok(input)
          : err(input, defaultMsg, decoderName, options)
    );
  }

  return new Decoder(
    (input: T): DecoderResult<T> =>
      fn(input) ? ok(input) : err(input, defaultMsg, decoderName, options)
  );
}
