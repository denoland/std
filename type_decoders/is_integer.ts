import { Decoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface IIntegerDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isInteger(options: IIntegerDecoderOptions = {}) {
  return new Decoder(value =>
    Number.isInteger(value as any)
      ? ok(value as number)
      : err(value, "must be a whole number", options.msg, {
          decoderName: "isInteger"
        })
  );
}
