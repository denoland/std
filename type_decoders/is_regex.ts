import { Decoder } from "./decoder.ts";
import { isChainOf } from "./is_chain_of.ts";
import { isString } from "./is_string.ts";
import { ok, err, changeErrorDecoderName } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface IRegexDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isRegex(regex: RegExp, options: IRegexDecoderOptions = {}) {
  return isChainOf(
    [
      isString(),
      new Decoder<string, string>(value =>
        regex.test(value)
          ? ok(value)
          : err(value, `must be a string matching the pattern "${regex}"`)
      )
    ],
    { msg: changeErrorDecoderName("isRegex", options.msg) }
  );
}
