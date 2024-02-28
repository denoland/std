// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { walk } from "../fs/walk.ts";
import { yellow } from "../fmt/colors.ts";

import ts from "npm:typescript";

const ROOT = new URL("../", import.meta.url);
const EXTENSIONS = [".mjs", ".js", ".ts"];
const EXCLUDED_PATHS = [".git"];

const FAIL_FAST = Deno.args.includes("--fail-fast");

let shouldFail = false;

for await (
  const { path } of walk(ROOT, {
    includeDirs: false,
    exts: EXTENSIONS,
    skip: EXCLUDED_PATHS.map((path) => new RegExp(path + "$")),
  })
) {
  const getLocationString = (node: ts.Node) => {
    const location = ts.getLineAndCharacterOfPosition(
      sourceFile,
      node.pos,
    );
    return `${path}:${location.line + 1}`;
  };

  const verifyFunctionDeclarationTags = (
    node: ts.FunctionDeclaration,
    tags: readonly ts.JSDocTag[],
  ) => {
    if (!ts.getJSDocTags(node).length) return;
    if (node.type?.getText() !== "void") {
      const returnTag = ts.getJSDocReturnTag(node);
      if (!returnTag) {
        console.warn(
          "⚠️",
          yellow(`@return tag is missing: ${getLocationString(node)}`),
        );
      }
    }

    const exampleTag = tags.find((tag) => tag.tagName.text === "example");
    if (!exampleTag) {
      console.warn(
        "⚠️",
        yellow(`@example tag is missing: ${getLocationString(node)}`),
      );
    }
  };

  const verifyJsDocTags = (tags: readonly ts.JSDocTag[]) => {
    for (const tag of tags) {
      const name = tag.tagName.text;
      switch (name) {
        case "returns":
          console.warn(
            "⚠️",
            yellow(
              `@returns tag is not allowed. Use @return tag instead: ${
                getLocationString(tag)
              }`,
            ),
          );
          shouldFail = true;
          if (FAIL_FAST) Deno.exit(1);
          break;
        case "param": {
          if (!tag.comment) {
            console.warn(
              "⚠️",
              yellow(`@param tag comment is empty: ${getLocationString(tag)}`),
            );
          }
          shouldFail = true;
          if (FAIL_FAST) Deno.exit(1);
          break;
        }
      }
    }
  };

  const visit = (node: ts.Node) => {
    const tags = ts.getAllJSDocTags(node, (_tag): _tag is ts.JSDocTag => true);
    verifyJsDocTags(tags);
    if (ts.isFunctionDeclaration(node)) {
      verifyFunctionDeclarationTags(node, tags);
    }
    ts.forEachChild(node, visit);
  };

  const source = await Deno.readTextFile(path);
  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  visit(sourceFile);
}

if (shouldFail) Deno.exit(1);
