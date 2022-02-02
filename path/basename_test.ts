// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../testing/asserts.ts";
import { basename } from "./basename.ts";

Deno.test("basename", function () {
  assertEquals(basename(".js", ".js"), "");
  assertEquals(basename(""), "");
  assertEquals(basename("/dir/basename.ext"), "basename.ext");
  assertEquals(basename("/basename.ext"), "basename.ext");
  assertEquals(basename("basename.ext"), "basename.ext");
  assertEquals(basename("basename.ext/"), "basename.ext");
  assertEquals(basename("basename.ext//"), "basename.ext");
  assertEquals(basename("aaa/bbb", "/bbb"), "bbb");
  assertEquals(basename("aaa/bbb", "a/bbb"), "bbb");
  assertEquals(basename("aaa/bbb", "bbb"), "bbb");
  assertEquals(basename("aaa/bbb//", "bbb"), "bbb");
  assertEquals(basename("aaa/bbb", "bb"), "b");
  assertEquals(basename("aaa/bbb", "b"), "bb");
  assertEquals(basename("/aaa/bbb", "/bbb"), "bbb");
  assertEquals(basename("/aaa/bbb", "a/bbb"), "bbb");
  assertEquals(basename("/aaa/bbb", "bbb"), "bbb");
  assertEquals(basename("/aaa/bbb//", "bbb"), "bbb");
  assertEquals(basename("/aaa/bbb", "bb"), "b");
  assertEquals(basename("/aaa/bbb", "b"), "bb");
  assertEquals(basename("/aaa/bbb"), "bbb");
  assertEquals(basename("/aaa/"), "aaa");
  assertEquals(basename("/aaa/b"), "b");
  assertEquals(basename("/a/b"), "b");
  assertEquals(basename("//a"), "a");

  // On unix a backslash is just treated as any other character.
  assertEquals(
    basename("\\dir\\basename.ext", "", { os: "linux" }),
    "\\dir\\basename.ext",
  );
  assertEquals(
    basename("\\basename.ext", "", { os: "linux" }),
    "\\basename.ext",
  );
  assertEquals(basename("basename.ext", "", { os: "linux" }), "basename.ext");
  assertEquals(
    basename("basename.ext\\", "", { os: "linux" }),
    "basename.ext\\",
  );
  assertEquals(
    basename("basename.ext\\\\", "", { os: "linux" }),
    "basename.ext\\\\",
  );
  assertEquals(basename("foo", "", { os: "linux" }), "foo");

  // POSIX filenames may include control characters
  const controlCharFilename = "Icon" + String.fromCharCode(13);
  assertEquals(
    basename("/a/b/" + controlCharFilename, "", { os: "linux" }),
    controlCharFilename,
  );
});

Deno.test("basenameWin32", function () {
  assertEquals(
    basename("\\dir\\basename.ext", "", { os: "windows" }),
    "basename.ext",
  );
  assertEquals(
    basename("\\basename.ext", "", { os: "windows" }),
    "basename.ext",
  );
  assertEquals(basename("basename.ext", "", { os: "windows" }), "basename.ext");
  assertEquals(
    basename("basename.ext\\", "", { os: "windows" }),
    "basename.ext",
  );
  assertEquals(
    basename("basename.ext\\\\", "", { os: "windows" }),
    "basename.ext",
  );
  assertEquals(basename("foo", "", { os: "windows" }), "foo");
  assertEquals(basename("aaa\\bbb", "\\bbb", { os: "windows" }), "bbb");
  assertEquals(basename("aaa\\bbb", "a\\bbb", { os: "windows" }), "bbb");
  assertEquals(basename("aaa\\bbb", "bbb", { os: "windows" }), "bbb");
  assertEquals(basename("aaa\\bbb\\\\\\\\", "bbb", { os: "windows" }), "bbb");
  assertEquals(basename("aaa\\bbb", "bb", { os: "windows" }), "b");
  assertEquals(basename("aaa\\bbb", "b", { os: "windows" }), "bb");
  assertEquals(basename("C:", "", { os: "windows" }), "");
  assertEquals(basename("C:.", "", { os: "windows" }), ".");
  assertEquals(basename("C:\\", "", { os: "windows" }), "");
  assertEquals(
    basename("C:\\dir\\base.ext", "", { os: "windows" }),
    "base.ext",
  );
  assertEquals(
    basename("C:\\basename.ext", "", { os: "windows" }),
    "basename.ext",
  );
  assertEquals(
    basename("C:basename.ext", "", { os: "windows" }),
    "basename.ext",
  );
  assertEquals(
    basename("C:basename.ext\\", "", { os: "windows" }),
    "basename.ext",
  );
  assertEquals(
    basename("C:basename.ext\\\\", "", { os: "windows" }),
    "basename.ext",
  );
  assertEquals(basename("C:foo", "", { os: "windows" }), "foo");
  assertEquals(basename("file:stream", "", { os: "windows" }), "file:stream");
});
