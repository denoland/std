// deno-lint-ignore-file no-console
// Copyright 2018-2025 the Deno authors. MIT license.

import { walk } from "../fs/walk.ts";
import * as colors from "../fmt/colors.ts";
import ts from "npm:typescript";

const ROOT = new URL("../", import.meta.url);

let shouldFail = false;

const PASCAL_CASE_REGEXP = /^[_A-Z][a-z0-9]*(?:[A-Z][a-z0-9]+)*$/;
function isPascalCase(string: string): boolean {
  return PASCAL_CASE_REGEXP.test(string);
}

const CAMEL_CASE_REGEXP = /^[_a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$/;
function isCamelCase(string: string): boolean {
  return CAMEL_CASE_REGEXP.test(string);
}

const SNAKE_CASE_REGEXP = /^[A-Z]+(?:_[A-Z0-9]+)*$/;
function isSnakeCase(string: string): boolean {
  return SNAKE_CASE_REGEXP.test(string);
}

for await (
  const { path: filePath } of walk(ROOT, {
    includeDirs: false,
    exts: [".ts"],
  })
) {
  const source = await Deno.readTextFile(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  const checkPascalCase = (node: ts.Node, name: string, type: string) => {
    if (!isPascalCase(name)) {
      console.warn(
        `${type} name '${name}' is not camelCase ${getPosition(node)}`,
      );
      shouldFail = true;
    }
  };
  const checkCamelCase = (node: ts.Node, name: string, type: string) => {
    if (!isCamelCase(name)) {
      console.warn(
        `${type} name '${name}' is not camelCase ${getPosition(node)}`,
      );
      shouldFail = true;
    }
  };

  const getPosition = (node: ts.Node) => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
    );
    return `${colors.dim(`${filePath}:${line}`)}`;
  };

  const visitNode = (node: ts.Node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      const name = node.name?.text;
      if (!name) return;
      checkPascalCase(node, name, "type");
    }
    if (ts.isInterfaceDeclaration(node)) {
      const name = node.name?.text;
      if (!name) return;
      checkPascalCase(node, name, "interface");
    }
    if (ts.isEnumDeclaration(node)) {
      const name = node.name?.text;
      if (!name) return;
      checkPascalCase(node, name, "enum");
    }

    if (ts.isFunctionDeclaration(node)) {
      const name = node.name?.text;
      if (!name) return;
      checkCamelCase(node, name, "property");
    }
    if (ts.isClassDeclaration(node)) {
      const name = node.name?.text;
      if (!name) return;
      checkPascalCase(node, name, "class");
    }
    if (ts.isMethodDeclaration(node)) {
      const nameNode = node.name;
      if (!nameNode) return;
      if (!ts.isIdentifier(nameNode)) return;
      const name = nameNode.text;
      checkCamelCase(node, name, "property");
    }
    if (ts.isPropertyDeclaration(node)) {
      const nameNode = node.name;
      if (!nameNode) return;
      if (!ts.isIdentifier(nameNode)) return;
      const name = nameNode.text;
      checkCamelCase(node, name, "property");
    }

    if (ts.isVariableDeclaration(node)) {
      const nameNode = node.name;
      if (!nameNode) return;
      if (!ts.isIdentifier(nameNode)) return;
      const name = nameNode.text;
      if (!isSnakeCase(name) && !isCamelCase(name)) {
        console.warn(
          `variable name '${name}' is not camelCase or SNAKE_CASE ${
            getPosition(node)
          }`,
        );
        shouldFail = true;
      }
    }
    if (ts.isVariableDeclarationList(node)) {
      for (const declaration of node.declarations) {
        const nameNode = declaration.name;
        if (!ts.isIdentifier(nameNode)) continue;
        const name = nameNode.text;
        if (!isSnakeCase(name) && !isCamelCase(name)) {
          console.warn(
            `variable name '${name}' is not camelCase or SNAKE_CASE ${
              getPosition(node)
            }`,
          );
          shouldFail = true;
        }
      }
    }

    if (ts.isGetAccessorDeclaration(node)) {
      const nameNode = node.name;
      if (!ts.isIdentifier(nameNode)) return;
      const name = nameNode.text;
      checkCamelCase(node, name, "get accessor");
    }
    if (ts.isSetAccessorDeclaration(node)) {
      const nameNode = node.name;
      if (!ts.isIdentifier(nameNode)) return;
      const name = nameNode.text;
      checkCamelCase(node, name, "set accessor");
    }

    ts.forEachChild(node, visitNode);
  };

  visitNode(sourceFile);
}

if (shouldFail) Deno.exit(1);
