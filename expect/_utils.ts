import { EqualOptions, EqualOptionUtil } from "./_types.ts";

export function buildEqualOptions(options: EqualOptionUtil): EqualOptions {
  const { customMessage, customTesters = [], strictCheck } = options || {};
  return {
    customTesters,
    msg: customMessage,
    strictCheck,
  };
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (value == null) {
    return false;
  } else {
    return typeof ((value as Record<string, unknown>).then) === "function";
  }
}
