// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../assert/mod.ts";
import * as log from "./mod.ts";
import {
  getLevelByName,
  getLevelName,
  type LevelName,
  type LogLevel,
  LogLevelNames,
} from "./levels.ts";

class TestHandler extends log.BaseHandler {
  public messages: string[] = [];

  override log(msg: string) {
    this.messages.push(msg);
  }
}

Deno.test("setup() handles default handlers", async function () {
  const loggers: {
    [key: string]: (msg: string, ...args: unknown[]) => void;
  } = {
    DEBUG: log.debug,
    INFO: log.info,
    WARN: log.warn,
    ERROR: log.error,
    CRITICAL: log.critical,
  };

  for (const levelName of LogLevelNames) {
    if (levelName === "NOTSET") {
      continue;
    }

    const logger = loggers[levelName]!;
    const handler = new TestHandler(levelName);

    await log.setup({
      handlers: {
        default: handler,
      },
      loggers: {
        default: {
          level: levelName as LevelName,
          handlers: ["default"],
        },
      },
    });

    logger("foo");
    logger("bar", 1, 2);

    assertEquals(handler.messages, [`${levelName} foo`, `${levelName} bar`]);
  }
});

Deno.test("getLogger()", async function () {
  const handler = new TestHandler("DEBUG");

  await log.setup({
    handlers: {
      default: handler,
    },
    loggers: {
      default: {
        level: "DEBUG",
        handlers: ["default"],
      },
    },
  });

  const logger = log.getLogger();

  assertEquals(logger.levelName, "DEBUG");
  assertEquals(logger.handlers, [handler]);
});

Deno.test("getLogger() handles name", async function () {
  const fooHandler = new TestHandler("DEBUG");

  await log.setup({
    handlers: {
      foo: fooHandler,
    },
    loggers: {
      bar: {
        level: "INFO",
        handlers: ["foo"],
      },
    },
  });

  const logger = log.getLogger("bar");

  assertEquals(logger.levelName, "INFO");
  assertEquals(logger.handlers, [fooHandler]);
});

Deno.test("getLogger() habndles unknown", async function () {
  await log.setup({
    handlers: {},
    loggers: {},
  });

  const logger = log.getLogger("nonexistent");

  assertEquals(logger.levelName, "NOTSET");
  assertEquals(logger.handlers, []);
});

Deno.test("getLogger() handles invalid level", function () {
  assertThrows(() => getLevelByName("FAKE_LOG_LEVEL" as LevelName));
  assertThrows(() => getLevelName(5000 as LogLevel));
});
