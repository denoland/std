// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";
import { critical } from "./critical.ts";

Deno.test("critical()", () => {
  using consoleInfoSpy = spy(console, "log");
  const criticalData: string = critical("foo");
  const criticalResolver: string | undefined = critical(() => "bar");
  assertEquals(criticalData, "foo");
  assertEquals(criticalResolver, "bar");
  assertSpyCall(consoleInfoSpy, 0, {
    args: ["CRITICAL foo"],
  });
  assertSpyCall(consoleInfoSpy, 1, {
    args: ["CRITICAL bar"],
  });
});
