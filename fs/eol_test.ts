// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { CRLF, detect, format, LF } from "./eol.ts";

const CRLF_INPUT = "deno\r\nis not\r\nnode";
const MIXED_INPUT = "deno\nis not\r\nnode";
const MIXED_INPUT2 = "deno\r\nis not\nnode";
const LF_INPUT = "deno\nis not\nnode";
const NO_NL_INPUT = "deno is not node";

Deno.test({
  name: "detect() detects CRLF as the end-of-line character",
  fn() {
    assertEquals(detect(CRLF_INPUT), CRLF);
  },
});

Deno.test({
  name: "detect() detects LF as the end-of-line character",
  fn() {
    assertEquals(detect(LF_INPUT), LF);
  },
});

Deno.test({
  name: "detect() returns null for a string with no end-of-line character",
  fn() {
    assertEquals(detect(NO_NL_INPUT), null);
  },
});

Deno.test({
  name:
    "detect() detects the most common end-of-line character in a mixed string",
  fn() {
    assertEquals(detect(MIXED_INPUT), CRLF);
    assertEquals(detect(MIXED_INPUT2), CRLF);
  },
});

Deno.test({
  name: "format() converts the end-of-line character to the specified one",
  fn() {
    assertEquals(format(CRLF_INPUT, LF), LF_INPUT);
    assertEquals(format(LF_INPUT, LF), LF_INPUT);
    assertEquals(format(LF_INPUT, CRLF), CRLF_INPUT);
    assertEquals(format(CRLF_INPUT, CRLF), CRLF_INPUT);
    assertEquals(format(CRLF_INPUT, CRLF), CRLF_INPUT);
    assertEquals(format(NO_NL_INPUT, CRLF), NO_NL_INPUT);
    assertEquals(format(MIXED_INPUT, CRLF), CRLF_INPUT);
    assertEquals(format(MIXED_INPUT, LF), LF_INPUT);
    assertEquals(format(MIXED_INPUT2, CRLF), CRLF_INPUT);
    assertEquals(format(MIXED_INPUT2, LF), LF_INPUT);
  },
});
