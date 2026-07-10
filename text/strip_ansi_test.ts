// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { stripAnsi } from "./strip_ansi.ts";

Deno.test("stripAnsi() strips basic ANSI codes", () => {
  assertEquals(stripAnsi("\x1b[31mHello\x1b[0m"), "Hello");
});

Deno.test("stripAnsi() handles strings without ANSI codes", () => {
  assertEquals(stripAnsi("Hello"), "Hello");
});

Deno.test("stripAnsi() strips multiple ANSI codes", () => {
  assertEquals(stripAnsi("\x1b[1m\x1b[31mBold Red\x1b[0m"), "Bold Red");
});

Deno.test("stripAnsi() handles empty string", () => {
  assertEquals(stripAnsi(""), "");
});
