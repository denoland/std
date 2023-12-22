// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.

import { assertEquals } from "../assert/mod.ts";
import * as path from "../path/mod.ts";
import { isSamePath } from "./_is_same_path.ts";

Deno.test({
  name: "isSamePath() works correctly for win32",
  ignore: Deno.build.os !== "windows",
  fn() {
    const pairs: (string | URL | boolean)[][] = [
      ["", "", true],
      ["C:\\test", "C:\\test", true],
      ["C:\\test", "C:\\test\\test", false],
      ["C:\\test", path.toFileUrl("C:\\test"), true],
      ["C:\\test", path.toFileUrl("C:\\test\\test"), false],
    ];

    for (const p of pairs) {
      const src = p[0] as string | URL;
      const dest = p[1] as string | URL;
      const expected = p[2] as boolean;

      assertEquals(
        isSamePath(src, dest),
        expected,
        `'${src}' should ${expected ? "" : "not"} be the same as '${dest}'`,
      );
    }
  },
});

Deno.test({
  name: "isSamePath() works correctly for posix",
  ignore: Deno.build.os === "windows",
  fn() {
    const pairs: (string | URL | boolean)[][] = [
      ["", "", true],
      ["/test", "/test/", true],
      ["/test", "/test/test", false],
      ["/test", "/test/test/..", true],
      ["/test", path.toFileUrl("/test"), true],
      ["/test", path.toFileUrl("/test/test"), false],
    ];

    for (const p of pairs) {
      const src = p[0] as string | URL;
      const dest = p[1] as string | URL;
      const expected = p[2] as boolean;

      assertEquals(
        isSamePath(src, dest),
        expected,
        `'${src}' should ${expected ? "" : "not"} be the same as '${dest}'`,
      );
    }
  },
});
