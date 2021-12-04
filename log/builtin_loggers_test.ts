import { partition } from "../collections/partition.ts";
import { buildFileLogger, FileLoggerOptions } from "./builtin_loggers.ts";
import { buildDefaultLogMessage } from "./logging.ts";
import { defaultLogLevels } from "./default_logger.ts";
import { assertEquals } from "../testing/asserts.ts";

const testLevels = {
  low: 1,
  middle: 2,
  high: 3,
};

export type TestLevels = typeof testLevels;
export type MessageTuple =
  | [keyof TestLevels, number, unknown]
  | [keyof TestLevels, number];

const logFile = "./__test.log";
const testLine = "Test line\n";

function resetLogFile() {
  Deno.writeTextFileSync(logFile, testLine);
}

function readLogFile() {
  return Deno.readTextFileSync(logFile);
}

addEventListener("unload", () => Deno.removeSync(logFile))

function buildTestFileLogger(
  options?: FileLoggerOptions<TestLevels, number, unknown>,
) {
  return buildFileLogger(
    testLevels,
    "middle",
    logFile,
    options,
  );
}

Deno.test("File logger with default settings logs to and overwrites the given file", () => {
  resetLogFile();
  const logger = buildTestFileLogger();

  const calls: MessageTuple[] = [
    ["middle", 5],
    ["low", 1, {}],
    ["high", 19],
    ["middle", -3, []],
    ["low", 32],
    ["low", 24, "asdf"],
    ["high", 0, () => {}],
    ["middle", 13],
  ];

  calls.forEach(([level, message, data]) => logger[level](message, data));
  logger.flush();

  const logged = calls
    .filter(([level]) => level !== "low")
    .map(([level, message, data]) =>
      `${buildDefaultLogMessage(level, message, data)}\n`
    )
    .join("");

  assertEquals(
    readLogFile(),
    `${testLine}${logged}`,
  );

  logger.close();
});

Deno.test("Console logger logs to the console", async () => {
  const threshold = "info";
  const calls = [
    ["info", 5],
    ["trace", 1, {}],
    ["debug", 19],
    ["info", -3, []],
    ["warn", 32],
    ["error", 24, "asdf"],
    ["info", 0],
    ["trace", 13],
  ] as const;

  const process = Deno.run({
    cmd: [
      "deno",
      "run",
      "log/console_test_process.ts",
      threshold,
      ...calls.map((it) => JSON.stringify(it)),
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const [_, ...rawOuts] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);
  process.close();

  const [output, errOutput] = rawOuts
    .map((it) => new TextDecoder().decode(it));

  const [stdExpected, errExpected] = partition(
    calls,
    ([level]) => defaultLogLevels[level] < defaultLogLevels.error,
  )
    .map((calls) =>
      calls.filter(([level]) =>
        defaultLogLevels[level] >= defaultLogLevels[threshold]
      )
    )
    .map((calls) =>
      calls.map(([level, message, data]) =>
        `${buildDefaultLogMessage(level, message, data)}\n`
      )
    )
    .map((calls) => calls.join(""));

  assertEquals(output, stdExpected);
  assertEquals(errOutput, errExpected);
});
