// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { debounce, type DebouncedFunction } from "./debounce.ts";
import { delay } from "./delay.ts";

Deno.test("debounce() handles called", async () => {
  let called = 0;
  const d = debounce(() => called++, 100);
  d();
  d();
  d();
  assertEquals(called, 0);
  assertEquals(d.pending, true);
  await delay(200);
  assertEquals(called, 1);
  assertEquals(d.pending, false);
});

Deno.test("debounce() handles cancelled", async () => {
  let called = 0;
  const d = debounce(() => called++, 100);
  d();
  d();
  d();
  assertEquals(called, 0);
  assertEquals(d.pending, true);
  d.clear();
  await delay(200);
  assertEquals(called, 0);
  assertEquals(d.pending, false);
});

Deno.test("debounce() handles flush", () => {
  let called = 0;
  const d = debounce(() => called++, 100);
  d();
  d();
  d();
  assertEquals(called, 0);
  assertEquals(d.pending, true);
  d.flush();
  assertEquals(called, 1);
  assertEquals(d.pending, false);
});

Deno.test("debounce() handles params and context", async () => {
  const params: Array<string | number> = [];
  const d: DebouncedFunction<[string, number]> = debounce(
    function (param1: string, param2: number) {
      assertEquals(d.pending, false);
      params.push(param1);
      params.push(param2);
      assertStrictEquals(d, this);
    },
    100,
  );
  // @ts-expect-error Argument of type 'number' is not assignable to parameter of type 'string'.
  d(1, 1);
  d("foo", 1);
  d("bar", 1);
  d("baz", 1);
  assertEquals(params.length, 0);
  assertEquals(d.pending, true);
  await delay(200);
  assertEquals(params, ["baz", 1]);
  assertEquals(d.pending, false);
});

Deno.test("debounce() handles number and string types", async () => {
  const params: Array<string> = [];
  const fn = (param: string) => params.push(param);
  const d: DebouncedFunction<[string]> = debounce(fn, 100);
  // @ts-expect-error Argument of type 'number' is not assignable to parameter of type 'string'.
  d(1);
  d("foo");
  assertEquals(params.length, 0);
  assertEquals(d.pending, true);
  await delay(200);
  assertEquals(params, ["foo"]);
  assertEquals(d.pending, false);
});

Deno.test("debounce() flush is a no-op when nothing is pending", () => {
  let called = 0;
  const d = debounce(() => called++, 100);
  d.flush();
  assertEquals(called, 0);
  assertEquals(d.pending, false);
});

Deno.test("debounce() clear is a no-op when nothing is pending", () => {
  let called = 0;
  const d = debounce(() => called++, 100);
  d.clear();
  assertEquals(called, 0);
  assertEquals(d.pending, false);
});

Deno.test("debounce() double flush only calls fn once", () => {
  let called = 0;
  const d = debounce(() => called++, 100);
  d();
  d.flush();
  d.flush();
  assertEquals(called, 1);
  assertEquals(d.pending, false);
});

Deno.test("debounce() throws on invalid wait values", () => {
  const fn = () => {};
  for (const wait of [0.5, -1, NaN, Infinity]) {
    assertThrows(
      () => debounce(fn, wait),
      RangeError,
      "'wait' must be a positive integer",
    );
  }
});

Deno.test("debounce() re-invocation after flush re-schedules", async () => {
  let called = 0;
  const d = debounce(() => called++, 50);
  d();
  d.flush();
  assertEquals(called, 1);
  assertEquals(d.pending, false);
  d();
  assertEquals(d.pending, true);
  await delay(100);
  assertEquals(called, 2);
  assertEquals(d.pending, false);
});
