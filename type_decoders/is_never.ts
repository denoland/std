import { Decoder } from "./decoder.ts";
import { err } from "./_util.ts";
import { ISimpleDecoderOptions } from "./helpers.ts";

export interface INeverDecoderOptions extends ISimpleDecoderOptions {}

export function isNever(options: INeverDecoderOptions = {}) {
  return new Decoder<never>(value =>
    err(value, "must not be present", "isNever", options)
  );
}
