// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assert } from "../testing/asserts.ts";
import { isNil, NIL_UUID, validate } from "./mod.ts";

Deno.test("[UUID] isNil", () => {
  const nil = NIL_UUID;
  const u = "582cbcff-dad6-4f28-888a-e062ae36bafc";
  assert(isNil(nil));
  assert(!isNil(u));
});

Deno.test("[UUID] validate", () => {
  const u = "582cbcff-dad6-4f28-888a-e062ae36bafc";
  const nil = NIL_UUID;
  assert(validate(u));
  assert(validate(nil));
  assert(!validate("not a UUID"));
});
