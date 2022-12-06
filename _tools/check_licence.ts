// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { walk } from "../fs/walk.ts";
import { isWindows } from "../_util/os.ts";

const EXTENSIONS = [".mjs", ".js", ".ts", ".rs"];
const EXCLUDED_DIRS = [
  "node/_module",
  "node/_tools/test",
  "node/_tools/versions",
  "dotenv/testdata",
  "fs/testdata",
  "http/testdata",
  "node/testdata",
  "crypto/_wasm/target",
  "encoding/varint/_wasm/target",
  "_tools/testdata",
];

const ROOT = new URL("../", import.meta.url);
const FIRST_YEAR = 2018;
const CURRENT_YEAR = new Date().getFullYear();
const COPYRIGHT =
  `// Copyright ${FIRST_YEAR}-${CURRENT_YEAR} the Deno authors. All rights reserved. MIT license.`;

for await (
  const { path } of walk(ROOT, {
    exts: EXTENSIONS,
    skip: EXCLUDED_DIRS.map((path) => new RegExp(path + "$")),
    includeDirs: false,
  })
) {
  const content = await Deno.readTextFile(path);
  if (!content.includes(COPYRIGHT)) {
    const newline = isWindows ? "\r\n" : "\n";
    const contentWithCopyright = COPYRIGHT + newline + content;
    await Deno.writeTextFile(path, contentWithCopyright);
    console.log("Copyright headers automatically added to " + path);
  }
}
