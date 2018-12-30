import { remove, open, readAll } from "deno";
import { assertEqual, test } from "https://deno.land/x/testing/testing.ts";

import * as logging from "index.ts";
import { FileHandler } from "./handlers.ts";

// TODO: establish something more sophisticated
let testOutput = "";

class TestHandler extends logging.handlers.BaseHandler {
  constructor(levelName: string) {
    super(levelName);
  }

  log(msg: string) {
    testOutput += `${msg}\n`;
  }
}

test(function testDefaultLoggingMethods() {
  logging.debug("Foobar");
  logging.info("Foobar");
  logging.warning("Foobar");
  logging.error("Foobar");
  logging.critical("Foobar");

  const logger = logging.getLogger('');
  console.log(logger);
});

test(async function basicTest() {
  const testFile = './log.txt';

  await logging.setup({
    handlers: {
      debug: new TestHandler("DEBUG"),
      info: new TestHandler("INFO"),
      file: new FileHandler("DEBUG", testFile),
    },

    loggers: {
      foo: {
        level: "DEBUG",
        handlers: ["debug", "file"]
      },

      bar: {
        level: "INFO",
        handlers: ["info"]
      }
    }
  });

  const fooLogger = logging.getLogger("foo");
  const barLogger = logging.getLogger("bar");
  const bazzLogger = logging.getLogger("bazz");
  

  fooLogger.debug("I should be logged.");
  fooLogger.debug("I should be logged.");
  barLogger.debug("I should not be logged.");
  barLogger.info("And I should be logged as well.");
  bazzLogger.critical("I shouldn't be logged neither.")
  
  const expectedOutput =
    "DEBUG I should be logged.\n" +
    "DEBUG I should be logged.\n" +
    "INFO And I should be logged as well.\n";

  assertEqual(testOutput, expectedOutput);

  // same check for file handler
  const f = await open(testFile);
  const bytes = await readAll(f);
  const fileOutput = new TextDecoder().decode(bytes);
  await f.close();
  await remove(testFile);
  
  const fileExpectedOutput = 
    "DEBUG I should be logged.\n" +
    "DEBUG I should be logged.\n";

  assertEqual(fileOutput, fileExpectedOutput);
});
