// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder } from "./decoder.ts";
import { ok } from "./_util.ts";
import { DecoderSuccess } from "./decoder_result.ts";

export function isAny<T = unknown>(): Decoder<T> {
  return new Decoder((value): DecoderSuccess<T> => ok(value as T));
}
