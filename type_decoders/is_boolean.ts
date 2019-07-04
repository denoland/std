import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { ISimpleDecoderOptions } from "./helpers.ts";

export interface IBooleanDecoderOptions extends ISimpleDecoderOptions {}

export function isBoolean(options: IBooleanDecoderOptions = {}) {
  return new Decoder(value =>
    typeof value === "boolean"
      ? ok(value)
      : err(value, "must be a boolean", "isBoolean", options)
  );
}
