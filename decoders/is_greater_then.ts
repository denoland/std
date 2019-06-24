import { Decoder } from './decoder.ts';
import { DecoderErrorMsg, ok, err } from './utils.ts';
import { isChainOf } from './is_chain_of.ts';
import { isAnyOf } from './is_any_of.ts';
import { isString } from './is_string.ts';
import { isNumber } from './is_number.ts';

export interface IGreaterThanDecoderOptions {
  msg?: DecoderErrorMsg;
}

export function isGreaterThan<T extends string | number>(
  value: T,
  args: IGreaterThanDecoderOptions = {},
): T extends string ? Decoder<string, string> : Decoder<number, number> {
  const msg = args.msg || 'must be a number';

  if (typeof value === 'string') {
    return new Decoder<string, string>(input =>
      input > value ? ok(input) : err(input, msg),
    ) as any;
  }

  return new Decoder<number, number>(input =>
    input > value ? ok(input) : err(input, msg),
  ) as any;
}
