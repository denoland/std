// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { walk } from "../fs/walk.ts";
import { relative } from "../path/relative.ts";
import { dirname } from "../path/dirname.ts";
import * as colors from "../fmt/colors.ts";
import ts from "npm:typescript";

const ROOT = new URL("../", import.meta.url);
const FAIL_FAST = Deno.args.includes("--fail-fast");

let shouldFail = false;

for await (
  const { path: modFilePath } of walk(ROOT, {
    includeDirs: true,
    exts: ["ts"],
    match: [/mod\.ts$/],
    maxDepth: 2,
  })
) {
  const source = await Deno.readTextFile(modFilePath);
  const sourceFile = ts.createSourceFile(
    modFilePath,
    source,
    ts.ScriptTarget.Latest,
  );
  const exportSpecifiers = new Set();
  sourceFile.forEachChild((node) => {
    if (!ts.isExportDeclaration(node)) return;
    if (!node.moduleSpecifier) return;
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;
    exportSpecifiers.add(node.moduleSpecifier.text);
  });

  for await (
    const { path: filePath } of walk(dirname(modFilePath), {
      exts: [".ts"],
      includeDirs: false,
      maxDepth: 1,
      skip: [
        /dotenv(\/|\\)load\.ts$/,
        /front_matter(\/|\\)yaml\.ts$/,
        /front_matter(\/|\\)json\.ts$/,
        /front_matter(\/|\\)toml\.ts$/,
        /front_matter(\/|\\)any\.ts$/,
        /uuid(\/|\\)v1\.ts$/,
        /uuid(\/|\\)v3\.ts$/,
        /uuid(\/|\\)v4\.ts$/,
        /uuid(\/|\\)v5\.ts$/,
        /yaml(\/|\\)schema\.ts$/,
        /test\.ts$/,
        /\.d\.ts$/,
        /(\/|\\)_/,
        /mod\.ts$/,
      ],
    })
  ) {
    const relativeSpecifier = relative(modFilePath, filePath).slice(1)
      .replaceAll("\\", "/");
    if (!exportSpecifiers.has(relativeSpecifier)) {
      console.warn(
        `${
          colors.yellow("Warn")
        } ${modFilePath} does not export '${relativeSpecifier}'.`,
      );
      shouldFail = true;
      if (FAIL_FAST) Deno.exit(1);
    }
  }
}

if (shouldFail) Deno.exit(1);
