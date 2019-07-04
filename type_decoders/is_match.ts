import { Decoder } from "./decoder.ts";
import { isChainOf } from "./is_chain_of.ts";
import { isString } from "./is_string.ts";
import { ok, err } from "./_util.ts";
import { ISimpleDecoderOptions } from "./helpers.ts";

const decoderName = "isMatch";

export interface IMatchDecoderOptions extends ISimpleDecoderOptions {}

export function isMatch(regex: RegExp, options: IMatchDecoderOptions = {}) {
  return isChainOf<[string, string], string, string>(
    [
      isString(),
      new Decoder<string, string>(value =>
        regex.test(value)
          ? ok(value)
          : err(
              value,
              `must be a string matching the pattern "${regex}"`,
              decoderName,
              options
            )
      )
    ],
    { decoderName: options.decoderName || decoderName }
  );
}
