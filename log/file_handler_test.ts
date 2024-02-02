// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../assert/mod.ts";
import { LogLevels } from "./levels.ts";
import { FileHandler } from "./file_handler.ts";
import { LogRecord } from "./logger.ts";

const LOG_FILE = "./file_handler_test_log.file";

Deno.test({
  name: "FileHandler Shouldn't Have Broken line",
  fn() {
    class TestFileHandler extends FileHandler {
      override flush() {
        super.flush();
        const decoder = new TextDecoder("utf-8");
        const data = Deno.readFileSync(LOG_FILE);
        const text = decoder.decode(data);
        assertEquals(text.slice(-1), "\n");
      }

      override destroy() {
        super.destroy();
        Deno.removeSync(LOG_FILE);
      }
    }

    using testFileHandler = new TestFileHandler("WARN", {
      filename: LOG_FILE,
      mode: "w",
    });
    testFileHandler.setup();

    for (let i = 0; i < 300; i++) {
      testFileHandler.handle(
        new LogRecord({
          msg: "The starry heavens above me and the moral law within me.",
          args: [],
          level: LogLevels.WARN,
          loggerName: "default",
        }),
      );
    }
  },
});

Deno.test({
  name: "FileHandler with mode 'w' will wipe clean existing log file",
  async fn() {
    const fileHandler = new FileHandler("WARN", {
      filename: LOG_FILE,
      mode: "w",
    });

    fileHandler.setup();
    fileHandler.handle(
      new LogRecord({
        msg: "Hello World",
        args: [],
        level: LogLevels.WARN,
        loggerName: "default",
      }),
    );
    fileHandler.destroy();
    const firstFileSize = (await Deno.stat(LOG_FILE)).size;

    fileHandler.setup();
    fileHandler.handle(
      new LogRecord({
        msg: "Hello World",
        args: [],
        level: LogLevels.WARN,
        loggerName: "default",
      }),
    );
    fileHandler.destroy();
    const secondFileSize = (await Deno.stat(LOG_FILE)).size;

    assertEquals(secondFileSize, firstFileSize);
    Deno.removeSync(LOG_FILE);
  },
});

Deno.test({
  name: "FileHandler with mode 'x' will throw if log file already exists",
  fn() {
    using fileHandler = new FileHandler("WARN", {
      filename: LOG_FILE,
      mode: "x",
    });
    Deno.writeFileSync(LOG_FILE, new TextEncoder().encode("hello world"));

    assertThrows(() => {
      fileHandler.setup();
    }, Deno.errors.AlreadyExists);

    Deno.removeSync(LOG_FILE);
  },
});

Deno.test({
  name: "Window unload flushes buffer",
  async fn() {
    const fileHandler = new FileHandler("WARN", {
      filename: LOG_FILE,
      mode: "w",
    });
    fileHandler.setup();
    fileHandler.handle(
      new LogRecord({
        msg: "AAA",
        args: [],
        level: LogLevels.ERROR,
        loggerName: "default",
      }),
    ); // 'ERROR AAA\n' = 10 bytes

    assertEquals((await Deno.stat(LOG_FILE)).size, 0);
    dispatchEvent(new Event("unload"));
    dispatchEvent(new Event("unload"));
    assertEquals((await Deno.stat(LOG_FILE)).size, 10);

    Deno.removeSync(LOG_FILE);
  },
});

Deno.test({
  name: "FileHandler: Critical logs trigger immediate flush",
  async fn() {
    using fileHandler = new FileHandler("WARN", {
      filename: LOG_FILE,
      mode: "w",
    });
    fileHandler.setup();

    fileHandler.handle(
      new LogRecord({
        msg: "AAA",
        args: [],
        level: LogLevels.ERROR,
        loggerName: "default",
      }),
    );

    // ERROR won't trigger immediate flush
    const fileSize = (await Deno.stat(LOG_FILE)).size;
    assertEquals(fileSize, 0);

    fileHandler.handle(
      new LogRecord({
        msg: "AAA",
        args: [],
        level: LogLevels.CRITICAL,
        loggerName: "default",
      }),
    );

    // CRITICAL will trigger immediate flush
    const fileSize2 = (await Deno.stat(LOG_FILE)).size;
    // ERROR record is 10 bytes, CRITICAL is 13 bytes
    assertEquals(fileSize2, 23);

    Deno.removeSync(LOG_FILE);
  },
});
