// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import * as log from "./mod.ts";
import { TestHandler } from "./_test_handler.ts";

Deno.test("BaseHandler handles default setup", function () {
  const cases = new Map<log.LogLevel, string[]>([
    [
      log.LogLevels.DEBUG,
      [
        "DEBUG debug-test",
        "INFO info-test",
        "WARN warn-test",
        "ERROR error-test",
        "CRITICAL critical-test",
      ],
    ],
    [
      log.LogLevels.INFO,
      [
        "INFO info-test",
        "WARN warn-test",
        "ERROR error-test",
        "CRITICAL critical-test",
      ],
    ],
    [
      log.LogLevels.WARN,
      ["WARN warn-test", "ERROR error-test", "CRITICAL critical-test"],
    ],
    [log.LogLevels.ERROR, ["ERROR error-test", "CRITICAL critical-test"]],
    [log.LogLevels.CRITICAL, ["CRITICAL critical-test"]],
  ]);

  for (const [testCase, messages] of cases.entries()) {
    const testLevel = log.getLevelName(testCase);
    const handler = new TestHandler(testLevel);

    for (const levelName of log.LogLevelNames) {
      const level = log.getLevelByName(levelName);
      handler.handle(
        new log.LogRecord({
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
    new log.LogRecord({
      msg: "",
      args: [],
      level: log.LogLevels.DEBUG,
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
    new log.LogRecord({
      msg: "Hello, world!",
      args: [],
      level: log.LogLevels.ERROR,
      loggerName: "default",
    }),
  );

  assertEquals(handler.messages, ["fn formatter ERROR Hello, world!"]);
});
