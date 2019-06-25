import { Decoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface INumberDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isNumber(options: INumberDecoderOptions = {}) {
  return new Decoder(value =>
    Number.isFinite(value as any)
      ? ok(value as number)
      : err(value, "must be a number", options.msg, {
          decoderName: "isNumber"
        })
  );
}
