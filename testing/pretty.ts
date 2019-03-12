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
    return format(v);
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
      return `${TAB}+   `;
    case DiffType.removed:
      return `${TAB}-   `;
    default:
      return `${TAB}   `;
  }
}

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
