// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import * as windows from "./windows/mod.ts";
import * as posix from "./posix/mod.ts";

Deno.test(`normalize() returns "." if input is empty`, function () {
  assertEquals(posix.normalize(""), ".");
  assertEquals(windows.normalize(""), ".");
});

Deno.test("posix.normalize() normalizes posix specific paths", () => {
  assertEquals(
    posix.normalize("/foo/bar//baz/asdf/quux/.."),
    "/foo/bar/baz/asdf",
  );
  assertEquals(
    posix.normalize(new URL("file:///foo/bar//baz/asdf/quux/..")),
    "/foo/bar/baz/asdf/",
  );
});

Deno.test("windows.normalize() normalizes windows specific paths", () => {
  assertEquals(
    windows.normalize("//server/share/dir/file.ext"),
    "\\\\server\\share\\dir\\file.ext",
  );
  assertEquals(
    windows.normalize(new URL("file:///C:/foo/bar/../baz/quux")),
    "C:\\foo\\baz\\quux",
  );
});
