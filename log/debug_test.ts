// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { debug } from "./debug.ts";

Deno.test("debug()", () => {
  const debugData: string = debug("foo");
  const debugResolver: string | undefined = debug(() => "foo");
  assertEquals(debugData, "foo");
  assertEquals(debugResolver, undefined);
});
