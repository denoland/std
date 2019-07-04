import { Decoder } from "./decoder.ts";
import { ok, err } from "./_util.ts";
import { ISimpleDecoderOptions } from "./helpers.ts";

export interface IInstanceOfDecoderOptions extends ISimpleDecoderOptions {}

export function isInstanceOf<T extends new (...args: any) => any>(
  clazz: T,
  options: IInstanceOfDecoderOptions = {}
) {
  return new Decoder(value =>
    value instanceof clazz
      ? ok(value as InstanceType<T>)
      : err(
          value,
          `must be an instance of ${clazz.name}`,
          "isInstanceOf",
          options
        )
  );
}
