// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { normalize } from "./normalize.ts";

Deno.test(`normalize() returns "." if input is empty`, function () {
  assertEquals(normalize(""), ".");

  const pwd = Deno.cwd();
  assertEquals(normalize(pwd), pwd);
});
