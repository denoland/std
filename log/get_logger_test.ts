// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals, assertThrows } from "@std/assert";
import * as log from "./mod.ts";
import { TestHandler } from "./_test_handler.ts";

let logger: log.Logger | null = null;
try {
  // Need to initialize it here
  // otherwise it will be already initialized on Deno.test
  logger = log.getLogger();
} catch {
  // Pass
}

Deno.test("getLogger() initializes logger", function () {
  assert(logger instanceof log.Logger);
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

  assertEquals(logger.levelName, "INFO");
  assertEquals(logger.handlers, []);
});

Deno.test("getLogger() handles invalid level", function () {
  assertThrows(() => log.getLevelByName("FAKE_LOG_LEVEL" as log.LevelName));
  assertThrows(() => log.getLevelName(5000 as log.LogLevel));
});
