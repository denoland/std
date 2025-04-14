// deno-lint-ignore-file no-console
// Copyright 2018-2025 the Deno authors. MIT license.

import { walk } from "../fs/walk.ts";
import { relative } from "@std/path/relative";
import { dirname } from "@std/path/unstable-dirname";
import ts from "npm:typescript";
import { getEntrypoints, isTestFile } from "./utils.ts";

const FAIL_FAST = Deno.args.includes("--fail-fast");

let shouldFail = false;

for (const path of await getEntrypoints()) {
  if (!path.endsWith("/mod.ts")) continue;

  const modSource = await Deno.readTextFile(new URL(path));
  const modSourceFile = ts.createSourceFile(
    path,
    modSource,
    ts.ScriptTarget.Latest,
  );
  const modExportSpecifiers = new Set();
  modSourceFile.forEachChild((node) => {
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      modExportSpecifiers.add(node.moduleSpecifier.text);
    }
  });

  for await (
    const { path: filePath } of walk(dirname(new URL(path)), {
      exts: [".ts"],
      includeDirs: false,
      maxDepth: 1,
      skip: [
        /unstable/,
        /dotenv(\/|\\)load\.ts$/,
        /front_matter(\/|\\)yaml\.ts$/,
        /front_matter(\/|\\)json\.ts$/,
        /front_matter(\/|\\)toml\.ts$/,
        /front_matter(\/|\\)any\.ts$/,
        /uuid(\/|\\)v1\.ts$/,
        /uuid(\/|\\)v3\.ts$/,
        /uuid(\/|\\)v4\.ts$/,
        /uuid(\/|\\)v5\.ts$/,
        /uuid(\/|\\)v6\.ts$/,
        /uuid(\/|\\)v7\.ts$/,
        /_test\.ts$/,
        /_bench\.ts$/,
        /\.d\.ts$/,
        /(\/|\\)_/,
        /mod\.ts$/,
      ],
    })
  ) {
    const relativeSpecifier = relative(path.replace("file://", ""), filePath)
      .slice(1)
      .replaceAll("\\", "/");

    if (!modExportSpecifiers.has(relativeSpecifier)) {
      if (isTestFile(filePath)) continue;

      console.warn(
        `%cWarn%c ${path} does not export '${relativeSpecifier}'.`,
        "color: yellow;",
        "",
      );
      shouldFail = true;
      if (FAIL_FAST) Deno.exit(1);
    }
  }
}

if (shouldFail) Deno.exit(1);
