// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../testing/asserts.ts";
import { dirname } from "./dirname.ts";

Deno.test("dirname", function () {
  assertEquals(dirname("/a/b/", { os: "linux" }), "/a");
  assertEquals(dirname("/a/b", { os: "linux" }), "/a");
  assertEquals(dirname("/a", { os: "linux" }), "/");
  assertEquals(dirname("", { os: "linux" }), ".");
  assertEquals(dirname("/", { os: "linux" }), "/");
  assertEquals(dirname("////", { os: "linux" }), "/");
  assertEquals(dirname("//a", { os: "linux" }), "//");
  assertEquals(dirname("foo", { os: "linux" }), ".");
});

Deno.test("dirnameWin32", function () {
  assertEquals(dirname("c:\\", { os: "windows" }), "c:\\");
  assertEquals(dirname("c:\\foo", { os: "windows" }), "c:\\");
  assertEquals(dirname("c:\\foo\\", { os: "windows" }), "c:\\");
  assertEquals(dirname("c:\\foo\\bar", { os: "windows" }), "c:\\foo");
  assertEquals(dirname("c:\\foo\\bar\\", { os: "windows" }), "c:\\foo");
  assertEquals(dirname("c:\\foo\\bar\\baz", { os: "windows" }), "c:\\foo\\bar");
  assertEquals(dirname("\\", { os: "windows" }), "\\");
  assertEquals(dirname("\\foo", { os: "windows" }), "\\");
  assertEquals(dirname("\\foo\\", { os: "windows" }), "\\");
  assertEquals(dirname("\\foo\\bar", { os: "windows" }), "\\foo");
  assertEquals(dirname("\\foo\\bar\\", { os: "windows" }), "\\foo");
  assertEquals(dirname("\\foo\\bar\\baz", { os: "windows" }), "\\foo\\bar");
  assertEquals(dirname("c:", { os: "windows" }), "c:");
  assertEquals(dirname("c:foo", { os: "windows" }), "c:");
  assertEquals(dirname("c:foo\\", { os: "windows" }), "c:");
  assertEquals(dirname("c:foo\\bar", { os: "windows" }), "c:foo");
  assertEquals(dirname("c:foo\\bar\\", { os: "windows" }), "c:foo");
  assertEquals(dirname("c:foo\\bar\\baz", { os: "windows" }), "c:foo\\bar");
  assertEquals(dirname("file:stream", { os: "windows" }), ".");
  assertEquals(dirname("dir\\file:stream", { os: "windows" }), "dir");
  assertEquals(dirname("\\\\unc\\share", { os: "windows" }), "\\\\unc\\share");
  assertEquals(
    dirname("\\\\unc\\share\\foo", { os: "windows" }),
    "\\\\unc\\share\\",
  );
  assertEquals(
    dirname("\\\\unc\\share\\foo\\", { os: "windows" }),
    "\\\\unc\\share\\",
  );
  assertEquals(
    dirname("\\\\unc\\share\\foo\\bar", { os: "windows" }),
    "\\\\unc\\share\\foo",
  );
  assertEquals(
    dirname("\\\\unc\\share\\foo\\bar\\", { os: "windows" }),
    "\\\\unc\\share\\foo",
  );
  assertEquals(
    dirname("\\\\unc\\share\\foo\\bar\\baz", { os: "windows" }),
    "\\\\unc\\share\\foo\\bar",
  );
  assertEquals(dirname("/a/b/", { os: "windows" }), "/a");
  assertEquals(dirname("/a/b", { os: "windows" }), "/a");
  assertEquals(dirname("/a", { os: "windows" }), "/");
  assertEquals(dirname("", { os: "windows" }), ".");
  assertEquals(dirname("/", { os: "windows" }), "/");
  assertEquals(dirname("////", { os: "windows" }), "/");
  assertEquals(dirname("foo", { os: "windows" }), ".");
});
