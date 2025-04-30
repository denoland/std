// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { bgGreen, bgRed, bold, gray, green, red, white } from "./styles.ts";
import type { CommonDiffResult, DiffResult, DiffType } from "./types.ts";

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
  /**
   * Minimum number of total diff result lines to enable truncation.
   * @default {100}
   */
  minTruncationLength?: number;
  /**
   * Length of an individual common span in lines to trigger truncation.
   * @default {10}
   */
  truncationSpanLength?: number;
  /**
   * Length of context in lines either side of a truncated span in a truncated diff.
   * @default {2}
   */
  truncationContextLength?: number;
  /**
   * Length of context in lines to show at very start and end of a truncated diff.
   * @default {1}
   */
  truncationExtremityLength?: number;
}

/**
 * Builds a message based on the provided diff result.
 *
 * @param diffResult The diff result array.
 * @param options Optional parameters for customizing the message.
 *
 * @returns An array of strings representing the built message.
 *
 * @example Usage
 * ```ts no-assert
 * import { diffStr, buildMessage } from "@std/internal";
 *
 * const diffResult = diffStr("Hello, world!", "Hello, world");
 *
 * console.log(buildMessage(diffResult));
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
): string[] {
  diffResult = consolidateDiff(diffResult, options);
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

export function consolidateDiff(
  diffResult: ReadonlyArray<DiffResult<string>>,
  options: BuildMessageOptions,
): ReadonlyArray<DiffResult<string>> {
  const { minTruncationLength = 100 } = options;

  if (diffResult.length < minTruncationLength) {
    return diffResult;
  }

  const messages: DiffResult<string>[] = [];
  const commons: CommonDiffResult<string>[] = [];

  for (let i = 0; i < diffResult.length; ++i) {
    const result = diffResult[i]!;

    if (result.type === "common") {
      commons.push(result as typeof result & { type: typeof result.type });
    } else {
      messages.push(
        ...consolidateCommon(
          commons,
          commons.length === i ? "start" : "none",
          options,
        ),
      );
      commons.length = 0;
      messages.push(result);
    }
  }

  messages.push(...consolidateCommon(commons, "end", options));

  return messages;
}

export function consolidateCommon(
  commons: ReadonlyArray<CommonDiffResult<string>>,
  extremity: "start" | "end" | "none",
  options: BuildMessageOptions,
): ReadonlyArray<CommonDiffResult<string>> {
  const {
    truncationSpanLength = 10,
    truncationContextLength = 2,
    truncationExtremityLength = 1,
    stringDiff,
  } = options;
  const isStart = extremity === "start";
  const isEnd = extremity === "end";

  const startTruncationLength = isStart
    ? truncationExtremityLength
    : truncationContextLength;
  const endTruncationLength = isEnd
    ? truncationExtremityLength
    : truncationContextLength;

  if (commons.length <= truncationSpanLength) return commons;

  const [before, after] = [
    commons[startTruncationLength - 1]!.value,
    commons[commons.length - endTruncationLength]!.value,
  ];

  const indent = isStart
    ? getIndent(after)
    : isEnd
    ? getIndent(before)
    : commonIndent(before, after);

  return [
    ...commons.slice(0, startTruncationLength),
    {
      type: "truncation",
      value: `${indent}... ${
        commons.length - startTruncationLength - endTruncationLength
      } unchanged lines ...${stringDiff ? "\n" : ""}`,
    },
    ...commons.slice(-endTruncationLength),
  ];
}

function commonIndent(line1: string, line2: string): string {
  const [indent1, indent2] = [line1, line2].map(getIndent);
  return !indent1 || !indent2
    ? ""
    : indent1 === indent2
    ? indent1
    : indent1.startsWith(indent2)
    ? indent1.slice(0, indent2.length)
    : indent2.startsWith(indent1)
    ? indent2.slice(0, indent1.length)
    : "";
}

function getIndent(line: string): string {
  return line.match(/^\s+/g)?.[0] ?? "";
}
