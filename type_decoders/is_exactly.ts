import { Decoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface IExactlyDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isExactly<T>(exact: T, options: IExactlyDecoderOptions = {}) {
  return new Decoder(value =>
    value === exact
      ? ok(value as T)
      : err(value, `must be exactly ${JSON.stringify(exact)}`, options.msg, {
          decoderName: "isExactly"
        })
  );
}
