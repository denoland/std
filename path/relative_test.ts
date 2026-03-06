// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "@std/assert";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { relative } from "./relative.ts";

const relativeTests = {
  // arguments                     result
  windows: [
    ["c:/blah\\blah", "d:/games", "d:\\games"],
    ["c:/aaaa/bbbb", "c:/aaaa", ".."],
    ["c:/aaaa/bbbb", "c:/cccc", "..\\..\\cccc"],
    ["c:/aaaa/bbbb", "c:/aaaa/bbbb", ""],
    ["c:/aaaa/bbbb", "c:/aaaa/cccc", "..\\cccc"],
    ["c:/aaaa/", "c:/aaaa/cccc", "cccc"],
    ["c:/", "c:\\aaaa\\bbbb", "aaaa\\bbbb"],
    ["c:/aaaa/bbbb", "d:\\", "d:\\"],
    ["c:/AaAa/bbbb", "c:/aaaa/bbbb", ""],
    ["c:/aaaaa/", "c:/aaaa/cccc", "..\\aaaa\\cccc"],
    ["C:\\foo\\bar\\baz\\quux", "C:\\", "..\\..\\..\\.."],
    ["C:\\foo\\test", "C:\\foo\\test\\bar\\package.json", "bar\\package.json"],
    ["C:\\foo\\bar\\baz-quux", "C:\\foo\\bar\\baz", "..\\baz"],
    ["C:\\foo\\bar\\baz", "C:\\foo\\bar\\baz-quux", "..\\baz-quux"],
    ["\\\\foo\\bar", "\\\\foo\\bar\\baz", "baz"],
    ["\\\\foo\\bar\\baz", "\\\\foo\\bar", ".."],
    ["\\\\foo\\bar\\baz-quux", "\\\\foo\\bar\\baz", "..\\baz"],
    ["\\\\foo\\bar\\baz", "\\\\foo\\bar\\baz-quux", "..\\baz-quux"],
    ["C:\\baz-quux", "C:\\baz", "..\\baz"],
    ["C:\\baz", "C:\\baz-quux", "..\\baz-quux"],
    ["\\\\foo\\baz-quux", "\\\\foo\\baz", "..\\baz"],
    ["\\\\foo\\baz", "\\\\foo\\baz-quux", "..\\baz-quux"],
    ["C:\\baz", "\\\\foo\\bar\\baz", "\\\\foo\\bar\\baz"],
    ["\\\\foo\\bar\\baz", "C:\\baz", "C:\\baz"],
  ] as const,
  // arguments          result
  posix: [
    ["/var/lib", "/var", ".."],
    ["/var/lib", "/bin", "../../bin"],
    ["/var/lib", "/var/lib", ""],
    ["/var/lib", "/var/apache", "../apache"],
    ["/var/", "/var/lib", "lib"],
    ["/", "/var/lib", "var/lib"],
    ["/foo/test", "/foo/test/bar/package.json", "bar/package.json"],
    ["/Users/a/web/b/test/mails", "/Users/a/web/b", "../.."],
    ["/foo/bar/baz-quux", "/foo/bar/baz", "../baz"],
    ["/foo/bar/baz", "/foo/bar/baz-quux", "../baz-quux"],
    ["/baz-quux", "/baz", "../baz"],
    ["/baz", "/baz-quux", "../baz-quux"],
  ] as const,
};

Deno.test("posix.relative()", function () {
  relativeTests.posix.forEach(function (p) {
    const expected = p[2];
    const actual = posix.relative(p[0], p[1]);
    assertEquals(actual, expected);
  });
});

Deno.test("windows.relative()", function () {
  relativeTests.windows.forEach(function (p) {
    const expected = p[2];
    const actual = windows.relative(p[0], p[1]);
    assertEquals(actual, expected);
  });
});

Deno.test("relative() returns current working directory if input is empty", function () {
  const pwd = Deno.cwd();
  assertEquals(relative("", pwd), "");
  assertEquals(relative(pwd, ""), "");
  assertEquals(relative(pwd, pwd), "");
});
