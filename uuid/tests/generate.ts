// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { test } from "https://deno.land/std/testing/mod.ts";
import mod, { validate, v4 } from "../mod.ts";
import { validate as validate4 } from "../v4.ts";

test(function test_uuid_v4() {
  const u = mod();
  assertEquals(typeof u, "string", "returns a string");
  assert(u !== "", "return string is not empty");
});

test(function test_uuid_v4_format() {
  for (let i = 0; i < 10000; i++) {
    const u = mod() as string;
    assert(validate(u), `${u} is not a valid uuid v4`);
  }
});

test(function test_default_is_v4() {
  assertEquals(mod, v4, "default is v4");
  assertEquals(validate, validate4, "validate is v4");
});
