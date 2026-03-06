// Copyright 2018-2026 the Deno authors. MIT license.
import { assert, assertEquals, assertThrows } from "@std/assert";
import { isNil, NIL_UUID, validate, version } from "./mod.ts";

Deno.test("isNil() checks if a UUID is the nil UUID", () => {
  const nil = NIL_UUID;
  const u = "582cbcff-dad6-4f28-888a-e062ae36bafc";
  assert(isNil(nil));
  assert(!isNil(u));
});

Deno.test("validate() checks if a string is a valid UUID", () => {
  const u = "582cbcff-dad6-4f28-888a-e062ae36bafc";
  const nil = NIL_UUID;
  assert(validate(u));
  assert(validate(nil));
  assert(!validate("not a UUID"));
});

Deno.test("version() detects the RFC version of a UUID", () => {
  assertEquals(version(NIL_UUID), 0);
  assertEquals(version("d9428888-122b-11e1-b85c-61cd3cbb3210"), 1);
  assertEquals(version("109156be-c4fb-41ea-b1b4-efe1671c5836"), 4);
  assertEquals(version("a981a0c2-68b1-35dc-bcfc-296e52ab01ec"), 3);
  assertEquals(version("90123e1c-7512-523e-bb28-76fab9f2f73d"), 5);
  assertEquals(version("1efed817-4119-6c50-974a-e638d7b30e9e"), 6);
  assertEquals(version("017f22e2-79b0-7cc3-98c4-dc0c0c07398f"), 7);
  assertThrows(() => version(""));
  assertThrows(() => version("not a UUID"));
  assertThrows(() => version("00000000000000000000000000000000"));
  assertThrows(
    () =>
      version(
        "=Y00a-f*v00b*-00c-00d#-p00f\b-00g-00h-####00i^^^-00j*1*2*3&-L00k-\n00l-/00m-----00n-fg000-00p-00r+",
      ),
    TypeError,
    "Cannot detect UUID version: received =Y00a-f*v00b*-00c-00d#-p00f\b-00g-00h-####00i^^^-00j*1*2*3&-L00k-\n00l-/00m-----00n-fg000-00p-00r+",
  );
});
