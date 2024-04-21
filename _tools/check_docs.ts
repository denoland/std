// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { doc } from "deno_doc/mod.ts";
import type {
  DocNodeBase,
  DocNodeFunction,
  JsDocTag,
  Location,
} from "deno_doc/types.d.ts";

const ENTRY_POINTS = [
  "../bytes/mod.ts",
] as const;

class ValidationError extends Error {
  constructor(message: string, location: Location) {
    super(`${message} at ${location.filename}:${location.line}`);
    this.name = this.constructor.name;
  }
}

function assert(
  condition: boolean,
  message: string,
  location: Location,
): asserts condition {
  if (!condition) {
    throw new ValidationError(message, location);
  }
}

function isFunctionDoc(document: DocNodeBase): document is DocNodeFunction {
  return document.kind === "function";
}

function isExported(document: DocNodeBase) {
  return document.declarationKind === "export";
}

function assertHasTag(tags: JsDocTag[], kind: string, location: Location) {
  const tag = tags.find((tag) => tag.kind === kind);
  assert(tag !== undefined, `Symbol must have a @${kind} tag`, location);
  assert(
    // @ts-ignore doc is defined
    tag.doc !== undefined,
    `@${kind} tag must have a description`,
    location,
  );
}

function assertFunctionDocs(document: DocNodeFunction) {
  assert(
    document.jsDoc !== undefined,
    "Symbol must have a JSDoc block",
    document.location,
  );
  const { tags } = document.jsDoc;
  assert(tags !== undefined, "JSDoc block must have tags", document.location);
  for (const kind of ["param", "return", "example"]) {
    assertHasTag(tags, kind, document.location);
  }
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
