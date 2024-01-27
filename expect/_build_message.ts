// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { red } from "../fmt/colors.ts";
import { CAN_NOT_DISPLAY } from './_constants.ts';
import { buildMessage, diffstr } from "./_diff.ts";

export function buildEqualErrorMessage<T>(actual: T, expected: T, msg?: string): string {
  const msgSuffix = msg ? `: ${msg}` : ".";
  let message = `Values are not equal${msgSuffix}`;

  try {
    const stringDiff = (typeof actual === "string") &&
      (typeof expected === "string");
    const diffResult = diffstr(actual as string, expected as string)
    const diffMsg = buildMessage(diffResult, { stringDiff }).join("\n");
    message = `${message}\n${diffMsg}`;
  } catch {
    message = `${message}\n${red(CAN_NOT_DISPLAY)} + \n\n`;
  }

  return message;
}

export function buildNotEqualErrorMessage<T>(actual: T, expected: T, msg?: string): string {
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
