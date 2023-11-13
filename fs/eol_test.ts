// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { CRLF, detect, EOL, format, LF } from "./eol.ts";

const CRLFinput = "deno\r\nis not\r\nnode";
const Mixedinput = "deno\nis not\r\nnode";
const Mixedinput2 = "deno\r\nis not\nnode";
const LFinput = "deno\nis not\nnode";
const NoNLinput = "deno is not node";

Deno.test({
  name: "[EOL] Detect CR LF",
  fn() {
    assertEquals(detect(CRLFinput), CRLF);
  },
});

Deno.test({
  name: "[EOL] Detect LF",
  fn() {
    assertEquals(detect(LFinput), LF);
  },
});

Deno.test({
  name: "[EOL] Detect No New Line",
  fn() {
    assertEquals(detect(NoNLinput), null);
  },
});

Deno.test({
  name: "[EOL] Detect Mixed",
  fn() {
    assertEquals(detect(Mixedinput), CRLF);
    assertEquals(detect(Mixedinput2), CRLF);
  },
});

Deno.test({
  name: "[EOL] Format",
  fn() {
    assertEquals(format(CRLFinput, EOL), LFinput);
    assertEquals(format(LFinput, EOL), LFinput);
    assertEquals(format(LFinput, CRLF), CRLFinput);
    assertEquals(format(CRLFinput, CRLF), CRLFinput);
    assertEquals(format(CRLFinput, CRLF), CRLFinput);
    assertEquals(format(NoNLinput, CRLF), NoNLinput);
    assertEquals(format(Mixedinput, CRLF), CRLFinput);
    assertEquals(format(Mixedinput, EOL), LFinput);
    assertEquals(format(Mixedinput2, CRLF), CRLFinput);
    assertEquals(format(Mixedinput2, EOL), LFinput);
  },
});
