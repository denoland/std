import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { ISimpleDecoderOptions } from "./helpers.ts";

export interface IStringDecoderOptions extends ISimpleDecoderOptions {}

export function isString(options: IStringDecoderOptions = {}) {
  return new Decoder(value =>
    typeof value === "string"
      ? ok(value)
      : err(value, "must be a string", "isString", options)
  );
}
