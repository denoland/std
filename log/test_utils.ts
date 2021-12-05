import { buildDefaultLogMessage } from "./logging.ts";
import { partition } from "../collections/mod.ts";
import { assert } from "../testing/asserts.ts";
import type { LogLevels } from "./logging.ts";

export function callsToExpectations<L extends LogLevels>(
  logLevels: L,
  threshold: keyof L,
  calls: ([keyof L, number, unknown] | [
    keyof L,
    number,
  ])[],
  errThreshold?: keyof L,
): { std: [string, string][]; err: [string, string][] } {
  const [std, err] = partition(
    calls,
    ([level]) =>
      errThreshold ? logLevels[level] < logLevels[errThreshold] : true,
  )
    .map((calls) =>
      calls.filter(([level]) => logLevels[level] >= logLevels[threshold])
    )
    .map((calls) =>
      calls
        .map(([level, message, data]) =>
          buildDefaultLogMessage(level, message, data)
        )
        .map((message) => message.split(/\t\[.*\]\t/) as [string, string])
    );

  return { std, err };
}

export function assertOutputMatches(
  output: string,
  expectations: [string, string][],
) {
  output
    .trim()
    .split("\n")
    .forEach((line, index) => {
      assert(
        line.startsWith(expectations[index][0]),
        `"${line}" does not start with "${expectations[index][0]}"`,
      );
      assert(
        line.endsWith(expectations[index][1]),
        `"${line}" does not end with "${expectations[index][1]}"`,
      );
    });
}
