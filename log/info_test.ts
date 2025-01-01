// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";
import { blue } from "@std/fmt/colors";
import { info } from "./info.ts";

Deno.test("info()", () => {
  using consoleInfoSpy = spy(console, "log");
  const infoData: number = info(456, 1, 2, 3);
  const infoResolver: boolean | undefined = info(() => true);
  assertEquals(infoData, 456);
  assertEquals(infoResolver, true);
  assertSpyCall(consoleInfoSpy, 0, {
    args: [blue("INFO 456")],
  });
  assertSpyCall(consoleInfoSpy, 1, {
    args: [blue("INFO true")],
  });
});
