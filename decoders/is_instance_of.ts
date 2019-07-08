// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { SimpleDecoderOptions } from "./util.ts";
import { DecoderResult } from "./decoder_result.ts";

export type IsInstanceOfOptions = SimpleDecoderOptions;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isInstanceOf<T extends new (...args: any) => any>(
  clazz: T,
  options: IsInstanceOfOptions = {}
): Decoder<InstanceType<T>> {
  return new Decoder(
    (value): DecoderResult<InstanceType<T>> =>
      value instanceof clazz
        ? ok(value as InstanceType<T>)
        : err(
            value,
            `must be an instance of ${clazz.name}`,
            "isInstanceOf",
            options
          )
  );
}
