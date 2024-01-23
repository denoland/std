// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { exists } from "../fs/exists.ts";
import { join } from "../path/join.ts";
import * as colors from "../fmt/colors.ts";
import ts from "npm:typescript";

const ROOT = new URL("../", import.meta.url);
const FAIL_FAST = Deno.args.includes("--fail-fast");
const EXCLUDED_PATHS = [
  "dotenv/load.ts",
  "path/glob.ts",
];

const MOD_FILENAME = "mod.ts";

let shouldFail = false;

for await (const { name: dirName, isDirectory } of Deno.readDir(ROOT)) {
  if (!isDirectory || dirName.startsWith(".") || dirName.startsWith("_")) {
    continue;
  }
  const filePath = join(ROOT.pathname, dirName);
  const modFilePath = join(filePath, MOD_FILENAME);
  if (!await exists(modFilePath)) continue;

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

  for await (const { name } of Deno.readDir(filePath)) {
    if (
      name === MOD_FILENAME ||
      !name.endsWith(".ts") ||
      name.startsWith(".") ||
      name.startsWith("_") ||
      name.endsWith("test.ts")
    ) continue;
    const absoluteFilePath = join(dirName, name);
    if (EXCLUDED_PATHS.includes(absoluteFilePath)) continue;

    const relativeSpecifier = `./${name}`;
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
