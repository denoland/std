// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { error } from "./error.ts";

Deno.test("error()", () => {
  const errorData: undefined = error(undefined, 1, 2, 3);
  const errorResolver: bigint | undefined = error(() => 5n);
  assertEquals(errorData, undefined);
  assertEquals(errorResolver, 5n);
});
