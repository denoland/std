// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import * as windows from "./windows/mod.ts";
import * as posix from "./posix/mod.ts";

Deno.test("windows.joinGlobs() joins the glob patterns", function () {
  assertEquals(
    windows.joinGlobs(["foo", "*", "bar"]),
    `foo\\*\\bar`,
  );
  assertEquals(
    windows.joinGlobs([""], { globstar: true }),
    ".",
  );
  assertEquals(
    windows.joinGlobs(["**", ".."], { globstar: true }),
    `**\\..`,
  );
});

Deno.test("windows.joinGlobs() joins the glob patterns", function () {
  assertEquals(
    posix.joinGlobs(["foo", "*", "bar"]),
    `foo/*/bar`,
  );
  assertEquals(
    posix.joinGlobs([""], { globstar: true }),
    ".",
  );
  assertEquals(
    posix.joinGlobs(["**", ".."], { globstar: true }),
    `**/..`,
  );
});
