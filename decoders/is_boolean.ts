// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { SimpleDecoderOptions } from "./util.ts";
import { DecoderResult } from "./decoder_result.ts";

export type IsBooleanOptions = SimpleDecoderOptions;

export function isBoolean(options: IsBooleanOptions = {}): Decoder<boolean> {
  return new Decoder(
    (value): DecoderResult<boolean> =>
      typeof value === "boolean"
        ? ok(value)
        : err(value, "must be a boolean", "isBoolean", options)
  );
}
