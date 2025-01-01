// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import type { ParsedPath } from "./mod.ts";

import { assertEquals } from "@std/assert";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

type FormatTestCase = [Partial<ParsedPath>, string];
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

const unixPaths: Array<[string, string, string?]> = [
  // [path, root, formatted]
  ["/home/user/dir/file.txt", "/"],
  ["/home/user/a dir/another File.zip", "/"],
  ["/home/user/a dir//another&File.", "/", "/home/user/a dir/another&File."],
  [
    "/home/user/a$$$dir//another File.zip",
    "/",
    "/home/user/a$$$dir/another File.zip",
  ],
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
  path: typeof windows | typeof posix,
  testCases: Array<[string, string, string?]>,
) {
  testCases.forEach(([element, root, formatted]) => {
    const output = path.parse(element);
    assertEquals(typeof output.root, "string");
    assertEquals(typeof output.dir, "string");
    assertEquals(typeof output.base, "string");
    assertEquals(typeof output.ext, "string");
    assertEquals(typeof output.name, "string");
    assertEquals(output.root, root);
    assertEquals(output.dir, output.dir ? path.dirname(element) : "");
    assertEquals(output.base, path.basename(element));
    assertEquals(output.ext, path.extname(element));
    // We normalize incorrect paths during parsing, so some "incorrect"
    // input cannot be asserted for equality onto itself.
    if (formatted) {
      assertEquals(path.format(output), formatted);
    } else {
      assertEquals(path.format(output), element);
    }
  });
}

function checkSpecialCaseParseFormat(
  path: typeof windows | typeof posix,
  testCases: ParseTestCase[],
) {
  testCases.forEach(([element, expect]) => {
    assertEquals(path.parse(element), expect);
  });
}

function checkFormat(
  path: typeof windows | typeof posix,
  testCases: FormatTestCase[],
) {
  testCases.forEach((testCase) => {
    assertEquals(path.format(testCase[0]), testCase[1]);
  });
}

Deno.test("windows.parse()", function () {
  checkParseFormat(windows, winPaths);
  checkSpecialCaseParseFormat(windows, winSpecialCaseParseTests);
});

Deno.test("posix.parse()", function () {
  checkParseFormat(posix, unixPaths);
});

Deno.test("windows.format()", function () {
  checkFormat(windows, winSpecialCaseFormatTests);
});

Deno.test("posix.format()", function () {
  checkFormat(posix, unixSpecialCaseFormatTests);
});

// Test removal of trailing path separators
const windowsTrailingTests: ParseTestCase[] = [
  [".\\", { root: "", dir: "", base: ".", ext: "", name: "." }],
  ["\\\\", { root: "\\", dir: "\\", base: "\\", ext: "", name: "" }],
  ["\\\\", { root: "\\", dir: "\\", base: "\\", ext: "", name: "" }],
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
  ["//", { root: "/", dir: "/", base: "/", ext: "", name: "" }],
  ["///", { root: "/", dir: "/", base: "/", ext: "", name: "" }],
  ["/foo///", { root: "/", dir: "/", base: "foo", ext: "", name: "foo" }],
  [
    "/foo///bar.baz",
    { root: "/", dir: "/foo", base: "bar.baz", ext: ".baz", name: "bar" },
  ],
];

Deno.test("windows.parseTrailing()", function () {
  windowsTrailingTests.forEach(function (p) {
    const actual = windows.parse(p[0]);
    const expected = p[1];
    assertEquals(actual, expected);
  });
});

Deno.test("parseTrailing()", function () {
  posixTrailingTests.forEach(function (p) {
    const actual = posix.parse(p[0]);
    const expected = p[1];
    assertEquals(actual, expected);
  });
});
