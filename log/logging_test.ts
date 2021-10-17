import { buildDefaultLogMessage, buildLogger, LogHandler } from "./logging.ts";
import { assert, assertEquals, assertMatch } from "../testing/asserts.ts";

const testLevels = {
  low: 1,
  middle: 2,
  high: 3,
};
type TestLevels = typeof testLevels;
const messages: [keyof TestLevels, number, unknown][] = [];
const resetTestMessages = () => messages.splice(0, messages.length);
const testHandler: LogHandler<TestLevels, number, () => unknown> = (
  level,
  message,
  data,
) => {
  messages.push([level, message, data?.()]);
};
const testLogger = buildLogger(testLevels, "middle", testHandler);

Deno.test("Custom log levels build a console-like log API", () => {
  Object
    .keys(testLevels)
    .forEach((it) =>
      assertEquals(typeof testLogger[it as keyof TestLevels], "function")
    );
});

Deno.test("Custom handler gets called", () => {
  resetTestMessages();

  testLogger.high(3, () => []);

  assertEquals(messages, [
    ["high", 3, []],
  ]);
});

Deno.test("Default dispatching filters by level priority", () => {
  resetTestMessages();

  testLogger.middle(1);
  testLogger.high(5);
  testLogger.low(10);
  testLogger.low(-2.2);
  testLogger.high(8);
  testLogger.low(1);
  testLogger.middle(0);
  testLogger.low(4);
  testLogger.high(23);

  assertEquals(messages, [
    ["middle", 1, undefined],
    ["high", 5, undefined],
    ["high", 8, undefined],
    ["middle", 0, undefined],
    ["high", 23, undefined],
  ]);
});

Deno.test("Custom dispatcher is in control", () => {
  resetTestMessages();

  let toggle = false;
  const customDisptachLogger = buildLogger(
    testLevels,
    "middle",
    testHandler,
    (_logLevels, _thresholdLevel, handler, ...handlerArgs) => {
      if (toggle) {
        handler(...handlerArgs);
      }

      toggle = !toggle;
    },
  );

  customDisptachLogger.middle(1);
  customDisptachLogger.high(5);
  customDisptachLogger.low(10);
  customDisptachLogger.low(-2.2);
  customDisptachLogger.high(8);
  customDisptachLogger.low(1);
  customDisptachLogger.middle(0);
  customDisptachLogger.low(4);
  customDisptachLogger.high(23);

  assertEquals(messages, [
    ["high", 5, undefined],
    ["low", -2.2, undefined],
    ["low", 1, undefined],
    ["low", 4, undefined],
  ]);
});

Deno.test("Default message formatter returns a string for any input", () => {
  assertEquals(typeof buildDefaultLogMessage("some", "", ""), "string");
  assertEquals(typeof buildDefaultLogMessage("some", () => {}, -15), "string");
  assertEquals(typeof buildDefaultLogMessage("some", undefined, {}), "string");
  assertEquals(typeof buildDefaultLogMessage("some", null, []), "string");
  assertEquals(typeof buildDefaultLogMessage("some", [1, 2], null), "string");
  assertEquals(
    typeof buildDefaultLogMessage("some", { a: 15, b: "asdf" }, BigInt(-23)),
    "string",
  );
  assertEquals(
    typeof buildDefaultLogMessage("some", Number.NaN, Symbol.iterator),
    "string",
  );
});

Deno.test("Default message formatter formatting", () => {
  const formattingTest = (data: unknown, endsIn: string) => {
    const message = buildDefaultLogMessage("asdf", "test", data);

    assertMatch(message, /^\[asdf\]\t\[.+\]/u);
    assert(message.endsWith(endsIn), `Message ends with ${endsIn}`);
  };

  formattingTest(undefined, "test");
  formattingTest({}, "{}");
  formattingTest([], "[]");
  formattingTest(5, "5");
  formattingTest(null, "test");
  formattingTest({ a: true, b: "asd" }, `{"a":true,"b":"asd"}`);
  formattingTest(() => {}, "<Function>");
});
