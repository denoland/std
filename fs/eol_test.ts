// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { format, detect, EOL } from "./eol.ts";

const CRLFinput = "deno\r\nis not\r\nnode";
const LFinput = "deno\nis not\nnode";

test(function detectCRLF() {
  assertEquals(detect(CRLFinput), EOL.CRLF);
});
test(function detectLF() {
  assertEquals(detect(LFinput), EOL.LF);
});
test(function detectNoNewLine() {
  const input = "deno is not node";
  assertEquals(detect(input), null);
});
test(function testFormat() {
  assertEquals(format(CRLFinput, EOL.LF), LFinput);
  assertEquals(format(LFinput, EOL.LF), LFinput);
  assertEquals(format(LFinput, EOL.CRLF), CRLFinput);
  assertEquals(format(CRLFinput, EOL.CRLF), CRLFinput);
});
