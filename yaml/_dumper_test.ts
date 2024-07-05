// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { trimTrailingNewline } from "./_dumper.ts";

Deno.test("trimTrailingNewline()", async (t) => {
  await t.step("handles single line", () => {
    assertEquals(trimTrailingNewline("hello\nworld"), "hello\nworld");
  });
  await t.step("handles trailing newline", () => {
    assertEquals(trimTrailingNewline("hello\nworld\n"), "hello\nworld");
  });
});
