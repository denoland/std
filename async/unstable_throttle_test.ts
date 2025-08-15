// Copyright 2018-2025 the Deno authors. MIT license.
import {
  assertEquals,
  assertGreater,
  assertLess,
  assertNotEquals,
  assertStrictEquals,
} from "@std/assert";
import { throttle, type ThrottledFunction } from "./unstable_throttle.ts";
import { delay } from "./delay.ts";
import { FakeTime } from "@std/testing/time";

Deno.test("throttle() handles called", async () => {
  let called = 0;
  const t = throttle(() => called++, 100);
  assertEquals(t.throttling, false);
  assertEquals(t.lastExecution, NaN);
  t();
  const { lastExecution } = t;
  t();
  t();
  assertLess(Math.abs(t.lastExecution - Date.now()), 100);
  assertEquals(called, 1);
  assertEquals(t.throttling, true);
  assertEquals(t.lastExecution, lastExecution);
  await delay(200);
  assertEquals(called, 1);
  assertEquals(t.throttling, false);
  assertEquals(t.lastExecution, lastExecution);
  t();
  assertEquals(called, 2);
  assertEquals(t.throttling, true);
  assertGreater(t.lastExecution, lastExecution);
});

Deno.test("throttle() handles cancelled", () => {
  let called = 0;
  const t = throttle(() => called++, 100);
  t();
  t();
  t();
  assertEquals(called, 1);
  assertEquals(t.throttling, true);
  assertNotEquals(t.lastExecution, NaN);
  t.clear();
  assertEquals(called, 1);
  assertEquals(t.throttling, false);
  assertEquals(t.lastExecution, NaN);
});

Deno.test("throttle() handles flush", () => {
  let called = 0;
  let arg = "";
  const t = throttle((_arg) => {
    arg = _arg;
    called++;
  }, 100);
  t("foo");
  t("bar");
  t("baz");
  assertEquals(called, 1);
  assertEquals(arg, "foo");
  assertEquals(t.throttling, true);
  assertNotEquals(t.lastExecution, NaN);
  for (const _ of [1, 2]) {
    t.flush();
    assertEquals(called, 2);
    assertEquals(arg, "baz");
    assertEquals(t.throttling, false);
    assertEquals(t.lastExecution, NaN);
  }
});

Deno.test("throttle() handles params and context", async () => {
  const params: Array<string | number> = [];
  const t: ThrottledFunction<[string, number]> = throttle(
    function (param1: string, param2: number) {
      params.push(param1);
      params.push(param2);
      assertStrictEquals(t, this);
    },
    100,
  );
  t("foo", 1);
  t("bar", 1);
  t("baz", 1);
  // @ts-expect-error Argument of type 'number' is not assignable to parameter of type 'string'.
  t(1, 1);
  assertEquals(params, ["foo", 1]);
  assertEquals(t.throttling, true);
  await delay(200);
  assertEquals(params, ["foo", 1]);
  assertEquals(t.throttling, false);
});

Deno.test("throttle() handles ensureLastCall option", async (t) => {
  for (
    const options of [
      undefined,
      {},
      { ensureLastCall: false },
      { ensureLastCall: true },
    ]
  ) {
    const ensure = options?.ensureLastCall === true;
    const description = `${
      ensure ? "Ensures" : "Doesn't ensure"
    } last call when options set to ${JSON.stringify(options)}`;

    await t.step(description, () => {
      using time = new FakeTime();
      const calls: string[] = [];
      const fn = throttle(
        (x: string) => calls.push(x),
        100,
        options,
      );
      fn("foo");
      fn("bar");
      fn("baz");
      assertEquals(calls, ["foo"]);
      assertEquals(fn.throttling, true);
      time.tick(200);

      if (ensure) {
        assertEquals(calls, ["foo", "baz"]);
        assertEquals(fn.throttling, true);
        time.tick(1);
        assertEquals(fn.throttling, false);
      } else {
        assertEquals(calls, ["foo"]);
        assertEquals(fn.throttling, false);
      }
    });
  }
});
