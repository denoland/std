import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { SimpleDecoderOptions } from "./util.ts";
import { DecoderResult } from "./decoder_result.ts";

const decoderName = "isMatch";

export type IsMatchOptions = SimpleDecoderOptions;

export function isMatch(
  regex: RegExp,
  options: IsMatchOptions = {}
): Decoder<string> {
  return new Decoder(
    (value): DecoderResult<string> => {
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
    }
  );
}
