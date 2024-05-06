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
import type {
  DocNodeBase,
  DocNodeFunction,
  JsDocTag,
  JsDocTagDocRequired,
} from "@deno/doc/types";

const ENTRY_POINTS = [
  "../bytes/mod.ts",
  "../datetime/mod.ts",
] as const;

const MD_SNIPPET = /(?<=```ts\n)(\n|.)*(?=\n```)/g;

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

function assertHasExampleTag(tags: JsDocTag[], document: DocNodeBase) {
  tags = tags.filter((tag) => tag.kind === "example");
  if (tags.length === 0) {
    throw new ValidationError("Symbol must have an @example tag", document);
  }
  for (const tag of (tags as JsDocTagDocRequired[])) {
    assert(
      tag.doc !== undefined,
      "@example tag must have a description",
      document,
    );
    const snippets = tag.doc.match(MD_SNIPPET);
    if (snippets === null) {
      throw new ValidationError(
        "@example tag must have a code snippet",
        document,
      );
    }
    for (const snippet of snippets) {
      const command = new Deno.Command(Deno.execPath(), {
        args: [
          "eval",
          snippet,
        ],
      });
      const { success } = command.outputSync();
      assert(
        success,
        `Example code snippet failed to execute: \n${snippet}\n`,
        document,
      );
    }
  }
}

function assertHasTemplateTags(
  tags: JsDocTag[],
  template: string,
  document: DocNodeBase,
) {
  const tag = tags.find((tag) =>
    tag.kind === "template" && tag.name === template
  );
  assert(
    tag !== undefined,
    `Symbol must have a @template tag for ${template}`,
    document,
  );
  assert(
    // @ts-ignore doc is defined
    tag.doc !== undefined,
    `@template tag for ${template} must have a description`,
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
  for (const typeParam of document.functionDef.typeParams) {
    assertHasTemplateTags(tags, typeParam.name, document);
  }
  assertHasTag(tags, "return", document);
  assertHasExampleTag(tags, document);
}

async function checkDocs(specifier: string) {
  const docs = await doc(specifier);
  for (const document of docs.filter(isExported)) {
    if (isFunctionDoc(document)) {
      assertFunctionDocs(document);
    }
  }
}

const promises = [];
for (const entry of ENTRY_POINTS) {
  const { href } = new URL(entry, import.meta.url);
  promises.push(checkDocs(href));
}
await Promise.all(promises);
