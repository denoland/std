// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { warn } from "./warn.ts";

Deno.test("warn()", () => {
  const sym = Symbol("a");
  const warnData: symbol = warn(sym);
  const warnResolver: null | undefined = warn(() => null);
  assertEquals(warnData, sym);
  assertEquals(warnResolver, null);
});
