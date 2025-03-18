// Copyright 2018-2025 the Deno authors. MIT license.

import ts from "npm:typescript";

const workspaces = JSON.parse(await Deno.readTextFile("deno.json"))
  .workspace as string[];
// deno-lint-ignore no-explicit-any
const denoConfig = {} as Record<string, any>;
for (const workspace of workspaces) {
  const { default: config } = await import("../" + workspace + "/deno.json", {
    with: { type: "json" },
  });
  denoConfig[config.name.replace("@std/", "")] = config;
}

export function resolveWorkspaceSpecifiers(
  specifier: string,
  referrer: string,
) {
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
}

/**
 * Checks wheter a file is named `test.ts` and has no exports.
 * @param filePath
 * @returns true if file is named `test.ts` and has no exports, false otherwise
 */
export function isTestFile(filePath: string): boolean {
  if (!filePath.endsWith("test.ts")) return false;
  const source = Deno.readTextFileSync(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
  );

  let result = true;

  function visitNode(node: ts.Node) {
    if (!result) return;
    if (
      ts.isExportSpecifier(node) ||
      ts.isExportAssignment(node) ||
      ts.isExportDeclaration(node) ||
      node.kind === ts.SyntaxKind.ExportKeyword
    ) {
      result = false;
    } else {
      ts.forEachChild(node, visitNode);
    }
  }

  visitNode(sourceFile);
  return result;
}
