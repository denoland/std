// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import "./setup.ts";
import { debug } from "./debug.ts";

Deno.test("debug()", () => {
  const debugData: string = debug("foo");
  const debugResolver: string | undefined = debug(() => "foo");
  assertEquals(debugData, "foo");
  assertEquals(debugResolver, undefined);
});
