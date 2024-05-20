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
import {
  doc,
  type DocNodeBase,
  type DocNodeFunction,
  type JsDocTag,
  type JsDocTagDocRequired,
} from "@deno/doc";

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

/**
 * We only check functions that have JSDocs. We know that exported functions
 * have JSDocs thanks to `deno doc --lint`, which is used in the `lint:docs`
 * task.
 */
function isFunctionDoc(document: DocNodeBase): document is DocNodeFunction {
  return document.kind === "function" && document.jsDoc !== undefined;
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
  tags: JsDocTag[],
  typeParamName: string,
  document: DocNodeBase,
) {
  const tag = tags.find((tag) =>
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
    assertHasTypeParamTags(tags, typeParam.name, document);
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
