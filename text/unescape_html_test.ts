// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { unescapeHtml } from "./unescape_html.ts";

Deno.test("unescapeHtml() unescapes HTML entities", () => {
  assertEquals(
    unescapeHtml("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"),
    "<script>alert('xss')</script>",
  );
});

Deno.test("unescapeHtml() unescapes ampersand", () => {
  assertEquals(unescapeHtml("a &amp; b"), "a & b");
});

Deno.test("unescapeHtml() handles strings without entities", () => {
  assertEquals(unescapeHtml("hello"), "hello");
});

Deno.test("unescapeHtml() handles empty string", () => {
  assertEquals(unescapeHtml(""), "");
});
