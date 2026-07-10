// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { escapeHtml } from "./escape_html.ts";

Deno.test("escapeHtml() escapes HTML special characters", () => {
  assertEquals(
    escapeHtml("<script>alert('xss')</script>"),
    "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
  );
});

Deno.test("escapeHtml() escapes ampersands first", () => {
  assertEquals(escapeHtml("a & b"), "a &amp; b");
});

Deno.test("escapeHtml() handles strings without special chars", () => {
  assertEquals(escapeHtml("hello"), "hello");
});

Deno.test("escapeHtml() handles empty string", () => {
  assertEquals(escapeHtml(""), "");
});
