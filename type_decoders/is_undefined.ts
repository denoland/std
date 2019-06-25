import { Decoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface IUndefinedDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isUndefined(options: IUndefinedDecoderOptions = {}) {
  return new Decoder<undefined>(value =>
    value === undefined
      ? ok(value)
      : err(value, "must be undefined", options.msg, {
          decoderName: "isUndefined"
        })
  );
}
