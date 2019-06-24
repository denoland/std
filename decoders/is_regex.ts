import { Decoder } from './decoder.ts';
import { isChainOf } from './is_chain_of.ts';
import { isString } from './is_string.ts';
import { DecoderErrorMsg, ok, err } from './utils.ts';

export interface IRegexDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isRegex(regex: RegExp, args: IRegexDecoderOptions = {}) {
  const msg = args.msg || `must match the pattern "${regex}"`;

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
