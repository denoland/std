import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { SimpleDecoderOptions } from "./util.ts";
import { DecoderResult } from "./decoder_result.ts";

export type IsNumberOptions = SimpleDecoderOptions;

export function isNumber(options: IsNumberOptions = {}): Decoder<number> {
  return new Decoder(
    (value): DecoderResult<number> =>
      Number.isFinite(value)
        ? ok(value as number)
        : err(value, "must be a number", "isNumber", options)
  );
}
