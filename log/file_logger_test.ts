import { assertEquals } from "https://deno.land/std@0.104.0/testing/asserts.ts";
import { FileLogger } from "./file_logger.ts";

Deno.test({
  name: "lower level",
  fn() {
    const filename = "./log1.txt";
    const fileLogger = new FileLogger(FileLogger.logLevels.debug, filename);
    fileLogger.trace("foo");
    fileLogger.close();
    const read = Deno.readTextFileSync(filename);
    assertEquals(read, "");
    Deno.remove(filename);
  },
});

Deno.test({
  name: "same level",
  fn() {
    const filename = "./log2.txt";
    const fileLogger = new FileLogger(FileLogger.logLevels.trace, filename);
    fileLogger.trace("foo");
    fileLogger.close();
    const read = Deno.readTextFileSync(filename);
    assertEquals(read, "foo\n");
    Deno.remove(filename);
  },
});

Deno.test({
  name: "higher level",
  fn() {
    const filename = "./log3.txt";
    const fileLogger = new FileLogger(FileLogger.logLevels.trace, filename);
    fileLogger.debug("foo");
    fileLogger.close();
    const read = Deno.readTextFileSync(filename);
    assertEquals(read, "foo\n");
    Deno.remove(filename);
  },
});

Deno.test({
  name: "quiet",
  fn() {
    const filename = "./log4.txt";
    const fileLogger = new FileLogger(FileLogger.logLevels.trace, filename);
    fileLogger.quiet = true;
    fileLogger.debug("foo");
    fileLogger.close();
    const read = Deno.readTextFileSync(filename);
    assertEquals(read, "");
    Deno.remove(filename);
  },
});
