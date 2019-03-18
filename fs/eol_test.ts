// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { format, detect, EOL } from "./eol.ts";

test(function detectCRLF() {
  const input = "deno\r\nis not\r\nnode";
  assertEquals(detect(input), EOL.CRLF);
});
test(function detectLF() {
  const input = "deno\nis not\nnode";
  assertEquals(detect(input), EOL.LF);
});
test(function detectNoNewLine() {
  const input = "deno is not node";
  assertEquals(detect(input), null);
});
test(function testFormat() {
  const CRLFinput = "deno\r\nis not\r\nnode";
  const LFinput = "deno\nis not\nnode";
  assertEquals(format(CRLFinput, EOL.LF), LFinput);
  assertEquals(format(LFinput, EOL.LF), LFinput);
  assertEquals(format(LFinput, EOL.CRLF), CRLFinput);
  assertEquals(format(CRLFinput, EOL.CRLF), CRLFinput);
});
