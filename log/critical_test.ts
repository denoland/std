// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { critical } from "./critical.ts";

Deno.test("critical()", () => {
  const criticalData: string = critical("foo");
  const criticalResolver: string | undefined = critical(() => "bar");
  assertEquals(criticalData, "foo");
  assertEquals(criticalResolver, "bar");
});
