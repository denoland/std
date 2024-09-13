// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";
import { debug } from "./debug.ts";

Deno.test("debug()", () => {
  using consoleInfoSpy = spy(console, "log");
  const debugData: string = debug("foo");
  const debugResolver: string | undefined = debug(() => "foo");
  assertEquals(debugData, "foo");
  assertEquals(debugResolver, undefined);
  assertSpyCall(consoleInfoSpy, 0, {
    args: ["DEBUG foo"],
  });
  assertSpyCall(consoleInfoSpy, 1, {
    args: ["DEBUG foo"],
  });
});
