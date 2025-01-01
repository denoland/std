// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";
import { yellow } from "@std/fmt/colors";
import { warn } from "./warn.ts";

Deno.test("warn()", () => {
  using consoleInfoSpy = spy(console, "log");
  const sym = Symbol("a");
  const warnData: symbol = warn(sym);
  const warnResolver: null | undefined = warn(() => null);
  assertEquals(warnData, sym);
  assertEquals(warnResolver, null);
  assertSpyCall(consoleInfoSpy, 0, {
    args: [yellow("WARN Symbol(a)")],
  });
  assertSpyCall(consoleInfoSpy, 1, {
    args: [yellow("WARN null")],
  });
});
