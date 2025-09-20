// Copyright 2018-2025 the Deno authors. MIT license.
import type { CommonDiffResult, DiffResult } from "@std/internal/types";

export function truncateDiff(
  diffResult: ReadonlyArray<DiffResult<string>>,
  stringDiff: boolean,
  contextLength: number,
): ReadonlyArray<DiffResult<string>> {
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
          commons.length === i ? "start" : "middle",
          stringDiff,
          contextLength,
        ),
      );
      commons.length = 0;
      messages.push(result);
    }
  }

  messages.push(
    ...consolidateCommon(commons, "end", stringDiff, contextLength),
  );

  return messages;
}

export function consolidateCommon(
  commons: ReadonlyArray<CommonDiffResult<string>>,
  location: "start" | "middle" | "end",
  stringDiff: boolean,
  contextLength: number,
): ReadonlyArray<CommonDiffResult<string>> {
  const spanLength = contextLength * 2 + 1;
  const extremityLength = 1;

  const startTruncationLength = location === "start"
    ? extremityLength
    : contextLength;
  const endTruncationLength = location === "end"
    ? extremityLength
    : contextLength;

  if (commons.length <= spanLength) return commons;

  const [before, after] = [
    commons[startTruncationLength - 1]!.value,
    commons[commons.length - endTruncationLength]!.value,
  ];

  const indent = location === "start"
    ? getIndent(after)
    : location === "end"
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
