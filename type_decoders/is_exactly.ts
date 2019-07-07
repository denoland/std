// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { SimpleDecoderOptions } from "./util.ts";
import { DecoderResult } from "./decoder_result.ts";

export type IsExactlyOptions = SimpleDecoderOptions;

export function isExactly<T>(
  exact: T,
  options: IsExactlyOptions = {}
): Decoder<T> {
  return new Decoder(
    (value): DecoderResult<T> =>
      value === exact
        ? ok(value as T)
        : err(value, `must be exactly ${exact}`, "isExactly", options)
  );
}
