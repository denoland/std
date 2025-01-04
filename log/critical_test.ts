// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";
import { bold, red } from "@std/fmt/colors";
import { critical } from "./critical.ts";

Deno.test("critical()", () => {
  using consoleInfoSpy = spy(console, "log");
  const criticalData: string = critical("foo");
  const criticalResolver: string | undefined = critical(() => "bar");
  assertEquals(criticalData, "foo");
  assertEquals(criticalResolver, "bar");
  assertSpyCall(consoleInfoSpy, 0, {
    args: [bold(red("CRITICAL foo"))],
  });
  assertSpyCall(consoleInfoSpy, 1, {
    args: [bold(red("CRITICAL bar"))],
  });
});
