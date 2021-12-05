import { partition } from "../collections/mod.ts";
import { defaultLogLevels } from "./default_logger.ts";
import { buildDefaultLogMessage } from "./logging.ts";
import { assert } from "../testing/asserts.ts";
import type { DefaultLogLevels } from "./default_logger.ts";

async function launch(
  file: string,
  ...args: unknown[]
): Promise<{ stdout: string; stderr: string; success: boolean }> {
  const process = Deno.run({
    cmd: [
      "deno",
      "run",
      new URL(file, import.meta.url).toString(),
      ...args.map((it) => JSON.stringify(it)),
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const [status, ...rawOuts] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);

  process.close();

  const { success } = status;
  const [stdout, stderr] = rawOuts
    .map((it) => new TextDecoder().decode(it));

  return { stdout, stderr, success };
}

function callsToExpectations(
  threshold: keyof DefaultLogLevels,
  calls:
    ([keyof DefaultLogLevels, number, unknown] | [
      keyof DefaultLogLevels,
      number,
    ])[],
): { std: [string, string][]; err: [string, string][] } {
  const [std, err] = partition(
    calls,
    ([level]) => defaultLogLevels[level] < defaultLogLevels.warn,
  )
    .map((calls) =>
      calls.filter(([level]) =>
        defaultLogLevels[level] >= defaultLogLevels[threshold]
      )
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

function assertOutputMatches(output: string, expectations: [string, string][]) {
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

Deno.test("Default logger with no customization logs to the console with info threshold", async () => {
  const threshold = "info";
  const calls: Parameters<typeof callsToExpectations>[1] = [
    ["info", 5],
    ["trace", 1, {}],
    ["debug", 19],
    ["info", -3, []],
    ["warn", 32],
    ["error", 24, "asdf"],
    ["info", 0],
    ["trace", 13],
  ];

  const { stdout, stderr, success } = await launch(
    "./test_scripts/default_log_test_process.ts",
    ...calls,
  );

  assert(success);

  const { std: stdExpected, err: errExpected } = callsToExpectations(
    threshold,
    calls,
  );

  assertOutputMatches(stdout, stdExpected);
  assertOutputMatches(stderr, errExpected);
});

Deno.test("Console logger logs to the console", async () => {
  const threshold = "info";
  const calls: Parameters<typeof callsToExpectations>[1] = [
    ["info", 5],
    ["trace", 1, {}],
    ["debug", 19],
    ["info", -3, []],
    ["warn", 32],
    ["error", 24, "asdf"],
    ["info", 0],
    ["trace", 13],
  ];

  const { stdout, stderr, success } = await launch(
    "./test_scripts/console_test_process.ts",
    threshold,
    ...calls,
  );

  assert(success);

  const { std: stdExpected, err: errExpected } = callsToExpectations(
    threshold,
    calls,
  );

  assertOutputMatches(stdout, stdExpected);
  assertOutputMatches(stderr, errExpected);
});
