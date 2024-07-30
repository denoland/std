// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import * as windows from "./windows/mod.ts";
import * as posix from "./posix/mod.ts";

Deno.test(`normalize() returns "." if input is empty`, function () {
  assertEquals(posix.normalize(""), ".");
  assertEquals(windows.normalize(""), ".");
});

Deno.test("windows.normalize() normalizes windows specific paths", () => {
  assertEquals(
    windows.normalize("//server/share/dir/file.ext"),
    "\\\\server\\share\\dir\\file.ext",
  );
});
