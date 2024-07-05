// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { indentString } from "./_dumper.ts";

Deno.test("indentString()", async (t) => {
  await t.step("handles single line", () => {
    assertEquals(indentString("hello world", 2), "  hello world");
  });
  await t.step("handles multiple lines", () => {
    assertEquals(indentString("\nhello\nworld\n", 2), "\n  hello\n  world\n");
  });
  await t.step("handles empty line", () => {
    assertEquals(indentString("hello\n\nworld", 2), "  hello\n\n  world");
  });
  await t.step("handles empty lines", () => {
    assertEquals(
      indentString("\n\nhello\n\nworld\n\n", 2),
      "\n\n  hello\n\n  world\n\n",
    );
  });
});
