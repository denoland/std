import { defaultLogLevels } from "./default_logger.ts";
import { assert } from "../testing/asserts.ts";
import { assertOutputMatches, callsToExpectations } from "./test_utils.ts";
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

Deno.test("Default logger with no customization logs to the console with info threshold", async () => {
  const threshold = "info";
  const calls: ([keyof DefaultLogLevels, number] | [
    keyof DefaultLogLevels,
    number,
    unknown,
  ])[] = [
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
    defaultLogLevels,
    threshold,
    calls,
    "warn",
  );

  assertOutputMatches(stdout, stdExpected);
  assertOutputMatches(stderr, errExpected);
});

Deno.test("Console logger logs to the console", async () => {
  const threshold = "info";
  const calls: ([keyof DefaultLogLevels, number] | [
    keyof DefaultLogLevels,
    number,
    unknown,
  ])[] = [
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
    defaultLogLevels,
    threshold,
    calls,
    "warn",
  );

  assertOutputMatches(stdout, stdExpected);
  assertOutputMatches(stderr, errExpected);
});
