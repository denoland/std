// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * TODO(kt3k): This stopped working after JSR migration. Enable this check.
 *
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
import { join } from "../path/join.ts";

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

const workspaces = JSON.parse(await Deno.readTextFile("deno.json"))
  .workspaces as string[];
// deno-lint-ignore no-explicit-any
const denoConfig = {} as Record<string, any>;
for (const workspace of workspaces) {
  const config = JSON.parse(
    await Deno.readTextFile(join(workspace, "deno.json")),
  );
  denoConfig[config.name.replace("@std/", "")] = config;
}

for await (const entry of iter) {
  const url = toFileUrl(entry.path);
  const docs = await doc(url.href, {
    resolve(specifier, referrer) {
      if (specifier.startsWith("../") || specifier.startsWith("./")) {
        return new URL(specifier, referrer).href;
      } else if (specifier.startsWith("@std/")) {
        let [_std, pkg, exp] = specifier.split("/");
        if (exp === undefined) {
          exp = ".";
        } else {
          exp = "./" + exp;
        }
        const pkgPath = "../" + pkg!.replaceAll("-", "_") + "/";
        const config = denoConfig[pkg!];
        if (typeof config.exports === "string") {
          return new URL(pkgPath + config.exports, import.meta.url).href;
        }
        return new URL(pkgPath + config.exports[exp], import.meta.url).href;
      } else {
        return new URL(specifier).href;
      }
    },
  });
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
