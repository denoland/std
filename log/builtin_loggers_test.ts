import { buildFileLogger, FileLoggerOptions } from "./builtin_loggers.ts";
import { assertOutputMatches, callsToExpectations } from "./test_utils.ts";

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

addEventListener("unload", () => Deno.removeSync(logFile));

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

  const { std: expected } = callsToExpectations(
    testLevels,
    "middle",
    calls,
  );

  assertOutputMatches(
    readLogFile(),
    [
      [testLine.trim(), ""],
      ...expected,
    ],
  );

  logger.close();
});
