import { Decoder } from "./decoder.ts";
import { ok, err } from "./util.ts";
import { DecoderErrorMsgArg } from "./decoder_result.ts";

export interface IInstanceOfDecoderOptions {
  msg?: DecoderErrorMsgArg;
}

export function isInstanceOf<T extends new (...args: any) => any>(
  clazz: T,
  options: IInstanceOfDecoderOptions = {}
) {
  return new Decoder(value =>
    value instanceof clazz
      ? ok(value as InstanceType<T>)
      : err(value, `must be an instance of ${clazz.name}`, options.msg, {
          decoderName: "isInstanceOf"
        })
  );
}
