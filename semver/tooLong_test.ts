// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("versionIsTooLong", function () {
  const v: string = "1.2." + new Array(256).join("1");

  assertThrows(function () {
    new semver.SemVer(v);
  });
  assertEquals(semver.valid(v), null);
  assertEquals(semver.increment(v, "patch"), null);
});

Deno.test("tooBig", function () {
  const v = "1.2." + new Array(100).join("1");
  assertThrows(function () {
    new semver.SemVer(v);
  });
  assertEquals(semver.valid(v), null);
  assertEquals(semver.increment(v, "patch"), null);
});

Deno.test("parsingNullDoesNotThrow", function () {
  assertEquals(semver.parse(null), null);
  assertEquals(semver.parse({} as semver.SemVer), null);
  assertEquals(semver.parse(new semver.SemVer("1.2.3"))!.version, "1.2.3");
});
