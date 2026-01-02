// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { encodeWhitespace } from "./to_file_url.ts";

Deno.test("encodeWhitespace()", () => {
  assertEquals(encodeWhitespace("foo"), "foo");
  assertEquals(encodeWhitespace("foo\tbar"), "foo%09bar");
  assertEquals(encodeWhitespace("foo\nbar"), "foo%0Abar");
  assertEquals(encodeWhitespace("foo\vbar"), "foo%0Bbar");
  assertEquals(encodeWhitespace("foo\fbar"), "foo%0Cbar");
  assertEquals(encodeWhitespace("foo\rbar"), "foo%0Dbar");
  assertEquals(encodeWhitespace("foo bar"), "foo%20bar");
  assertEquals(encodeWhitespace("foo\u0009bar"), "foo%09bar");
  assertEquals(encodeWhitespace("foo\u000Abar"), "foo%0Abar");
  assertEquals(encodeWhitespace("foo\u000Bbar"), "foo%0Bbar");
  assertEquals(encodeWhitespace("foo\u000Cbar"), "foo%0Cbar");
  assertEquals(encodeWhitespace("foo\u000Dbar"), "foo%0Dbar");
  assertEquals(encodeWhitespace("foo\u0020bar"), "foo%20bar");
  assertEquals(encodeWhitespace("foo\ufeffbar"), "foo﻿bar");
});
