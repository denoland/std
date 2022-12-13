// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { walk } from "../fs/walk.ts";

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

let failed = false;

for await (
  const { path } of walk(ROOT, {
    exts: EXTENSIONS,
    skip: EXCLUDED_DIRS.map((path) => new RegExp(path + "$")),
    includeDirs: false,
  })
) {
  const content = await Deno.readTextFile(path);

  if (!content.includes(COPYRIGHT)) {
    if (Deno.args.includes("--check")) {
      console.error(`Missing/incorrect copyright header: ${path}`);
      failed = true;
    } else {
      const contentWithCopyright = COPYRIGHT + "\n" + content;
      await Deno.writeTextFile(path, contentWithCopyright);
      console.log("Copyright headers automatically added to " + path);
    }
  }
}

if (failed) {
  console.info(`Copyright header should be "${COPYRIGHT}"`);
  Deno.exit(1);
}
