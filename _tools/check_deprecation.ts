// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * Checks whether all deprecated tags have a message.
 *
 * @example
 * ```sh
 * deno task lint:deprecations
 * ```
 */

import { doc } from "@deno/doc";
import { walk } from "../fs/walk.ts";
import { toFileUrl } from "../path/to_file_url.ts";
import { resolveWorkspaceSpecifiers } from "./utils.ts";

const ROOT = new URL("../", import.meta.url);

let failed = false;

const iter = walk(ROOT, {
  includeDirs: false,
  exts: [".ts"],
  skip: [
    /.git/,
    /(\/|\\)_/,
    /_test.ts$/,
  ],
});

for await (const entry of iter) {
  const url = toFileUrl(entry.path);
  const docs = await doc(url.href, { resolve: resolveWorkspaceSpecifiers });
  for (const document of docs) {
    const tags = document.jsDoc?.tags;
    if (!tags) continue;
    for (const tag of tags) {
      if (tag.kind !== "deprecated") continue;
      if (tag.doc === undefined) {
        console.log(
          `%c@deprecated tag with JSDoc block must have a message: ${document.location.filename}:${document.location.line}`,
          "color: yellow",
        );
        failed = true;
      }
    }
  }
}

if (failed) Deno.exit(1);
