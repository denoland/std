import { Spec, ValidatorSpec } from "./types.ts";
import { EnvError } from "./errors.ts";

// Simplified adaptation of https://github.com/validatorjs/validator.js/blob/master/src/lib/isFQDN.js
const isFQDN = (input: string) => {
  if (!input.length) return false;
  const parts = input.split(".");
  for (let part, i = 0; i < parts.length; i++) {
    part = parts[i];
    if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) return false;
    if (/[\uff01-\uff5e]/.test(part)) return false; // disallow full-width chars
    if (part[0] === "-" || part[part.length - 1] === "-") return false;
  }
  return true;
};

// "best effort" regex-based IP address check
// If you want a more exhaustive check, create your own custom validator, perhaps wrapping this
// implementation (the source of the ipv4 regex below): https://github.com/validatorjs/validator.js/blob/master/src/lib/isIP.js
const ipv4Regex =
  /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
const ipv6Regex = /([a-f0-9]+:+)+[a-f0-9]+/;
const isIP = (input: string) => {
  if (!input.length) return false;
  return ipv4Regex.test(input) || ipv6Regex.test(input);
};

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/; // intentionally non-exhaustive

export const makeValidator = <T>(parseFn: (input: string) => T) => {
  return function (spec?: Spec<T>): ValidatorSpec<T> {
    return { ...spec, _parse: parseFn };
  };
};

// The reason for the function wrapper is to enable the <T extends boolean = boolean> type parameter
// that enables better type inference. For more context, see
// https://github.com/af/envalid/pull/118
export function bool<T extends boolean = boolean>(spec?: Spec<T>) {
  return makeValidator((input: string | boolean) => {
    switch (input) {
      case true:
      case "true":
      case "t":
      case "1":
        return true as T;
      case false:
      case "false":
      case "f":
      case "0":
        return false as T;
      default:
        throw new EnvError(`Invalid bool input: "${input}"`);
    }
  })(spec);
}

export function num<T extends number = number>(spec?: Spec<T>) {
  return makeValidator((input: string) => {
    const coerced = parseFloat(input);
    if (Number.isNaN(coerced)) {
      throw new EnvError(`Invalid number input: "${input}"`);
    }
    return coerced as T;
  })(spec);
}

export function str<T extends string = string>(spec?: Spec<T>) {
  return makeValidator((input: string) => {
    if (typeof input === "string") return input as T;
    throw new EnvError(`Not a string: "${input}"`);
  })(spec);
}

export function email<T extends string = string>(spec?: Spec<T>) {
  return makeValidator((x: string) => {
    if (EMAIL_REGEX.test(x)) return x as T;
    throw new EnvError(`Invalid email address: "${x}"`);
  })(spec);
}

export function host<T extends string = string>(spec?: Spec<T>) {
  return makeValidator((input: string) => {
    if (!isFQDN(input) && !isIP(input)) {
      throw new EnvError(`Invalid host (domain or ip): "${input}"`);
    }
    return input as T;
  })(spec);
}

export function port<T extends number = number>(spec?: Spec<T>) {
  return makeValidator((input: string) => {
    const coerced = +input;
    if (
      Number.isNaN(coerced) ||
      `${coerced}` !== `${input}` ||
      coerced % 1 !== 0 ||
      coerced < 1 ||
      coerced > 65535
    ) {
      throw new EnvError(`Invalid port input: "${input}"`);
    }
    return coerced as T;
  })(spec);
}

export function url<T extends string = string>(spec?: Spec<T>) {
  return makeValidator((x: string) => {
    try {
      new URL(x);
      return x as T;
    } catch (_err) {
      throw new EnvError(`Invalid url: "${x}"`);
    }
  })(spec);
}

/**
 * It's recommended that you provide an explicit type parameter for json validation
 * if you're using TypeScript:
 *
 * ```
 * cleanEnv({
 *   MY_VAR: json<{ foo: number }>({ default: { foo: 123 } }),
 * })
 * ```
 *
 * Otherwise, the output will be typed as `any`.
 */
// deno-lint-ignore no-explicit-any
export function json<T = any>(spec?: Spec<T>) {
  return makeValidator<T>((x: string) => {
    try {
      return JSON.parse(x) as T;
    } catch (_err) {
      throw new EnvError(`Invalid json: "${x}"`);
    }
  })(spec);
}
