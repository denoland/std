// Copyright 2018-2025 the Deno authors. MIT license.
import { assert, assertEquals, assertMatch } from "@std/assert";
import { Logger, type LogRecord } from "./logger.ts";
import { type LevelName, LogLevels } from "./levels.ts";
import { BaseHandler } from "./base_handler.ts";

class TestHandler extends BaseHandler {
  messages: string[] = [];
  records: LogRecord[] = [];

  override handle(record: LogRecord) {
    this.records.push(record);
    super.handle(record);
  }

  override log(str: string) {
    this.messages.push(str);
  }
}

Deno.test({
  name: "Logger handles formatter option",
  fn() {
    const handlerNoName = new TestHandler("DEBUG");
    const handlerWithLoggerName = new TestHandler("DEBUG", {
      formatter: ({ loggerName, levelName, msg }) =>
        `[${loggerName}] ${levelName} ${msg}`,
    });

    const logger = new Logger("config", "DEBUG", {
      handlers: [handlerNoName, handlerWithLoggerName],
    });
    logger.debug("hello");
    assertEquals(handlerNoName.messages[0], "DEBUG hello");
    assertEquals(handlerWithLoggerName.messages[0], "[config] DEBUG hello");
  },
});

Deno.test("Logger handles handlers option", () => {
  const handler = new TestHandler("DEBUG");
  let logger = new Logger("default", "DEBUG");

  assertEquals(logger.level, LogLevels.DEBUG);
  assertEquals(logger.levelName, "DEBUG");
  assertEquals(logger.handlers, []);

  logger = new Logger("default", "DEBUG", { handlers: [handler] });

  assertEquals(logger.handlers, [handler]);
});

Deno.test("Logger handles custom handler", () => {
  const handler = new TestHandler("DEBUG");
  const logger = new Logger("default", "DEBUG", { handlers: [handler] });

  const inlineData: string = logger.debug("foo", 1, 2);

  const record = handler.records[0]!;
  assertEquals(record.msg, "foo");
  assertEquals(record.args, [1, 2]);
  assertEquals(record.level, LogLevels.DEBUG);
  assertEquals(record.levelName, "DEBUG");

  assertEquals(handler.messages, ["DEBUG foo"]);
  assertEquals(inlineData!, "foo");
});

Deno.test("Logger handles log functions", () => {
  const doLog = (level: LevelName): TestHandler => {
    const handler = new TestHandler(level);
    const logger = new Logger("default", level, { handlers: [handler] });
    const debugData = logger.debug("foo");
    const infoData = logger.info("bar");
    const warnData = logger.warn("baz");
    const errorData = logger.error("boo");
    const criticalData = logger.critical("doo");
    assertEquals(debugData, "foo");
    assertEquals(infoData, "bar");
    assertEquals(warnData, "baz");
    assertEquals(errorData, "boo");
    assertEquals(criticalData, "doo");
    return handler;
  };

  let handler: TestHandler;
  handler = doLog("DEBUG");

  assertEquals(handler.messages, [
    "DEBUG foo",
    "INFO bar",
    "WARN baz",
    "ERROR boo",
    "CRITICAL doo",
  ]);

  handler = doLog("INFO");

  assertEquals(handler.messages, [
    "INFO bar",
    "WARN baz",
    "ERROR boo",
    "CRITICAL doo",
  ]);

  handler = doLog("WARN");

  assertEquals(handler.messages, ["WARN baz", "ERROR boo", "CRITICAL doo"]);

  handler = doLog("ERROR");

  assertEquals(handler.messages, ["ERROR boo", "CRITICAL doo"]);

  handler = doLog("CRITICAL");

  assertEquals(handler.messages, ["CRITICAL doo"]);
});

Deno.test(
  "Logger handles function argument without resolution",
  () => {
    const handler = new TestHandler("ERROR");
    const logger = new Logger("default", "ERROR", { handlers: [handler] });
    let called = false;

    const expensiveFunction = (): string => {
      called = true;
      return "expensive function result";
    };

    const inlineData: string | undefined = logger.debug(
      expensiveFunction,
      1,
      2,
    );
    assert(!called);
    assertEquals(inlineData, undefined);
  },
);

Deno.test("Logger handles function argument with resolution", () => {
  const handler = new TestHandler("ERROR");
  const logger = new Logger("default", "ERROR", { handlers: [handler] });
  const expensiveFunction = (x: number): string => {
    return "expensive function result " + x;
  };

  const firstInlineData = logger.error(() => expensiveFunction(5));
  const secondInlineData = logger.error(() => expensiveFunction(12), 1, "abc");
  assertEquals(firstInlineData, "expensive function result 5");
  assertEquals(secondInlineData, "expensive function result 12");
});

Deno.test(
  "Logger handles log function return types",
  () => {
    const handler = new TestHandler("DEBUG");
    const logger = new Logger("default", "DEBUG", { handlers: [handler] });
    const sym = Symbol();
    const syma = Symbol("a");
    const fn = (): string => {
      return "abc";
    };

    // string
    const data1: string = logger.debug("abc");
    assertEquals(data1, "abc");
    const data2: string = logger.debug("def", 1);
    assertEquals(data2, "def");
    assertEquals(handler.messages[0], "DEBUG abc");
    assertEquals(handler.messages[1], "DEBUG def");

    // null
    const data3: null = logger.info(null);
    assertEquals(data3, null);
    const data4: null = logger.info(null, 1);
    assertEquals(data4, null);
    assertEquals(handler.messages[2], "INFO null");
    assertEquals(handler.messages[3], "INFO null");

    // number
    const data5: number = logger.warn(3);
    assertEquals(data5, 3);
    const data6: number = logger.warn(3, 1);
    assertEquals(data6, 3);
    assertEquals(handler.messages[4], "WARN 3");
    assertEquals(handler.messages[5], "WARN 3");

    // bigint
    const data7: bigint = logger.error(5n);
    assertEquals(data7, 5n);
    const data8: bigint = logger.error(5n, 1);
    assertEquals(data8, 5n);
    assertEquals(handler.messages[6], "ERROR 5");
    assertEquals(handler.messages[7], "ERROR 5");

    // boolean
    const data9: boolean = logger.critical(true);
    assertEquals(data9, true);
    const data10: boolean = logger.critical(false, 1);
    assertEquals(data10, false);
    assertEquals(handler.messages[8], "CRITICAL true");
    assertEquals(handler.messages[9], "CRITICAL false");

    // undefined
    const data11: undefined = logger.debug(undefined);
    assertEquals(data11, undefined);
    const data12: undefined = logger.debug(undefined, 1);
    assertEquals(data12, undefined);
    assertEquals(handler.messages[10], "DEBUG undefined");
    assertEquals(handler.messages[11], "DEBUG undefined");

    // symbol
    const data13: symbol = logger.info(sym);
    assertEquals(data13, sym);
    const data14: symbol = logger.info(syma, 1);
    assertEquals(data14, syma);
    assertEquals(handler.messages[12], "INFO Symbol()");
    assertEquals(handler.messages[13], "INFO Symbol(a)");

    // function
    const data15: string | undefined = logger.warn(fn);
    assertEquals(data15, "abc");
    const data16: string | undefined = logger.warn(fn, 1);
    assertEquals(data16, "abc");
    assertEquals(handler.messages[14], "WARN abc");
    assertEquals(handler.messages[15], "WARN abc");

    // object
    const data17: { payload: string; other: number } = logger.error({
      payload: "data",
      other: 123,
    });
    assertEquals(data17, {
      payload: "data",
      other: 123,
    });
    const data18: { payload: string; other: number } = logger.error(
      { payload: "data", other: 123 },
      1,
    );
    assertEquals(data18, {
      payload: "data",
      other: 123,
    });
    const data19: { payload: string; other: bigint } = logger.error({
      payload: "data",
      other: 123n,
    });
    assertEquals(data19, {
      payload: "data",
      other: 123n,
    });
    const data20: { payload: string; other: bigint } = logger.error(
      { payload: "data", other: 123n },
      1,
    );
    assertEquals(data20, {
      payload: "data",
      other: 123n,
    });
    assertEquals(handler.messages[16], 'ERROR {"payload":"data","other":123}');
    assertEquals(handler.messages[17], 'ERROR {"payload":"data","other":123}');
    assertEquals(handler.messages[18], 'ERROR {"payload":"data","other":123}');
    assertEquals(handler.messages[19], 'ERROR {"payload":"data","other":123}');

    // error
    const error = new RangeError("Uh-oh!");
    const data21: RangeError = logger.error(error);
    assertEquals(data21, error);
    const messages21 = handler.messages[20]!.split("\n");
    assertEquals(messages21[0]!, `ERROR ${error.name}: ${error.message}`);
    assertMatch(messages21[1]!, /^\s+at file:.*\d+:\d+$/);
  },
);

Deno.test("Logger addContext(), removeContext(), clearContext(), and getContext()", () => {
  const handler = new TestHandler("DEBUG");
  const logger = new Logger("contextTest", "DEBUG", { handlers: [handler] });

  assertEquals(logger.getContext(), {});

  logger.addContext("userId", "12345");
  logger.addContext("requestId", "req-abc-123");

  const expectedContext = { userId: "12345", requestId: "req-abc-123" };
  assertEquals(logger.getContext(), expectedContext);

  logger.info("Test message");
  const record = handler.records[0];
  assertEquals(record?.context, expectedContext);
  assertEquals(record?.msg, "Test message");

  logger.removeContext("userId");
  logger.info("After removal");
  const recordAfterRemoval = handler.records[1];
  assertEquals(recordAfterRemoval?.context, { requestId: "req-abc-123" });

  logger.clearContext();
  assertEquals(logger.getContext(), {});

  logger.info("After clear");
  const recordAfterClear = handler.records[2];
  assertEquals(recordAfterClear?.context, {});
});

Deno.test("Logger context isolates between logger instances", () => {
  const handler1 = new TestHandler("DEBUG");
  const handler2 = new TestHandler("DEBUG");

  const logger1 = new Logger("logger1", "DEBUG", { handlers: [handler1] });
  const logger2 = new Logger("logger2", "DEBUG", { handlers: [handler2] });

  logger1.addContext("instance", "logger1");
  logger2.addContext("instance", "logger2");

  logger1.info("Message from logger1");
  logger2.info("Message from logger2");

  const record1 = handler1.records[0];
  const record2 = handler2.records[0];

  assertEquals(record1?.context, { instance: "logger1" });
  assertEquals(record2?.context, { instance: "logger2" });
});

Deno.test("Logger context supports complex data types", () => {
  const handler = new TestHandler("DEBUG");
  const logger = new Logger("complexTest", "DEBUG", { handlers: [handler] });

  const contextData = {
    string: "value",
    number: 42,
    boolean: true,
    null: null,
    object: { nested: "value" },
    array: [1, 2, 3],
  };

  logger.addContext("string", contextData.string);
  logger.addContext("number", contextData.number);
  logger.addContext("boolean", contextData.boolean);
  logger.addContext("null", contextData.null);
  logger.addContext("object", contextData.object);
  logger.addContext("array", contextData.array);

  logger.info("Complex context test");
  const record = handler.records[0];

  assertEquals(record?.context, contextData);
});

Deno.test("Logger context returns immutable copies", () => {
  const handler = new TestHandler("DEBUG");
  const logger = new Logger("immutableTest", "DEBUG", { handlers: [handler] });

  logger.addContext("original", "value");

  const contextCopy = logger.getContext();

  contextCopy.modified = "external";
  delete contextCopy.original;

  assertEquals(logger.getContext(), { original: "value" });

  logger.info("Test message");
  const record = handler.records[0];
  assertEquals(record?.context, { original: "value" });

  record!.context.recordModified = "external";

  logger.info("Second message");
  const recordAfterModification = handler.records[1];
  assertEquals(recordAfterModification?.context, { original: "value" });
  assert(!("recordModified" in recordAfterModification!.context));
});

Deno.test("Logger addContext() supports undefined values", () => {
  const handler = new TestHandler("DEBUG");
  const logger = new Logger("undefinedTest", "DEBUG", { handlers: [handler] });

  logger.addContext("undefinedKey", undefined);
  logger.addContext("normalKey", "value");

  const expectedContext = { undefinedKey: undefined, normalKey: "value" };
  assertEquals(logger.getContext(), expectedContext);

  logger.info("Test message");
  const record = handler.records[0];
  assertEquals(record?.context, expectedContext);
});

Deno.test("Logger addContext() overwrites existing keys", () => {
  const handler = new TestHandler("DEBUG");
  const logger = new Logger("overwriteTest", "DEBUG", { handlers: [handler] });

  logger.addContext("key", "original");
  assertEquals(logger.getContext(), { key: "original" });

  logger.addContext("key", "modified");
  assertEquals(logger.getContext(), { key: "modified" });

  logger.info("Test message");
  const record = handler.records[0];
  assertEquals(record?.context, { key: "modified" });
});

Deno.test("Logger removeContext() handles non-existent keys", () => {
  const handler = new TestHandler("DEBUG");
  const logger = new Logger("removeTest", "DEBUG", { handlers: [handler] });

  logger.addContext("existing", "value");

  logger.removeContext("nonExistent");

  assertEquals(logger.getContext(), { existing: "value" });

  logger.info("Test message");
  const record = handler.records[0];
  assertEquals(record?.context, { existing: "value" });
});

Deno.test("Logger clearContext() handles multiple operations", () => {
  const handler = new TestHandler("DEBUG");
  const logger = new Logger("clearTest", "DEBUG", { handlers: [handler] });

  logger.addContext("key1", "value1");
  logger.clearContext();
  assertEquals(logger.getContext(), {});

  logger.addContext("key2", "value2");
  logger.clearContext();
  assertEquals(logger.getContext(), {});

  logger.clearContext();
  assertEquals(logger.getContext(), {});

  logger.info("Test message");
  const record = handler.records[0];
  assertEquals(record?.context, {});
});
