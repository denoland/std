// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { truncateDiff } from "./_truncate_build_message.ts";
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

/** The environment variable used for setting diff context length. */
export const DIFF_CONTEXT_LENGTH = "DIFF_CONTEXT_LENGTH";
function getTruncationEnvVar() {
  // deno-lint-ignore no-explicit-any
  const { Deno, process } = globalThis as any;

  if (typeof Deno === "object") {
    const permissionStatus = Deno.permissions.querySync({
      name: "env",
      variable: DIFF_CONTEXT_LENGTH,
    }).state ?? "granted";

    return permissionStatus === "granted"
      ? Deno.env.get(DIFF_CONTEXT_LENGTH) ?? null
      : null;
  }
  const nodeEnv = process?.getBuiltinModule?.("node:process")?.env as
    | Partial<Record<string, string>>
    | undefined;
  return typeof nodeEnv === "object"
    ? nodeEnv[DIFF_CONTEXT_LENGTH] ?? null
    : null;
}

function getTruncationContextLengthFromEnv() {
  const envVar = getTruncationEnvVar();
  if (envVar == null) return null;
  const truncationContextLength = parseInt(envVar);
  return Number.isFinite(truncationContextLength) && truncationContextLength > 0
    ? truncationContextLength
    : null;
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
 * @param contextLength Truncation context length. Explicitly passing `contextLength` is currently only used for testing.
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
  contextLength: number | null = null,
): string[] {
  contextLength ??= getTruncationContextLengthFromEnv();
  if (contextLength != null) {
    diffResult = truncateDiff(
      diffResult,
      options.stringDiff ?? false,
      contextLength,
    );
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
