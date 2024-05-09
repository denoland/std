// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { bgGreen, bgRed, bold, gray, green, red, white } from "@std/fmt/colors";
import type { DiffResult, DiffType } from "./_types.ts";

/**
 * Colors the output of assertion diffs
 * @param diffType Difference type, either added or removed
 */
function createColor(
  diffType: DiffType,
  { background = false } = {},
): (s: string) => string {
  // TODO(@littledivy): Remove this when we can detect
  // true color terminals.
  // https://github.com/denoland/deno_std/issues/2575
  background = false;
  switch (diffType) {
    case "added":
      return (s: string): string =>
        background ? bgGreen(white(s)) : green(bold(s));
    case "removed":
      return (s: string): string => background ? bgRed(white(s)) : red(bold(s));
    default:
      return white;
  }
}

/**
 * Prefixes `+` or `-` in diff output
 * @param diffType Difference type, either added or removed
 */
function createSign(diffType: DiffType): string {
  switch (diffType) {
    case "added":
      return "+   ";
    case "removed":
      return "-   ";
    default:
      return "    ";
  }
}

export function buildMessage(
  diffResult: ReadonlyArray<DiffResult<string>>,
  { stringDiff = false } = {},
): string[] {
  const messages: string[] = [];
  const diffMessages: string[] = [];
  messages.push("");
  messages.push("");
  messages.push(
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
      green(bold("Expected"))
    }`,
  );
  messages.push("");
  messages.push("");
  diffResult.forEach((result) => {
    const c = createColor(result.type);
    const line = result.details?.map((detail) =>
      detail.type !== "common"
        ? createColor(detail.type, { background: true })(detail.value)
        : detail.value
    ).join("") ?? result.value;
    diffMessages.push(c(`${createSign(result.type)}${line}`));
  });
  messages.push(...(stringDiff ? [diffMessages.join("")] : diffMessages));
  messages.push("");

  return messages;
}
