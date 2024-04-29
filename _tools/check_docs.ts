// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * This script checks that all exported functions have JSDoc comments with
 * `@param`, `@return`, and `@example` tags, according to the contributing
 * guidelines.
 *
 * @see {@link https://github.com/denoland/deno_std/blob/main/.github/CONTRIBUTING.md#documentation}
 *
 * TODO(iuioiua): Add support for classes and methods.
 */
import { doc } from "@deno/doc";
import type { DocNodeBase, DocNodeFunction, JsDocTag } from "@deno/doc/types";

const ENTRY_POINTS = [
  "../bytes/mod.ts",
  "../datetime/mod.ts",
] as const;

class ValidationError extends Error {
  constructor(message: string, document: DocNodeBase) {
    super(message, {
      cause: `${document.location.filename}:${document.location.line}`,
    });
    this.name = this.constructor.name;
  }
}

function assert(
  condition: boolean,
  message: string,
  document: DocNodeBase,
): asserts condition {
  if (!condition) {
    throw new ValidationError(message, document);
  }
}

function isFunctionDoc(document: DocNodeBase): document is DocNodeFunction {
  return document.kind === "function";
}

function isExported(document: DocNodeBase) {
  return document.declarationKind === "export";
}

function assertHasTag(tags: JsDocTag[], kind: string, document: DocNodeBase) {
  const tag = tags.find((tag) => tag.kind === kind);
  assert(tag !== undefined, `Symbol must have a @${kind} tag`, document);
  assert(
    // @ts-ignore doc is defined
    tag.doc !== undefined,
    `@${kind} tag must have a description`,
    document,
  );
}

function assertHasParamTag(
  tags: JsDocTag[],
  param: string,
  document: DocNodeBase,
) {
  const tag = tags.find((tag) => tag.kind === "param" && tag.name === param);
  assert(
    tag !== undefined,
    `Symbol must have a @param tag for ${param}`,
    document,
  );
  assert(
    // @ts-ignore doc is defined
    tag.doc !== undefined,
    `@param tag for ${param} must have a description`,
    document,
  );
}

function assertFunctionDocs(document: DocNodeFunction) {
  assert(
    document.jsDoc !== undefined,
    "Symbol must have a JSDoc block",
    document,
  );
  const { tags } = document.jsDoc;
  assert(tags !== undefined, "JSDoc block must have tags", document);
  for (const param of document.functionDef.params) {
    if (param.kind === "identifier") {
      assertHasParamTag(tags, param.name, document);
    }
    if (param.kind === "assign") {
      // @ts-ignore Trust me
      assertHasParamTag(tags, param.left.name, document);
    }
  }
  assertHasTag(tags, "return", document);
  assertHasTag(tags, "example", document);
}

async function checkDocs(specifier: string) {
  const docs = await doc(specifier);
  docs.filter(isExported)
    .forEach((document) => {
      if (isFunctionDoc(document)) {
        assertFunctionDocs(document);
      }
    });
}

const promises = [];
for (const entry of ENTRY_POINTS) {
  const { href } = new URL(entry, import.meta.url);
  promises.push(checkDocs(href));
}
await Promise.all(promises);
