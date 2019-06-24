import { Decoder } from './decoder.ts';
import { isChainOf } from './is_chain_of.ts';
import { isString } from './is_string.ts';
import { DecoderErrorMsg, ok, err } from './util.ts';

export interface IRegexDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isRegex(regex: RegExp, options: IRegexDecoderOptions = {}) {
  const msg = options.msg || `must be a string matching the pattern "${regex}"`;

  return isChainOf(
    [
      isString(),
      new Decoder<string, string>(value =>
        regex.test(value)
          ? ok(value)
          : err(value, msg),
      ),
    ],
    { msg },
  );
}
