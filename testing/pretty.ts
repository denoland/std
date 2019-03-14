// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { red, green, white, gray, bold } from "../colors/mod.ts";
import { DiffType, DiffResult } from "./diff.ts";
import { format } from "./format.ts";

const CAN_NOT_DISPLAY = "[Cannot display]";
const TAB = "    ";

function header(assertionType: string): string[] {
  const messages = [];
  messages.push("");
  messages.push("");
  messages.push(`${red(bold("FAIL"))} : ${assertionType}`);
  messages.push("");
  return messages;
}

export function createStr(v: unknown): string {
  try {
    let s = format(v);
    // if
    if (s.split("\n").length > 1) {
      let arrS = s.split("\n");
      for (let i = 1; i < arrS.length; i++) {
        arrS[i] = `${TAB}${arrS[i]}`;
      }
      s = arrS.join("\n");
    }
    return s;
  } catch (e) {
    return red(CAN_NOT_DISPLAY);
  }
}

function createColor(diffType: DiffType): (s: string) => string {
  switch (diffType) {
    case DiffType.added:
      return (s: string) => green(bold(s));
    case DiffType.removed:
      return (s: string) => red(bold(s));
    default:
      return white;
  }
}

function createSign(diffType: DiffType): string {
  switch (diffType) {
    case DiffType.added:
      return `+${TAB}`;
    case DiffType.removed:
      return `-${TAB}`;
    default:
      return `${TAB}`;
  }
}

/**
 * Build the message to be associated with the Assertion Error
 * This method just prompt in a standard format the parameters.
 *
 * @param assertionType Name the assertion building the message
 * @param actual Actual object to be compared
 * @param expected Expected object to be compared with
 * @param message Message to be added to the Assertion error
 */
export function buildMessage(
  assertionType: string,
  actual: unknown,
  expected: unknown,
  message: string
): string[] {
  let messages = [];
  messages = messages.concat(header(assertionType));
  messages.push(`${TAB}${red(`Actual   : ${createStr(actual)}`)}`);
  messages.push(`${TAB}${green(`Expected : ${createStr(expected)}`)}`);
  messages.push(`${TAB}${white(message)}`);
  messages.push("");
  return messages;
}

/**
 * Build the message to be associated with the Assertion error
 * with the diff comparison of actual / expected.
 *
 * @param assertionType Name of the assertion building the message
 * @param diffResult result of the diff(actual,expected) see testing/diff.ts
 * @returns A string array of the builded message
 */
export function buildDiffMessage(
  assertionType: string,
  diffResult: ReadonlyArray<DiffResult<string>>
): string[] {
  let messages = [];
  messages = messages.concat(header(assertionType));
  messages.push(
    `${TAB}${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(
      bold("Expected")
    )}`
  );
  messages.push("");
  diffResult.forEach((result: DiffResult<string>) => {
    const c = createColor(result.type);
    messages.push(c(`${createSign(result.type)}${result.value}`));
  });
  messages.push("");

  return messages;
}
