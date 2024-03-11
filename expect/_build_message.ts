// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { red } from "../fmt/colors.ts";
import { CAN_NOT_DISPLAY } from "./_constants.ts";
import { buildMessage, diff, diffstr } from "./_diff.ts";
import { format } from "./_format.ts";
import type { EqualOptions } from "./_types.ts";

type EqualErrorMessageOptions = Pick<
  EqualOptions,
  "formatter" | "msg"
>;

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

  try {
    const stringDiff = (typeof actual === "string") &&
      (typeof expected === "string");
    const diffResult = stringDiff
      ? diffstr(actual as string, expected as string)
      : diff(actualString.split("\n"), expectedString.split("\n"));
    const diffMsg = buildMessage(diffResult, { stringDiff }).join("\n");
    message = `${message}\n${diffMsg}`;
  } catch {
    message = `${message}\n${red(CAN_NOT_DISPLAY)} + \n\n`;
  }

  return message;
}

export function buildNotEqualErrorMessage<T>(
  actual: T,
  expected: T,
  options: EqualErrorMessageOptions,
): string {
  const { msg } = options || {};
  let actualString: string;
  let expectedString: string;

  try {
    actualString = String(actual);
  } catch {
    actualString = CAN_NOT_DISPLAY;
  }
  try {
    expectedString = String(expected);
  } catch {
    expectedString = CAN_NOT_DISPLAY;
  }

  const msgSuffix = msg ? `: ${msg}` : ".";
  return `Expected actual: ${actualString} not to be: ${expectedString}${msgSuffix}`;
}
