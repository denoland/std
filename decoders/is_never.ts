// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder } from "./decoder.ts";
import { err } from "./_util.ts";
import { SimpleDecoderOptions } from "./util.ts";
import { DecoderError } from "./decoder_result.ts";

export type IsNeverOptions = SimpleDecoderOptions;

export function isNever(options: IsNeverOptions = {}): Decoder<never> {
  return new Decoder<never>(
    (value): DecoderError[] =>
      err(value, "must not be present", "isNever", options)
  );
}
