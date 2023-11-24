// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { CRLF, detect, format, LF } from "./eol.ts";

const CRLFinput = "deno\r\nis not\r\nnode";
const Mixedinput = "deno\nis not\r\nnode";
const Mixedinput2 = "deno\r\nis not\nnode";
const LFinput = "deno\nis not\nnode";
const NoNLinput = "deno is not node";

Deno.test({
  name: "detect() detects CRLF as the end-of-line character",
  fn() {
    assertEquals(detect(CRLFinput), CRLF);
  },
});

Deno.test({
  name: "detect() detects LF as the end-of-line character",
  fn() {
    assertEquals(detect(LFinput), LF);
  },
});

Deno.test({
  name: "detect() returns null for a string with no end-of-line character",
  fn() {
    assertEquals(detect(NoNLinput), null);
  },
});

Deno.test({
  name:
    "detect() detects the most common end-of-line character in a mixed string",
  fn() {
    assertEquals(detect(Mixedinput), CRLF);
    assertEquals(detect(Mixedinput2), CRLF);
  },
});

Deno.test({
  name: "format() converts the end-of-line character to the specified one",
  fn() {
    assertEquals(format(CRLFinput, LF), LFinput);
    assertEquals(format(LFinput, LF), LFinput);
    assertEquals(format(LFinput, CRLF), CRLFinput);
    assertEquals(format(CRLFinput, CRLF), CRLFinput);
    assertEquals(format(CRLFinput, CRLF), CRLFinput);
    assertEquals(format(NoNLinput, CRLF), NoNLinput);
    assertEquals(format(Mixedinput, CRLF), CRLFinput);
    assertEquals(format(Mixedinput, LF), LFinput);
    assertEquals(format(Mixedinput2, CRLF), CRLFinput);
    assertEquals(format(Mixedinput2, LF), LFinput);
  },
});
