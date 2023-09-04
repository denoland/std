// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import { posix, resolve, win32 } from "./mod.ts";

const windowsTests =
  // arguments                               result
  [
    [["c:/blah\\blah", "d:/games", "c:../a"], "c:\\blah\\a"],
    [["c:/ignore", "d:\\a/b\\c/d", "\\e.exe"], "d:\\e.exe"],
    [["c:/ignore", "c:/some/file"], "c:\\some\\file"],
    [["d:/ignore", "d:some/dir//"], "d:\\ignore\\some\\dir"],
    [["//server/share", "..", "relative\\"], "\\\\server\\share\\relative"],
    [["c:/", "//"], "c:\\"],
    [["c:/", "//dir"], "c:\\dir"],
    [["c:/", "//server/share"], "\\\\server\\share\\"],
    [["c:/", "//server//share"], "\\\\server\\share\\"],
    [["c:/", "///some//dir"], "c:\\some\\dir"],
    [
      ["C:\\foo\\tmp.3\\", "..\\tmp.3\\cycles\\root.js"],
      "C:\\foo\\tmp.3\\cycles\\root.js",
    ],
  ];
const posixTests =
  // arguments                    result
  [
    [["/var/lib", "../", "file/"], "/var/file"],
    [["/var/lib", "/../", "file/"], "/file"],
    [["a/b/c/", "../../.."], Deno.cwd()],
    [["."], Deno.cwd()],
    [["/some/dir", ".", "/absolute/"], "/absolute"],
    [["/foo/tmp.3/", "../tmp.3/cycles/root.js"], "/foo/tmp.3/cycles/root.js"],
  ];

Deno.test("[path] resolve - posix", () => {
  posixTests.forEach((p) => {
    const _p = p[0] as string[];
    assertEquals(posix.resolve(..._p), p[1]);
    assertEquals(resolve(..._p, { os: "linux" }), p[1]);
  });
});

Deno.test("[path] resolve - windows", () => {
  windowsTests.forEach((p) => {
    const _p = p[0] as string[];
    assertEquals(win32.resolve(..._p), p[1]);
    assertEquals(resolve(..._p, { os: "windows" }), p[1]);
  });
});
