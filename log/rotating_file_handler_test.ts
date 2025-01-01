// Copyright 2018-2025 the Deno authors. MIT license.
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "@std/assert";
import { LogLevels } from "./levels.ts";
import { RotatingFileHandler } from "./rotating_file_handler.ts";
import { LogRecord } from "./logger.ts";
import { existsSync } from "@std/fs/exists";

const LOG_FILE = "./rotating_file_handler_test_log.file";

Deno.test({
  name:
    "RotatingFileHandler wipes existing log file clean and removes others with mode 'w'",
  async fn() {
    Deno.writeFileSync(LOG_FILE, new TextEncoder().encode("hello world"));
    Deno.writeFileSync(
      LOG_FILE + ".1",
      new TextEncoder().encode("hello world"),
    );
    Deno.writeFileSync(
      LOG_FILE + ".2",
      new TextEncoder().encode("hello world"),
    );
    Deno.writeFileSync(
      LOG_FILE + ".3",
      new TextEncoder().encode("hello world"),
    );

    const fileHandler = new RotatingFileHandler("WARN", {
      filename: LOG_FILE,
      maxBytes: 50,
      maxBackupCount: 3,
      mode: "w",
    });
    fileHandler.setup();
    fileHandler.destroy();

    assertEquals((await Deno.stat(LOG_FILE)).size, 0);
    assert(!existsSync(LOG_FILE + ".1"));
    assert(!existsSync(LOG_FILE + ".2"));
    assert(!existsSync(LOG_FILE + ".3"));

    Deno.removeSync(LOG_FILE);
  },
});

Deno.test({
  name:
    "RotatingFileHandler throws if any log file already exists with mode 'x'",
  fn() {
    Deno.writeFileSync(
      LOG_FILE + ".3",
      new TextEncoder().encode("hello world"),
    );
    using fileHandler = new RotatingFileHandler("WARN", {
      filename: LOG_FILE,
      maxBytes: 50,
      maxBackupCount: 3,
      mode: "x",
    });
    assertThrows(
      () => {
        fileHandler.setup();
      },
      Deno.errors.AlreadyExists,
      "Backup log file " + LOG_FILE + ".3 already exists",
    );

    Deno.removeSync(LOG_FILE + ".3");
    Deno.removeSync(LOG_FILE);
  },
});

Deno.test({
  name: "RotatingFileHandler handles first rollover, monitor step by step",
  async fn() {
    using fileHandler = new RotatingFileHandler("WARN", {
      filename: LOG_FILE,
      maxBytes: 25,
      maxBackupCount: 3,
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
    fileHandler.flush();
    assertEquals((await Deno.stat(LOG_FILE)).size, 10);
    fileHandler.handle(
      new LogRecord({
        msg: "AAA",
        args: [],
        level: LogLevels.ERROR,
        loggerName: "default",
      }),
    );
    fileHandler.flush();
    assertEquals((await Deno.stat(LOG_FILE)).size, 20);
    fileHandler.handle(
      new LogRecord({
        msg: "AAA",
        args: [],
        level: LogLevels.ERROR,
        loggerName: "default",
      }),
    );
    fileHandler.flush();
    // Rollover occurred. Log file now has 1 record, rollover file has the original 2
    assertEquals((await Deno.stat(LOG_FILE)).size, 10);
    assertEquals((await Deno.stat(LOG_FILE + ".1")).size, 20);

    Deno.removeSync(LOG_FILE);
    Deno.removeSync(LOG_FILE + ".1");
  },
});

Deno.test({
  name: "RotatingFileHandler handles first rollover, check all at once",
  async fn() {
    const fileHandler = new RotatingFileHandler("WARN", {
      filename: LOG_FILE,
      maxBytes: 25,
      maxBackupCount: 3,
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
    fileHandler.handle(
      new LogRecord({
        msg: "AAA",
        args: [],
        level: LogLevels.ERROR,
        loggerName: "default",
      }),
    );
    fileHandler.handle(
      new LogRecord({
        msg: "AAA",
        args: [],
        level: LogLevels.ERROR,
        loggerName: "default",
      }),
    );

    fileHandler.destroy();

    assertEquals((await Deno.stat(LOG_FILE)).size, 10);
    assertEquals((await Deno.stat(LOG_FILE + ".1")).size, 20);

    Deno.removeSync(LOG_FILE);
    Deno.removeSync(LOG_FILE + ".1");
  },
});

Deno.test({
  name: "RotatingFileHandler handles all backups rollover",
  fn() {
    Deno.writeFileSync(LOG_FILE, new TextEncoder().encode("original log file"));
    Deno.writeFileSync(
      LOG_FILE + ".1",
      new TextEncoder().encode("original log.1 file"),
    );
    Deno.writeFileSync(
      LOG_FILE + ".2",
      new TextEncoder().encode("original log.2 file"),
    );
    Deno.writeFileSync(
      LOG_FILE + ".3",
      new TextEncoder().encode("original log.3 file"),
    );

    const fileHandler = new RotatingFileHandler("WARN", {
      filename: LOG_FILE,
      maxBytes: 2,
      maxBackupCount: 3,
      mode: "a",
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
    fileHandler.destroy();

    assertEquals(Deno.readTextFileSync(LOG_FILE), "ERROR AAA\n");
    assertEquals(Deno.readTextFileSync(LOG_FILE + ".1"), "original log file");
    assertEquals(Deno.readTextFileSync(LOG_FILE + ".2"), "original log.1 file");
    assertEquals(Deno.readTextFileSync(LOG_FILE + ".3"), "original log.2 file");
    assert(!existsSync(LOG_FILE + ".4"));

    Deno.removeSync(LOG_FILE);
    Deno.removeSync(LOG_FILE + ".1");
    Deno.removeSync(LOG_FILE + ".2");
    Deno.removeSync(LOG_FILE + ".3");
  },
});

Deno.test({
  name: "RotatingFileHandler handles maxBytes less than 1",
  fn() {
    assertThrows(
      () => {
        const fileHandler = new RotatingFileHandler("WARN", {
          filename: LOG_FILE,
          maxBytes: 0,
          maxBackupCount: 3,
          mode: "w",
        });
        fileHandler.setup();
      },
      Error,
      '"maxBytes" must be >= 1: received 0',
    );
  },
});

Deno.test({
  name: "RotatingFileHandler handles maxBackupCount less than 1",
  fn() {
    assertThrows(
      () => {
        const fileHandler = new RotatingFileHandler("WARN", {
          filename: LOG_FILE,
          maxBytes: 50,
          maxBackupCount: 0,
          mode: "w",
        });
        fileHandler.setup();
      },
      Error,
      '"maxBackupCount" must be >= 1: received 0',
    );
  },
});

Deno.test({
  name: "RotatingFileHandler rotates on byte length, not msg length",
  async fn() {
    const fileHandler = new RotatingFileHandler("WARN", {
      filename: LOG_FILE,
      maxBytes: 7,
      maxBackupCount: 1,
      mode: "w",
    });
    fileHandler.setup();

    const msg = "。";
    const msgLength = msg.length;
    const msgByteLength = new TextEncoder().encode(msg).byteLength;
    assertNotEquals(msgLength, msgByteLength);
    assertEquals(msgLength, 1);
    assertEquals(msgByteLength, 3);

    fileHandler.log(msg); // logs 4 bytes (including '\n')
    fileHandler.log(msg); // max bytes is 7, but this would be 8.  Rollover.

    fileHandler.destroy();

    const fileSize1 = (await Deno.stat(LOG_FILE)).size;
    const fileSize2 = (await Deno.stat(LOG_FILE + ".1")).size;

    assertEquals(fileSize1, msgByteLength + 1);
    assertEquals(fileSize2, msgByteLength + 1);

    Deno.removeSync(LOG_FILE);
    Deno.removeSync(LOG_FILE + ".1");
  },
});

Deno.test({
  name: "RotatingFileHandler handles strings larger than the buffer",
  fn() {
    const fileHandler = new RotatingFileHandler("WARN", {
      filename: LOG_FILE,
      mode: "w",
      maxBytes: 4000000,
      maxBackupCount: 10,
    });
    const logOverBufferLimit = "A".repeat(4096);
    fileHandler.setup();

    fileHandler.log(logOverBufferLimit);
    fileHandler.destroy();

    assertEquals(
      Deno.readTextFileSync(LOG_FILE),
      `${logOverBufferLimit}\n`,
    );

    Deno.removeSync(LOG_FILE);
  },
});

Deno.test({
  name: "RotatingFileHandler handles a mixture of string sizes",
  fn() {
    const fileHandler = new RotatingFileHandler("WARN", {
      filename: LOG_FILE,
      mode: "w",
      maxBytes: 4000000,
      maxBackupCount: 10,
    });
    const veryLargeLog = "A".repeat(10000);
    const regularLog = "B".repeat(100);
    fileHandler.setup();

    fileHandler.log(regularLog);
    fileHandler.log(veryLargeLog);
    fileHandler.log(regularLog);
    fileHandler.destroy();

    assertEquals(
      Deno.readTextFileSync(LOG_FILE),
      `${regularLog}\n${veryLargeLog}\n${regularLog}\n`,
    );

    Deno.removeSync(LOG_FILE);
  },
});
