// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { assert } from "https://deno.land/std/testing/asserts.ts";
import { test } from "https://deno.land/std/testing/mod.ts";
// @ts-ignore
import { NIL_UUID, isNil } from "../mod.ts";

test(function test_isNil() {
  const nil = NIL_UUID;
  const u = "582cbcff-dad6-4f28-888a-e062ae36bafc";
  assert(isNil(nil));
  assert(!isNil(u));
  console.log("");
});
