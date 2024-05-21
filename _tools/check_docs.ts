// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * This script checks that all public symbols documentation aligns with the
 * {@link ./CONTRIBUTING.md#documentation | documentation guidelines}.
 *
 * TODO(iuioiua): Add support for classes and methods.
 */
import {
  doc,
  type DocNodeBase,
  type DocNodeFunction,
  type JsDoc,
  type JsDocTagDocRequired,
} from "@deno/doc";

type DocNodeWithJsDoc<T = DocNodeBase> = T & {
  jsDoc: JsDoc;
};

const ENTRY_POINTS = [
  "../bytes/mod.ts",
  "../datetime/mod.ts",
  "../collections/mod.ts",
  "../internal/mod.ts",
  "../media_types/mod.ts",
] as const;

const MD_SNIPPET = /(?<=```ts\n)(\n|.)*(?=\n```)/g;

class DocumentError extends Error {
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
    throw new DocumentError(message, document);
  }
}

function isExported(document: DocNodeBase) {
  return document.declarationKind === "export";
}

function isFunctionDoc(
  document: DocNodeBase,
): document is DocNodeWithJsDoc<DocNodeFunction> {
  return document.kind === "function" && document.jsDoc !== undefined;
}

function assertHasReturnTag(document: DocNodeWithJsDoc) {
  const tag = document.jsDoc.tags?.find((tag) => tag.kind === "return");
  assert(tag !== undefined, "Symbol must have a @return tag", document);
  assert(
    // @ts-ignore doc is defined
    tag.doc !== undefined,
    "@return tag must have a description",
    document,
  );
}

function assertHasParamTag(
  document: DocNodeWithJsDoc,
  param: string,
) {
  const tag = document.jsDoc.tags?.find((tag) =>
    tag.kind === "param" && tag.name === param
  );
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

function assertHasExampleTag(document: DocNodeWithJsDoc) {
  const tags = document.jsDoc.tags?.filter((tag) => tag.kind === "example");
  if (tags === undefined || tags.length === 0) {
    throw new DocumentError("Symbol must have an @example tag", document);
  }
  for (const tag of (tags as JsDocTagDocRequired[])) {
    assert(
      tag.doc !== undefined,
      "@example tag must have a description",
      document,
    );
    const snippets = tag.doc.match(MD_SNIPPET);
    if (snippets === null) {
      throw new DocumentError(
        "@example tag must have a code snippet",
        document,
      );
    }
    for (const snippet of snippets) {
      const command = new Deno.Command(Deno.execPath(), {
        args: [
          "eval",
          "--ext=ts",
          snippet,
        ],
        stderr: "piped",
      });
      // TODO(iuioiua): Use `await command.output()`
      const { success, stderr } = command.outputSync();
      assert(
        success,
        `Example code snippet failed to execute: \n${snippet}\n${
          new TextDecoder().decode(stderr)
        }`,
        document,
      );
    }
  }
}

function assertHasTypeParamTags(
  document: DocNodeWithJsDoc,
  typeParamName: string,
) {
  const tag = document.jsDoc.tags?.find((tag) =>
    tag.kind === "template" && tag.name === typeParamName
  );
  assert(
    tag !== undefined,
    `Symbol must have a @typeParam tag for ${typeParamName}`,
    document,
  );
  assert(
    // @ts-ignore doc is defined
    tag.doc !== undefined,
    `@typeParam tag for ${typeParamName} must have a description`,
    document,
  );
}

/**
 * Asserts that a function document has:
 * - A `@typeParam` tag for each type parameter.
 * - A {@linkcode https://jsdoc.app/tags-param | @param} tag for each parameter.
 * - A {@linkcode https://jsdoc.app/tags-returns | @returns} tag.
 * - At least one {@linkcode https://jsdoc.app/tags-example | @example} tag with
 *   a code snippet that executes successfully.
 */
function assertFunctionDocs(document: DocNodeWithJsDoc<DocNodeFunction>) {
  for (const param of document.functionDef.params) {
    if (param.kind === "identifier") {
      assertHasParamTag(document, param.name);
    }
    if (param.kind === "assign") {
      // @ts-ignore Trust me
      assertHasParamTag(document, param.left.name);
    }
  }
  for (const typeParam of document.functionDef.typeParams) {
    assertHasTypeParamTags(document, typeParam.name);
  }
  assertHasReturnTag(document);
  assertHasExampleTag(document);
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
