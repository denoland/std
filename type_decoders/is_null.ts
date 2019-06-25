import { Decoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface INullDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isNull(options: INullDecoderOptions = {}) {
  return new Decoder(value =>
    value === null
      ? ok(value as null)
      : err(value, "must be null", options.msg, { decoderName: "isNull" })
  );
}
