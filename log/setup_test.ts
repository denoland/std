// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import * as log from "./mod.ts";
import { TestHandler } from "./_test_handler.ts";

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

  for (const levelName of log.LogLevelNames) {
    const logger = loggers[levelName]!;
    const handler = new TestHandler(levelName);

    await log.setup({
      handlers: {
        default: handler,
      },
      loggers: {
        default: {
          level: levelName as log.LevelName,
          handlers: ["default"],
        },
      },
    });

    logger("foo");
    logger("bar", 1, 2);

    assertEquals(handler.messages, [`${levelName} foo`, `${levelName} bar`]);
  }
});

Deno.test({
  name: "setup() logging config works as expected with logger names",
  async fn() {
    const consoleHandler = new TestHandler("DEBUG");
    const anotherConsoleHandler = new TestHandler("DEBUG", {
      formatter: ({ loggerName, levelName, msg }) =>
        `[${loggerName}] ${levelName} ${msg}`,
    });
    await log.setup({
      handlers: {
        console: consoleHandler,
        anotherConsole: anotherConsoleHandler,
      },

      loggers: {
        // configure default logger available via short-hand methods above
        default: {
          level: "DEBUG",
          handlers: ["console"],
        },

        tasks: {
          level: "ERROR",
          handlers: ["anotherConsole"],
        },
      },
    });
    log.getLogger().debug("hello");
    log.getLogger("tasks").error("world");
    assertEquals(consoleHandler.messages[0], "DEBUG hello");
    assertEquals(anotherConsoleHandler.messages[0], "[tasks] ERROR world");
  },
});

Deno.test({
  name: "setup() loggers have level and levelName to get and set loglevels",
  async fn() {
    const testHandler = new TestHandler("DEBUG");
    await log.setup({
      handlers: {
        test: testHandler,
      },

      loggers: {
        // configure default logger available via short-hand methods above
        default: {
          level: "DEBUG",
          handlers: ["test"],
        },
      },
    });
    const logger: log.Logger = log.getLogger();
    assertEquals(logger.levelName, "DEBUG");
    assertEquals(logger.level, log.LogLevels.DEBUG);

    logger.debug("debug");
    logger.error("error");
    logger.critical("critical");
    assertEquals(testHandler.messages.length, 3);
    assertEquals(testHandler.messages[0], "DEBUG debug");
    assertEquals(testHandler.messages[1], "ERROR error");
    assertEquals(testHandler.messages[2], "CRITICAL critical");

    testHandler.messages = [];
    logger.level = log.LogLevels.WARN;
    assertEquals(logger.levelName, "WARN");
    assertEquals(logger.level, log.LogLevels.WARN);

    logger.debug("debug2");
    logger.error("error2");
    logger.critical("critical2");
    assertEquals(testHandler.messages.length, 2);
    assertEquals(testHandler.messages[0], "ERROR error2");
    assertEquals(testHandler.messages[1], "CRITICAL critical2");

    testHandler.messages = [];
    const setLevelName: log.LevelName = "CRITICAL";
    logger.levelName = setLevelName;
    assertEquals(logger.levelName, "CRITICAL");
    assertEquals(logger.level, log.LogLevels.CRITICAL);

    logger.debug("debug3");
    logger.error("error3");
    logger.critical("critical3");
    assertEquals(testHandler.messages.length, 1);
    assertEquals(testHandler.messages[0], "CRITICAL critical3");
  },
});

Deno.test({
  name: "setup() checks if logger has mutable handlers",
  async fn() {
    const testHandlerA = new TestHandler("DEBUG");
    const testHandlerB = new TestHandler("DEBUG");
    await log.setup({
      handlers: {
        testA: testHandlerA,
        testB: testHandlerB,
      },

      loggers: {
        default: {
          level: "DEBUG",
          handlers: ["testA"],
        },
      },
    });
    const logger: log.Logger = log.getLogger();
    logger.info("msg1");
    assertEquals(testHandlerA.messages.length, 1);
    assertEquals(testHandlerA.messages[0], "INFO msg1");
    assertEquals(testHandlerB.messages.length, 0);

    logger.handlers = [testHandlerA, testHandlerB];

    logger.info("msg2");
    assertEquals(testHandlerA.messages.length, 2);
    assertEquals(testHandlerA.messages[1], "INFO msg2");
    assertEquals(testHandlerB.messages.length, 1);
    assertEquals(testHandlerB.messages[0], "INFO msg2");

    logger.handlers = [testHandlerB];

    logger.info("msg3");
    assertEquals(testHandlerA.messages.length, 2);
    assertEquals(testHandlerB.messages.length, 2);
    assertEquals(testHandlerB.messages[1], "INFO msg3");

    logger.handlers = [];
    logger.info("msg4");
    assertEquals(testHandlerA.messages.length, 2);
    assertEquals(testHandlerB.messages.length, 2);
  },
});

Deno.test({
  name: "setup() checks loggerName of loggers",
  async fn() {
    const testHandler = new TestHandler("DEBUG");
    await log.setup({
      handlers: {
        test: testHandler,
      },

      loggers: {
        namedA: {
          level: "DEBUG",
          handlers: ["test"],
        },
        namedB: {
          level: "DEBUG",
          handlers: ["test"],
        },
      },
    });

    assertEquals(log.getLogger("namedA").loggerName, "namedA");
    assertEquals(log.getLogger("namedB").loggerName, "namedB");
    assertEquals(log.getLogger().loggerName, "default");
    assertEquals(log.getLogger("nonsetupname").loggerName, "nonsetupname");
  },
});
