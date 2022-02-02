// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import type { FormatInputPathObject, ParsedPath } from "./_interface.ts";

import { assertEquals } from "../testing/asserts.ts";
import { parse } from "./parse.ts";
import { format } from "./format.ts";
import { dirname } from "./dirname.ts";

import { basename } from "./basename.ts";
import { extname } from "./extname.ts";

type FormatTestCase = [FormatInputPathObject, string];
type ParseTestCase = [string, ParsedPath];

const winPaths: Array<[string, string]> = [
  // [path, root]
  ["C:\\path\\dir\\index.html", "C:\\"],
  ["C:\\another_path\\DIR\\1\\2\\33\\\\index", "C:\\"],
  ["another_path\\DIR with spaces\\1\\2\\33\\index", ""],
  ["\\", "\\"],
  ["\\foo\\C:", "\\"],
  ["file", ""],
  ["file:stream", ""],
  [".\\file", ""],
  ["C:", "C:"],
  ["C:.", "C:"],
  ["C:..", "C:"],
  ["C:abc", "C:"],
  ["C:\\", "C:\\"],
  ["C:\\abc", "C:\\"],
  ["", ""],
  // unc
  ["\\\\server\\share\\file_path", "\\\\server\\share\\"],
  [
    "\\\\server two\\shared folder\\file path.zip",
    "\\\\server two\\shared folder\\",
  ],
  ["\\\\teela\\admin$\\system32", "\\\\teela\\admin$\\"],
  ["\\\\?\\UNC\\server\\share", "\\\\?\\UNC\\"],
];

const winSpecialCaseParseTests: ParseTestCase[] = [
  ["/foo/bar", { root: "/", dir: "/foo", base: "bar", ext: "", name: "bar" }],
];

const winSpecialCaseFormatTests: FormatTestCase[] = [
  [{ dir: "some\\dir" }, "some\\dir\\"],
  [{ base: "index.html" }, "index.html"],
  [{ root: "C:\\" }, "C:\\"],
  [{ name: "index", ext: ".html" }, "index.html"],
  [{ dir: "some\\dir", name: "index", ext: ".html" }, "some\\dir\\index.html"],
  [{ root: "C:\\", name: "index", ext: ".html" }, "C:\\index.html"],
  [{}, ""],
];

const unixPaths: Array<[string, string]> = [
  // [path, root]
  ["/home/user/dir/file.txt", "/"],
  ["/home/user/a dir/another File.zip", "/"],
  ["/home/user/a dir//another&File.", "/"],
  ["/home/user/a$$$dir//another File.zip", "/"],
  ["user/dir/another File.zip", ""],
  ["file", ""],
  [".\\file", ""],
  ["./file", ""],
  ["C:\\foo", ""],
  ["/", "/"],
  ["", ""],
  [".", ""],
  ["..", ""],
  ["/foo", "/"],
  ["/foo.", "/"],
  ["/foo.bar", "/"],
  ["/.", "/"],
  ["/.foo", "/"],
  ["/.foo.bar", "/"],
  ["/foo/bar.baz", "/"],
];

const unixSpecialCaseFormatTests: FormatTestCase[] = [
  [{ dir: "some/dir" }, "some/dir/"],
  [{ base: "index.html" }, "index.html"],
  [{ root: "/" }, "/"],
  [{ name: "index", ext: ".html" }, "index.html"],
  [{ dir: "some/dir", name: "index", ext: ".html" }, "some/dir/index.html"],
  [{ root: "/", name: "index", ext: ".html" }, "/index.html"],
  [{}, ""],
];

function checkParseFormat(
  testCases: Array<[string, string]>,
  os: typeof Deno.build.os,
): void {
  testCases.forEach(([element, root]) => {
    const output = parse(element, { os });
    assertEquals(typeof output.root, "string");
    assertEquals(typeof output.dir, "string");
    assertEquals(typeof output.base, "string");
    assertEquals(typeof output.ext, "string");
    assertEquals(typeof output.name, "string");
    assertEquals(format(output, { os }), element);
    assertEquals(output.root, root);
    assertEquals(output.dir, output.dir ? dirname(element, { os }) : "");
    assertEquals(output.base, basename(element, "", { os }));
    assertEquals(output.ext, extname(element, { os }));
  });
}

function checkSpecialCaseParseFormat(
  testCases: ParseTestCase[],
  os: typeof Deno.build.os,
): void {
  testCases.forEach(([element, expect]) => {
    assertEquals(parse(element, { os }), expect);
  });
}

function checkFormat(
  testCases: FormatTestCase[],
  os: typeof Deno.build.os,
): void {
  testCases.forEach((testCase) => {
    assertEquals(format(testCase[0], { os }), testCase[1]);
  });
}

Deno.test("parseWin32", function () {
  checkParseFormat(winPaths, "windows");
  checkSpecialCaseParseFormat(winSpecialCaseParseTests, "windows");
});

Deno.test("parse", function () {
  checkParseFormat(unixPaths, "linux");
});

Deno.test("formatWin32", function () {
  checkFormat(winSpecialCaseFormatTests, "windows");
});

Deno.test("format", function () {
  checkFormat(unixSpecialCaseFormatTests, "linux");
});

// Test removal of trailing path separators
const windowsTrailingTests: ParseTestCase[] = [
  [".\\", { root: "", dir: "", base: ".", ext: "", name: "." }],
  ["\\\\", { root: "\\", dir: "\\", base: "", ext: "", name: "" }],
  ["\\\\", { root: "\\", dir: "\\", base: "", ext: "", name: "" }],
  [
    "c:\\foo\\\\\\",
    { root: "c:\\", dir: "c:\\", base: "foo", ext: "", name: "foo" },
  ],
  [
    "D:\\foo\\\\\\bar.baz",
    {
      root: "D:\\",
      dir: "D:\\foo\\\\",
      base: "bar.baz",
      ext: ".baz",
      name: "bar",
    },
  ],
];

const posixTrailingTests: ParseTestCase[] = [
  ["./", { root: "", dir: "", base: ".", ext: "", name: "." }],
  ["//", { root: "/", dir: "/", base: "", ext: "", name: "" }],
  ["///", { root: "/", dir: "/", base: "", ext: "", name: "" }],
  ["/foo///", { root: "/", dir: "/", base: "foo", ext: "", name: "foo" }],
  [
    "/foo///bar.baz",
    { root: "/", dir: "/foo//", base: "bar.baz", ext: ".baz", name: "bar" },
  ],
];

Deno.test("parseTrailingWin32", function () {
  windowsTrailingTests.forEach(function (p) {
    const actual = parse(p[0], { os: "windows" });
    const expected = p[1];
    assertEquals(actual, expected);
  });
});

Deno.test("parseTrailing", function () {
  posixTrailingTests.forEach(function (p) {
    const actual = parse(p[0], { os: "linux" });
    const expected = p[1];
    assertEquals(actual, expected);
  });
});
