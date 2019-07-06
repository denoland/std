import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { ISimpleDecoderOptions } from "./util.ts";

const decoderName = "isMatch";

export interface IMatchDecoderOptions extends ISimpleDecoderOptions {}

export function isMatch(regex: RegExp, options: IMatchDecoderOptions = {}) {
  return new Decoder(value => {
    if (typeof value !== "string") {
      return err(value, `must be a string`, decoderName, options);
    }

    return regex.test(value)
      ? ok(value)
      : err(
          value,
          `must be a string matching the pattern "${regex}"`,
          decoderName,
          options
        );
  });
}
