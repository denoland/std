// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { bgGreen, bgRed, bold, gray, green, red, white } from "@std/fmt/colors";
import type { DiffResult, DiffType } from "./_types.ts";

/**
 * Colors the output of assertion diffs
 *
 * @param diffType Difference type, either added or removed
 * @param background If true, colors the background instead of the text.
 *
 * @returns A function that colors the input string
 *
 * TODO(@littledivy): Remove this when we can detect true color terminals. See
 * https://github.com/denoland/deno_std/issues/2575.
 */
function createColor(
  diffType: DiffType,
  background = false,
): (s: string) => string {
  background = false;
  switch (diffType) {
    case "added":
      return (s) => background ? bgGreen(white(s)) : green(bold(s));
    case "removed":
      return (s) => background ? bgRed(white(s)) : red(bold(s));
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

/**
 * Builds a message based on the provided diff result.
 *
 * @param diffResult The diff result array.
 * @param options Optional parameters for customizing the message.
 * @param options.stringDiff Whether to output the diff as a single string.
 *
 * @returns An array of strings representing the built message.
 */
export function buildMessage(
  diffResult: ReadonlyArray<DiffResult<string>>,
  { stringDiff = false } = {},
): string[] {
  const messages = [
    "",
    "",
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
      green(bold("Expected"))
    }`,
    "",
    "",
  ];
  const diffMessages = diffResult.map((result) => {
    const color = createColor(result.type);
    const line = result.details?.map((detail) =>
      detail.type !== "common"
        ? createColor(detail.type, true)(detail.value)
        : detail.value
    ).join("") ?? result.value;
    return color(`${createSign(result.type)}${line}`);
  });
  messages.push(...(stringDiff ? [diffMessages.join("")] : diffMessages), "");
  return messages;
}
