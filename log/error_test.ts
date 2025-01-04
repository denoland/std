// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";
import { red } from "@std/fmt/colors";
import { error } from "./error.ts";

Deno.test("error()", () => {
  using consoleInfoSpy = spy(console, "log");
  const errorData: undefined = error(undefined, 1, 2, 3);
  const errorResolver: bigint | undefined = error(() => 5n);
  assertEquals(errorData, undefined);
  assertEquals(errorResolver, 5n);
  assertSpyCall(consoleInfoSpy, 0, {
    args: [red("ERROR undefined")],
  });
  assertSpyCall(consoleInfoSpy, 1, {
    args: [red("ERROR 5")],
  });
});
