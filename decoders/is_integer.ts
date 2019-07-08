// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { SimpleDecoderOptions } from "./util.ts";
import { DecoderResult } from "./decoder_result.ts";

export type IsIntegerOptions = SimpleDecoderOptions;

export function isInteger(options: IsIntegerOptions = {}): Decoder<number> {
  return new Decoder(
    (value): DecoderResult<number> =>
      Number.isInteger(value)
        ? ok(value as number)
        : err(value, "must be a whole number", "isInteger", options)
  );
}
