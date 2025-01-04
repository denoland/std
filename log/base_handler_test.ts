// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import {
  getLevelByName,
  getLevelName,
  type LogLevel,
  LogLevelNames,
  LogLevels,
} from "./levels.ts";
import { LogRecord } from "./logger.ts";
import { TestHandler } from "./_test_handler.ts";

Deno.test("BaseHandler handles default setup", function () {
  const cases = new Map<LogLevel, string[]>([
    [
      LogLevels.DEBUG,
      [
        "DEBUG debug-test",
        "INFO info-test",
        "WARN warn-test",
        "ERROR error-test",
        "CRITICAL critical-test",
      ],
    ],
    [
      LogLevels.INFO,
      [
        "INFO info-test",
        "WARN warn-test",
        "ERROR error-test",
        "CRITICAL critical-test",
      ],
    ],
    [
      LogLevels.WARN,
      ["WARN warn-test", "ERROR error-test", "CRITICAL critical-test"],
    ],
    [LogLevels.ERROR, ["ERROR error-test", "CRITICAL critical-test"]],
    [LogLevels.CRITICAL, ["CRITICAL critical-test"]],
  ]);

  for (const [testCase, messages] of cases.entries()) {
    const testLevel = getLevelName(testCase);
    const handler = new TestHandler(testLevel);

    for (const levelName of LogLevelNames) {
      const level = getLevelByName(levelName);
      handler.handle(
        new LogRecord({
          msg: `${levelName.toLowerCase()}-test`,
          args: [],
          level: level,
          loggerName: "default",
        }),
      );
    }

    assertEquals(handler.level, testCase);
    assertEquals(handler.levelName, testLevel);
    assertEquals(handler.messages, messages);
  }
});

Deno.test("BaseHandler handles formatter with empty msg", function () {
  const handler = new TestHandler("DEBUG", {
    formatter: ({ levelName, msg }) => `test ${levelName} ${msg}`,
  });

  handler.handle(
    new LogRecord({
      msg: "",
      args: [],
      level: LogLevels.DEBUG,
      loggerName: "default",
    }),
  );

  assertEquals(handler.messages, ["test DEBUG "]);
});

Deno.test("BaseHandler handles formatter", function () {
  const handler = new TestHandler("DEBUG", {
    formatter: (logRecord): string =>
      `fn formatter ${logRecord.levelName} ${logRecord.msg}`,
  });

  handler.handle(
    new LogRecord({
      msg: "Hello, world!",
      args: [],
      level: LogLevels.ERROR,
      loggerName: "default",
    }),
  );

  assertEquals(handler.messages, ["fn formatter ERROR Hello, world!"]);
});
