import { Decoder } from "./decoder.ts";
import { err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface INeverDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isNever(options: INeverDecoderOptions = {}) {
  return new Decoder<never>(value =>
    err(value, "must not be present", options.msg, { decoderName: "isNever" })
  );
}
