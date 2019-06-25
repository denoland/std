import { Decoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface IBooleanDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isBoolean(options: IBooleanDecoderOptions = {}) {
  return new Decoder(value =>
    typeof value === "boolean"
      ? ok(value)
      : err(value, "must be a boolean", options.msg, {
          decoderName: "isBoolean"
        })
  );
}
