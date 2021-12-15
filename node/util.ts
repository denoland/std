// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { promisify } from "./_util/_util_promisify.ts";
import { callbackify } from "./_util/_util_callbackify.ts";
import { deprecate } from "./internal/util.js";
import { inspect, stripVTControlCharacters } from "./internal/util/inspect.js";
import { ERR_INVALID_ARG_TYPE, ERR_OUT_OF_RANGE, errorMap } from "./_errors.ts";
import * as types from "./internal/util/types.ts";
import { Buffer } from "./buffer.ts";
import { isDeepStrictEqual } from "./internal/util/comparisons.ts";

export {
  callbackify,
  deprecate,
  inspect,
  promisify,
  stripVTControlCharacters,
  types,
};

const NumberIsSafeInteger = Number.isSafeInteger;

/** @deprecated - use `Array.isArray()` instead. */
export function isArray(value: unknown): boolean {
  return Array.isArray(value);
}

/** @deprecated - use `typeof value === "boolean" || value instanceof Boolean` instead. */
export function isBoolean(value: unknown): boolean {
  return typeof value === "boolean" || value instanceof Boolean;
}

/** @deprecated - use `value === null` instead. */
export function isNull(value: unknown): boolean {
  return value === null;
}

/** @deprecated - use `value === null || value === undefined` instead. */
export function isNullOrUndefined(value: unknown): boolean {
  return value === null || value === undefined;
}

/** @deprecated - use `typeof value === "number" || value instanceof Number` instead. */
export function isNumber(value: unknown): boolean {
  return typeof value === "number" || value instanceof Number;
}

/** @deprecated - use `typeof value === "string" || value instanceof String` instead. */
export function isString(value: unknown): boolean {
  return typeof value === "string" || value instanceof String;
}

/** @deprecated - use `typeof value === "symbol"` instead. */
export function isSymbol(value: unknown): boolean {
  return typeof value === "symbol";
}

/** @deprecated - use `value === undefined` instead. */
export function isUndefined(value: unknown): boolean {
  return value === undefined;
}

/** @deprecated - use `value !== null && typeof value === "object"` instead. */
export function isObject(value: unknown): boolean {
  return value !== null && typeof value === "object";
}

/** @deprecated - use `e instanceof Error` instead. */
export function isError(e: unknown): boolean {
  return e instanceof Error;
}

/** @deprecated - use `typeof value === "function"` instead. */
export function isFunction(value: unknown): boolean {
  return typeof value === "function";
}

/** @deprecated Use util.types.RegExp() instead. */
export function isRegExp(value: unknown): boolean {
  return types.isRegExp(value);
}

/** @deprecated Use util.types.isDate() instead. */
export function isDate(value: unknown): boolean {
  return types.isDate(value);
}

/** @deprecated - use `value === null || (typeof value !== "object" && typeof value !== "function")` instead. */
export function isPrimitive(value: unknown): boolean {
  return (
    value === null || (typeof value !== "object" && typeof value !== "function")
  );
}

/** @deprecated  Use Buffer.isBuffer() instead. */
export function isBuffer(value: unknown): boolean {
  return Buffer.isBuffer(value);
}

/** @deprecated Use Object.assign() instead. */
export function _extend(
  target: Record<string, unknown>,
  source: unknown,
): Record<string, unknown> {
  // Don't do anything if source isn't an object
  if (source === null || typeof source !== "object") return target;

  const keys = Object.keys(source!);
  let i = keys.length;
  while (i--) {
    target[keys[i]] = (source as Record<string, unknown>)[keys[i]];
  }
  return target;
}

/**
 * Returns a system error name from an error code number.
 * @param code error code number
 */
export function getSystemErrorName(code: number): string | undefined {
  if (typeof code !== "number") {
    throw new ERR_INVALID_ARG_TYPE("err", "number", code);
  }
  if (code >= 0 || !NumberIsSafeInteger(code)) {
    throw new ERR_OUT_OF_RANGE("err", "a negative integer", code);
  }
  return errorMap.get(code)?.[0];
}

function toReplace(specifier: string, value: unknown): string {
  if (specifier === "%s") {
    if (typeof value === "string" || value instanceof String) {
      return value as string;
    } else return Deno.inspect(value, { depth: 1 });
  }
  if (specifier === "%d") {
    if (typeof value === "bigint") {
      return value + "n";
    }
    return Number(value).toString();
  }
  if (specifier === "%i") {
    if (typeof value === "bigint") {
      return value + "n";
    }
    return parseInt(value as string).toString();
  }
  if (specifier === "%f") {
    return parseFloat(value as string).toString();
  }
  if (specifier === "%j") {
    try {
      return JSON.stringify(value);
    } catch (e) {
      // nodeJS => 'cyclic object value' , deno => 'Converting circular structure to JSON ...'
      // ref: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify>
      if (e instanceof TypeError && e.message.match(/cyclic|circular/)) {
        return "[Circular]";
      } else throw e;
    }
  }
  if (specifier === "%o") {
    return Deno.inspect(value, { showHidden: true, showProxy: true });
  }
  if (specifier === "%O") {
    return Deno.inspect(value);
  }
  if (specifier === "%c") {
    return "";
  }
  return "";
}

// ref: <https://nodejs.org/docs/latest-v16.x/api/console.html#console_console_log_data_args>
// ref: <https://nodejs.org/docs/latest-v16.x/api/util.html#util_util_format_format_args>
// modified from <https://deno.land/std@0.105.0/node/util.ts#L247-L266>
export function format(...args: unknown[]) {
  const replacement: [number, string][] = [];
  const formatSpecifierRx = /%(s|d|i|f|j|o|O|c|%)/g;
  const hasFormatTemplate = args.length > 0 &&
    (typeof args[0] === "string" || args[0] instanceof String);
  const formatTemplate = hasFormatTemplate ? (args[0] as string) : "";
  let i = hasFormatTemplate ? 1 : 0;
  let arr: RegExpExecArray | null = null;
  let done = false;
  while ((arr = formatSpecifierRx.exec(formatTemplate)) !== null && !done) {
    if (arr[0] === "%%") {
      replacement.push([arr["index"], "%"]);
    } else if (i < args.length) {
      replacement.push([arr["index"], toReplace(arr[0], args[i])]);
      i++;
    } else done = true;
  }
  const lastArgUsed = i;
  let result = "";
  let last = 0;
  for (let i = 0; i < replacement.length; i++) {
    const item = replacement[i];
    result += formatTemplate.slice(last, item[0]);
    result += item[1];
    last = item[0] + 2;
  }
  result += formatTemplate.slice(last);
  for (let i = lastArgUsed; i < args.length; i++) {
    if (i > 0) result += " ";
    if (typeof args[i] === "string") {
      result += args[i];
    } else result += Deno.inspect(args[i], { colors: true });
  }
  return result;
}
/**
 * https://nodejs.org/api/util.html#util_util_inherits_constructor_superconstructor
 * @param ctor Constructor function which needs to inherit the prototype.
 * @param superCtor Constructor function to inherit prototype from.
 */
export function inherits<T, U>(
  ctor: new (...args: unknown[]) => T,
  superCtor: new (...args: unknown[]) => U,
) {
  if (ctor === undefined || ctor === null) {
    throw new ERR_INVALID_ARG_TYPE("ctor", "Function", ctor);
  }

  if (superCtor === undefined || superCtor === null) {
    throw new ERR_INVALID_ARG_TYPE("superCtor", "Function", superCtor);
  }

  if (superCtor.prototype === undefined) {
    throw new ERR_INVALID_ARG_TYPE(
      "superCtor.prototype",
      "Object",
      superCtor.prototype,
    );
  }
  Object.defineProperty(ctor, "super_", {
    value: superCtor,
    writable: true,
    configurable: true,
  });
  Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
}

import { _TextDecoder, _TextEncoder } from "./_utils.ts";

/** The global TextDecoder */
export type TextDecoder = import("./_utils.ts")._TextDecoder;
export const TextDecoder = _TextDecoder;

/** The global TextEncoder */
export type TextEncoder = import("./_utils.ts")._TextEncoder;
export const TextEncoder = _TextEncoder;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * @returns 26 Feb 16:19:34
 */
function timestamp(): string {
  const d = new Date();
  const t = [
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
  ].join(":");
  return `${(d.getDate())} ${months[(d).getMonth()]} ${t}`;
}

/**
 * Log is just a thin wrapper to console.log that prepends a timestamp
 * @deprecated
 */
// deno-lint-ignore no-explicit-any
function log(...args: any[]): void {
  console.log("%s - %s", timestamp(), format(...args));
}

// TODO(kt3k): implement debuglog correctly
function debuglog() {
  return console.log;
}

export default {
  format,
  inspect,
  isArray,
  isBoolean,
  isNull,
  isNullOrUndefined,
  isNumber,
  isString,
  isSymbol,
  isUndefined,
  isObject,
  isError,
  isFunction,
  isRegExp,
  isDate,
  isPrimitive,
  isBuffer,
  _extend,
  getSystemErrorName,
  deprecate,
  callbackify,
  promisify,
  inherits,
  types,
  stripVTControlCharacters,
  TextDecoder,
  TextEncoder,
  log,
  debuglog,
  isDeepStrictEqual,
};
