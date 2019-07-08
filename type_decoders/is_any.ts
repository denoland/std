// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder } from "./decoder.ts";
import { ok } from "./_util.ts";
import { DecoderSuccess } from "./decoder_result.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAny<T = any>(): Decoder<T> {
  return new Decoder((value): DecoderSuccess<T> => ok(value as T));
}
