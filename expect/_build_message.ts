// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { buildMessage, diff, diffStr, format } from "@std/internal";
import type { EqualOptions } from "./_types.ts";

type EqualErrorMessageOptions = Pick<
  EqualOptions,
  "formatter" | "msg"
>;

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function buildEqualErrorMessage<T>(
  actual: T,
  expected: T,
  options: EqualErrorMessageOptions,
): string {
  const { formatter = format, msg } = options || {};
  const msgSuffix = msg ? `: ${msg}` : ".";
  const actualString = formatter(actual);
  const expectedString = formatter(expected);

  let message = `Values are not equal${msgSuffix}`;

  const stringDiff = isString(actual) && isString(expected);
  const diffResult = stringDiff
    ? diffStr(actual, expected)
    : diff(actualString.split("\n"), expectedString.split("\n"));
  const diffMsg = buildMessage(diffResult, { stringDiff }).join("\n");
  message = `${message}\n${diffMsg}`;

  return message;
}

export function buildNotEqualErrorMessage<T>(
  actual: T,
  expected: T,
  options: EqualErrorMessageOptions,
): string {
  const { msg } = options || {};
  const actualString = String(actual);
  const expectedString = String(expected);

  const msgSuffix = msg ? `: ${msg}` : ".";
  return `Expected actual: ${actualString} not to be: ${expectedString}${msgSuffix}`;
}
