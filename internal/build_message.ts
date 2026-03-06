// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { bgGreen, bgRed, bold, gray, green, red, white } from "./styles.ts";
import type { DiffResult, DiffType } from "./types.ts";

/**
 * Colors the output of assertion diffs.
 *
 * @param diffType Difference type, either added or removed.
 * @param background If true, colors the background instead of the text.
 *
 * @returns A function that colors the input string.
 *
 * @example Usage
 * ```ts
 * import { createColor } from "@std/internal";
 * import { assertEquals } from "@std/assert";
 * import { bold, green, red, white } from "@std/fmt/colors";
 *
 * assertEquals(createColor("added")("foo"), green(bold("foo")));
 * assertEquals(createColor("removed")("foo"), red(bold("foo")));
 * assertEquals(createColor("common")("foo"), white("foo"));
 * ```
 */
export function createColor(
  diffType: DiffType,
  /**
   * TODO(@littledivy): Remove this when we can detect true color terminals. See
   * https://github.com/denoland/std/issues/2575.
   */
  background = false,
): (s: string) => string {
  switch (diffType) {
    case "added":
      return (s) => background ? bgGreen(white(s)) : green(bold(s));
    case "removed":
      return (s) => background ? bgRed(white(s)) : red(bold(s));
    case "truncation":
      return gray;
    default:
      return white;
  }
}

/**
 * Prefixes `+` or `-` in diff output.
 *
 * @param diffType Difference type, either added or removed
 *
 * @returns A string representing the sign.
 *
 * @example Usage
 * ```ts
 * import { createSign } from "@std/internal";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(createSign("added"), "+   ");
 * assertEquals(createSign("removed"), "-   ");
 * assertEquals(createSign("common"), "    ");
 * ```
 */
export function createSign(diffType: DiffType): string {
  switch (diffType) {
    case "added":
      return "+   ";
    case "removed":
      return "-   ";
    default:
      return "    ";
  }
}

/** Options for {@linkcode buildMessage}. */
export interface BuildMessageOptions {
  /**
   * Whether to output the diff as a single string.
   * @default {false}
   */
  stringDiff?: boolean;
}

/**
 * Builds a message based on the provided diff result.
 *
 * @param diffResult The diff result array.
 * @param options Optional parameters for customizing the message.
 * @param truncateDiff Function to truncate the diff (default is no truncation).
 *
 * @returns An array of strings representing the built message.
 *
 * @example Usage
 * ```ts no-assert
 * import { diffStr, buildMessage } from "@std/internal";
 *
 * diffStr("Hello, world!", "Hello, world");
 * // [
 * //   "",
 * //   "",
 * //   "    [Diff] Actual / Expected",
 * //   "",
 * //   "",
 * //   "-   Hello, world!",
 * //   "+   Hello, world",
 * //   "",
 * // ]
 * ```
 */
export function buildMessage(
  diffResult: ReadonlyArray<DiffResult<string>>,
  options: BuildMessageOptions = {},
  truncateDiff?: (
    diffResult: ReadonlyArray<DiffResult<string>>,
    stringDiff: boolean,
    contextLength?: number | null,
  ) => ReadonlyArray<DiffResult<string>>,
): string[] {
  if (truncateDiff != null) {
    diffResult = truncateDiff(diffResult, options.stringDiff ?? false);
  }

  const { stringDiff = false } = options;
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

    const line = result.type === "added" || result.type === "removed"
      ? result.details?.map((detail) =>
        detail.type !== "common"
          ? createColor(detail.type, true)(detail.value)
          : detail.value
      ).join("") ?? result.value
      : result.value;

    return color(`${createSign(result.type)}${line}`);
  });
  messages.push(...(stringDiff ? [diffMessages.join("")] : diffMessages), "");
  return messages;
}
