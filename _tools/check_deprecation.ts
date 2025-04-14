// deno-lint-ignore-file no-console
// Copyright 2018-2025 the Deno authors. MIT license.
/**
 * Checks whether all deprecated tags have a message.
 *
 * @example
 * ```sh
 * deno task lint:deprecations
 * ```
 */

import { doc } from "@deno/doc";
import { getEntrypoints, resolve } from "./utils.ts";

let failed = false;

const entrypoints = await getEntrypoints();
const docs = await doc(entrypoints, { resolve });
for (const document of Object.values(docs).flat()) {
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

if (failed) Deno.exit(1);
