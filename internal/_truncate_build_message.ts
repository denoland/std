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
  const beforeLength = location === "start" ? 1 : contextLength;
  const afterLength = location === "end" ? 1 : contextLength;

  const omitLength = commons.length - beforeLength - afterLength;

  if (omitLength <= 1) return commons;

  const before = commons[beforeLength - 1]?.value ?? "";
  const after = commons[commons.length - afterLength]?.value ?? before;
  const lineEnd = stringDiff ? "\n" : "";

  const indent = location === "start"
    ? getIndent(after)
    : location === "end"
    ? getIndent(before)
    : commonIndent(before, after);

  const value = `${indent}... ${omitLength} unchanged lines ...${lineEnd}`;

  return [
    ...commons.slice(0, beforeLength),
    { type: "truncation", value },
    ...commons.slice(commons.length - afterLength),
  ];
}

function commonIndent(line1: string, line2: string): string {
  const indent1 = getIndent(line1);
  const indent2 = getIndent(line2);
  return indent1.startsWith(indent2)
    ? indent2
    : indent2.startsWith(indent1)
    ? indent1
    : "";
}

function getIndent(line: string): string {
  return line.match(/^\s+/g)?.[0] ?? "";
}
