import { Decoder, PromiseDecoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

const decoderName = "isCheckedWith";
const defaultMsg = "failed custom check";

export interface ICheckedWithDecoderOptions {
  msg?: DecoderErrorMsgArg;
  promise?: boolean;
}

export function isCheckedWith<T>(
  fn: (value: T) => boolean,
  options?: ICheckedWithDecoderOptions
): Decoder<T, T>;
export function isCheckedWith<T>(
  fn: (value: T) => Promise<boolean>,
  options: ICheckedWithDecoderOptions & { promise: true }
): PromiseDecoder<T, T>;
export function isCheckedWith<T>(
  fn: (value: T) => boolean | Promise<boolean>,
  options: ICheckedWithDecoderOptions = {}
) {
  if (options.promise) {
    return new PromiseDecoder(async (input: T) =>
      (await fn(input))
        ? ok(input)
        : err(input, defaultMsg, options.msg, { decoderName })
    );
  }

  return new Decoder((input: T) =>
    fn(input) ? ok(input) : err(input, defaultMsg, options.msg, { decoderName })
  );
}
