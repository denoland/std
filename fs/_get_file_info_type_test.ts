// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.

import { assertEquals } from "../assert/mod.ts";
import * as path from "../path/mod.ts";
import { getFileInfoType, PathType } from "./_get_file_info_type.ts";
import { ensureFileSync } from "./ensure_file.ts";
import { ensureDirSync } from "./ensure_dir.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("getFileInfoType() returns entity type as a string", function () {
  const pairs = [
    [path.join(testdataDir, "file_type_1"), "file"],
    [path.join(testdataDir, "file_type_dir_1"), "dir"],
  ];

  pairs.forEach(function (p) {
    const filePath = p[0] as string;
    const type = p[1] as PathType;
    switch (type) {
      case "file":
        ensureFileSync(filePath);
        break;
      case "dir":
        ensureDirSync(filePath);
        break;
      case "symlink":
        // TODO(axetroy): test symlink
        break;
    }

    const stat = Deno.statSync(filePath);

    Deno.removeSync(filePath, { recursive: true });

    assertEquals(getFileInfoType(stat), type);
  });
});
