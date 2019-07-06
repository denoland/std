import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { ISimpleDecoderOptions } from "./util.ts";

export interface IIntegerDecoderOptions extends ISimpleDecoderOptions {}

export function isInteger(options: IIntegerDecoderOptions = {}) {
  return new Decoder(value =>
    Number.isInteger(value as any)
      ? ok(value as number)
      : err(value, "must be a whole number", "isInteger", options)
  );
}
