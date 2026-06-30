// Copyright 2018-2026 the Deno authors. MIT license.

import { buildMessage } from "@std/internal/build-message";
import { diff } from "@std/internal/diff";
import { diffStr } from "@std/internal/diff-str";
import { format } from "@std/internal/format";
import type { EqualOptions } from "./_types.ts";

type EqualErrorMessageOptions =
  & Pick<
    EqualOptions,
    "formatter" | "msg"
  >
  & {
    /**
     * Overrides the default "Values are not equal." headline. Set by matchers
     * (such as toMatchObject) that don't actually test for equality and would
     * otherwise mislead the reader.
     */
    summary?: string;
  };

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function buildEqualErrorMessage<T>(
  actual: T,
  expected: T,
  options: EqualErrorMessageOptions = {},
): string {
  const { formatter = format, msg, summary = "Values are not equal." } =
    options;
  const msgPrefix = msg ? `${msg}: ` : "";
  const actualString = formatter(actual);
  const expectedString = formatter(expected);

  let message = `${msgPrefix}${summary}`;

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
  options: EqualErrorMessageOptions = {},
): string {
  const { formatter = format, msg } = options;
  const actualString = formatter(actual);
  const expectedString = formatter(expected);

  const msgPrefix = msg ? `${msg}: ` : "";
  return `${msgPrefix}Expected actual: ${actualString} not to be: ${expectedString}.`;
}
