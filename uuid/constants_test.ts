// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import {
  NAMESPACE_DNS,
  NAMESPACE_OID,
  NAMESPACE_URL,
  NAMESPACE_X500,
} from "./constants.ts";
import { validate } from "./mod.ts";

Deno.test("validate() validates the pre-defined namespaces", () => {
  assertEquals(validate(NAMESPACE_DNS), true);
  assertEquals(validate(NAMESPACE_URL), true);
  assertEquals(validate(NAMESPACE_OID), true);
  assertEquals(validate(NAMESPACE_X500), true);
});
