import {
    buildThirdPartyLogger,
  addDefaultLogger,
  disableDefaultConsoleLogger,
  log,
  setDefaultConsoleLoggerThreshold,
  setThirdPartyDefaultThreshold,
  setThirdPartyThresholds,
} from "./default_logger.ts";
import { assertEquals } from "../testing/asserts.ts";
import type { DefaultLogger } from "./default_logger.ts";

const calls: unknown[] = [];
const resetCalls = () => calls.splice(0, calls.length)

const testLogger = new Proxy({}, {
  get(_, prop) {
    return (...args: unknown[]) => calls.push([prop, ...args]);
  },
});

disableDefaultConsoleLogger();
addDefaultLogger(testLogger as DefaultLogger);
addDefaultLogger(testLogger as DefaultLogger);

Deno.test("default logger registrations get called", () => {
  resetCalls()

  log.warn("Some message");
  log.info("Another message", { foo: "bar" });

  assertEquals(calls, [
    ["warn", "Some message", undefined],
    ["warn", "Some message", undefined],
    ["info", "Another message", { foo: "bar" }],
    ["info", "Another message", { foo: "bar" }],
  ]);
});

Deno.test("Framework logging", () => {
  resetCalls()

  const fooLogger = buildThirdPartyLogger("foo")
  const barLogger = buildThirdPartyLogger("bar")

  setThirdPartyDefaultThreshold("info")
  setThirdPartyThresholds({
      foo: "debug",
  })

  fooLogger.trace("A")
  fooLogger.debug("B")
  barLogger.debug("C")
  barLogger.info("D")

  assertEquals(calls, [
      ["debug", "[foo]\tB", undefined],
      ["debug", "[foo]\tB", undefined],
      ["info", "[bar]\tD", undefined],
      ["info", "[bar]\tD", undefined],
  ])
});
