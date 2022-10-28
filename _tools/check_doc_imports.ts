// Copyright 2022-2022 the Deno authors. All rights reserved. MIT license.

import * as colors from "../fmt/colors.ts";

const EXTENSIONS = [".mjs", ".js", ".ts", ".md"];
const EXCLUDED_PATHS = [
  ".git",
  "node",
];

const ROOT = new URL("../", import.meta.url).pathname.slice(0, -1);
const FAIL_FAST = Deno.args.includes("--fail-fast");

const JSDOC_COMMENT_REGEX = /\*\*[^*]*\*+(?:[^/*][^*]*\*+)*/mg;
const IMPORT_STATEMENT_REGEX =
  /import([ \n\t]*(?:[^ \n\t\{\}]+[ \n\t]*,?)?(?:[ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])/mg;

let shouldFail = false;
let countChecked = 0;

function checkImportStatements(
  str: string,
  filePath: string,
  lineNumber = 1,
): void {
  for (
    const importStatementMatch of str.matchAll(IMPORT_STATEMENT_REGEX)
  ) {
    const importPath = importStatementMatch[3];
    const isRelative = importPath.startsWith(".");
    const isInternal = importPath.startsWith(
      "https://deno.land/std@$STD_VERSION/",
    );

    if (isRelative || !isInternal) {
      const lineNumberWithinStr =
        str.slice(0, importStatementMatch.index).split("\n").length +
        importStatementMatch[0].split("\n").length - 2;

      console.log(
        colors.yellow("Warn ") +
          (isRelative
            ? "relative import path"
            : "external or incorrectly versioned dependency") +
          ": " +
          colors.red(`"${importPath}"`) + " at " +
          colors.blue(
            `${filePath.replace(ROOT + "/", "")}:${
              lineNumber + lineNumberWithinStr
            }`,
          ),
      );

      if (FAIL_FAST) {
        Deno.exit(1);
      }
      shouldFail = true;
    }
  }
}

function walk(dir: string) {
  for (const x of Deno.readDirSync(dir)) {
    const filePath = `${dir}/${x.name}`;

    if (x.isDirectory) {
      walk(filePath);
      continue;
    }

    const isExcluded = EXCLUDED_PATHS
      .map((x) => filePath.includes(x))
      .some((x) => x);
    if (
      isExcluded ||
      !EXTENSIONS.map((x) => filePath.endsWith(x)).some((x) => x)
    ) {
      continue;
    }

    const content = Deno.readTextFileSync(filePath);
    countChecked++;

    if (filePath.endsWith(".md")) {
      checkImportStatements(content, filePath);
    } else {
      for (const jsdocMatch of content.matchAll(JSDOC_COMMENT_REGEX)) {
        const lineNumber =
          content.slice(0, jsdocMatch.index).split("\n").length;

        checkImportStatements(jsdocMatch[0], filePath, lineNumber);
      }
    }
  }
}

walk(ROOT);
console.log(`Checked ${countChecked} files`);
if (shouldFail) Deno.exit(1);
