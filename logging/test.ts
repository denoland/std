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

test(async function basicTest() {
  await logging.setup({
    handlers: {
      debug: new TestHandler("DEBUG"),
      info: new TestHandler("INFO"),
      // file: new FileHandler("DEBUG", "./log.txt"),
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
  

  fooLogger.debug("I should be printed.");
  barLogger.debug("I should not be printed.");
  barLogger.info("And I should be printed as well.");
  bazzLogger.critical("I shouldn't be printed neither.")
  

  const expectedOutput =
    "DEBUG I should be printed.\n" +
    "INFO And I should be printed as well.\n";

  assertEqual(testOutput, expectedOutput);
});
