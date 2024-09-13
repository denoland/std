// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";
import { warn } from "./warn.ts";

Deno.test("warn()", () => {
  using consoleInfoSpy = spy(console, "log");
  const sym = Symbol("a");
  const warnData: symbol = warn(sym);
  const warnResolver: null | undefined = warn(() => null);
  assertEquals(warnData, sym);
  assertEquals(warnResolver, null);
  assertSpyCall(consoleInfoSpy, 0, {
    args: ["WARN Symbol(a)"],
  });
  assertSpyCall(consoleInfoSpy, 1, {
    args: ["WARN null"],
  });
});
