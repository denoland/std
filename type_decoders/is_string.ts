import { Decoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface IStringDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isString(options: IStringDecoderOptions = {}) {
  return new Decoder(value =>
    typeof value === "string"
      ? ok(value)
      : err(value, "must be a string", options.msg, { decoderName: "isString" })
  );
}
