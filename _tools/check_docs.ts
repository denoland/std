// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * This script checks that all public symbols documentation aligns with the
 * {@link ./CONTRIBUTING.md#documentation | documentation guidelines}.
 *
 * TODO(lucacasonato): Add support for variables, interfaces, namespaces, and type aliases.
 */
import {
  type ClassConstructorDef,
  type ClassMethodDef,
  type ClassPropertyDef,
  doc,
  type DocNode,
  type DocNodeBase,
  type DocNodeClass,
  type DocNodeFunction,
  type DocNodeInterface,
  type DocNodeModuleDoc,
  type JsDoc,
  type JsDocTagDocRequired,
  type Location,
  type TsTypeDef,
} from "@deno/doc";
import { pooledMap } from "@std/async/pool";

type DocNodeWithJsDoc<T = DocNodeBase> = T & {
  jsDoc: JsDoc;
};

const ENTRY_POINTS = [
  "../archive/mod.ts",
  "../assert/mod.ts",
  "../assert/unstable_never.ts",
  "../async/mod.ts",
  "../bytes/mod.ts",
  "../cache/mod.ts",
  "../cli/mod.ts",
  "../cli/unstable_spinner.ts",
  "../crypto/mod.ts",
  "../collections/mod.ts",
  "../csv/mod.ts",
  "../data_structures/mod.ts",
  "../data_structures/unstable_bidirectional_map.ts",
  "../datetime/mod.ts",
  "../dotenv/mod.ts",
  "../encoding/mod.ts",
  "../encoding/unstable_base64_stream.ts",
  "../encoding/unstable_base32hex_stream.ts",
  "../encoding/unstable_base32_stream.ts",
  "../encoding/unstable_base64url_stream.ts",
  "../encoding/unstable_base32hex_stream.ts",
  "../encoding/unstable_hex_stream.ts",
  "../expect/mod.ts",
  "../fmt/bytes.ts",
  "../fmt/colors.ts",
  "../fmt/duration.ts",
  "../fmt/printf.ts",
  "../front_matter/mod.ts",
  "../front_matter/unstable_yaml.ts",
  "../fs/mod.ts",
  "../html/mod.ts",
  "../html/unstable_is_valid_custom_element_name.ts",
  "../http/mod.ts",
  "../http/unstable_header.ts",
  "../http/unstable_method.ts",
  "../http/unstable_signed_cookie.ts",
  "../ini/mod.ts",
  "../internal/mod.ts",
  "../io/mod.ts",
  "../json/mod.ts",
  "../jsonc/mod.ts",
  "../log/base_handler.ts",
  "../log/warn.ts",
  "../log/critical.ts",
  "../log/debug.ts",
  "../log/error.ts",
  "../log/info.ts",
  "../log/console_handler.ts",
  "../log/formatters.ts",
  "../log/get_logger.ts",
  "../media_types/mod.ts",
  "../msgpack/mod.ts",
  "../net/mod.ts",
  "../net/unstable_get_network_address.ts",
  "../path/mod.ts",
  "../path/unstable_basename.ts",
  "../path/unstable_dirname.ts",
  "../path/unstable_extname.ts",
  "../path/unstable_join.ts",
  "../path/unstable_normalize.ts",
  "../path/posix/mod.ts",
  "../path/windows/mod.ts",
  "../random/mod.ts",
  "../regexp/mod.ts",
  "../semver/mod.ts",
  "../streams/mod.ts",
  "../streams/unstable_fixed_chunk_stream.ts",
  "../streams/unstable_to_lines.ts",
  "../streams/unstable_to_bytes.ts",
  "../tar/mod.ts",
  "../text/mod.ts",
  "../text/unstable_slugify.ts",
  "../text/unstable_to_constant_case.ts",
  "../testing/bdd.ts",
  "../testing/mock.ts",
  "../testing/snapshot.ts",
  "../testing/time.ts",
  "../testing/types.ts",
  "../toml/mod.ts",
  "../ulid/mod.ts",
  "../uuid/mod.ts",
  "../uuid/unstable_v7.ts",
  "../webgpu/mod.ts",
  "../yaml/mod.ts",
] as const;

const TS_SNIPPET = /```ts[\s\S]*?```/g;
const ASSERTION_IMPORT =
  /from "@std\/(assert(\/[a-z-]+)?|testing\/(mock|snapshot|types))"/g;
const NEWLINE = "\n";
const diagnostics: DocumentError[] = [];
const snippetPromises: (() => Promise<void>)[] = [];

class DocumentError extends Error {
  constructor(
    message: string,
    document: { location: Location },
  ) {
    super(message, {
      cause: `${document.location.filename}:${document.location.line}`,
    });
    this.name = this.constructor.name;
  }
}

function assert(
  condition: boolean,
  message: string,
  document: { location: Location },
) {
  if (!condition) {
    diagnostics.push(new DocumentError(message, document));
  }
}

function isExported(document: DocNodeBase) {
  return document.declarationKind === "export";
}

function isVoidOrPromiseVoid(returnType: TsTypeDef) {
  return isVoid(returnType) ||
    (returnType.kind === "typeRef" &&
      returnType.typeRef.typeName === "Promise" &&
      returnType.typeRef.typeParams?.length === 1 &&
      isVoid(returnType.typeRef.typeParams[0]!));
}

function isTypeAsserts(returnType: TsTypeDef) {
  return returnType.kind === "typePredicate" &&
    returnType.typePredicate.asserts;
}

function isVoid(returnType: TsTypeDef) {
  return returnType.kind === "keyword" && returnType.keyword === "void";
}

function assertHasReturnTag(document: { jsDoc: JsDoc; location: Location }) {
  const tag = document.jsDoc.tags?.find((tag) => tag.kind === "return");
  if (tag === undefined) {
    diagnostics.push(
      new DocumentError("Symbol must have a @return or @returns tag", document),
    );
  } else {
    assert(
      // @ts-ignore doc is defined
      tag.doc !== undefined,
      "@return tag must have a description",
      document,
    );
  }
}

function assertHasParamTag(
  document: { jsDoc: JsDoc; location: Location },
  param: string,
) {
  const tag = document.jsDoc.tags?.find((tag) =>
    tag.kind === "param" && tag.name === param
  );
  if (!tag) {
    diagnostics.push(
      new DocumentError(`Symbol must have a @param tag for ${param}`, document),
    );
  } else {
    assert(
      // @ts-ignore doc is defined
      tag.doc !== undefined,
      `@param tag for ${param} must have a description`,
      document,
    );
  }
}

function assertSnippetsWork(
  doc: string,
  document: { jsDoc: JsDoc; location: Location },
  required = true,
) {
  const snippets = doc.match(TS_SNIPPET);
  if (snippets === null) {
    if (required) {
      diagnostics.push(
        new DocumentError(
          "@example tag must have a TypeScript code snippet",
          document,
        ),
      );
      return;
    } else {
      return;
    }
  }
  for (let snippet of snippets) {
    const delim = snippet.split(NEWLINE)[0];
    // Trim the code block delimiters
    snippet = snippet.split(NEWLINE).slice(1, -1).join(NEWLINE);
    if (!(delim?.includes("no-assert") || delim?.includes("ignore"))) {
      assert(
        snippet.match(ASSERTION_IMPORT) !== null,
        "Snippet must contain assertion from '@std/assert'",
        document,
      );
    }
  }
}

function assertHasExampleTag(
  document: { jsDoc: JsDoc; location: Location },
) {
  const tags = document.jsDoc.tags?.filter((tag) =>
    tag.kind === "example"
  ) as JsDocTagDocRequired[];
  if (tags === undefined || tags.length === 0) {
    diagnostics.push(
      new DocumentError("Symbol must have an @example tag", document),
    );
    return;
  }
  for (const tag of tags) {
    assert(
      tag.doc !== undefined,
      "@example tag must have a title and TypeScript code snippet",
      document,
    );
    /**
     * Otherwise, if the example title is undefined, it is given the title
     * "Example #" by default.
     */
    assert(
      !tag.doc.startsWith("```ts"),
      "@example tag must have a title",
      document,
    );
    assertSnippetsWork(tag.doc, document);
  }
}

function assertHasTypeParamTags(
  document: { jsDoc: JsDoc; location: Location },
  typeParamName: string,
) {
  const tag = document.jsDoc.tags?.find((tag) =>
    tag.kind === "template" && tag.name === typeParamName
  );
  if (tag === undefined) {
    diagnostics.push(
      new DocumentError(
        `Symbol must have a @typeParam tag for ${typeParamName}`,
        document,
      ),
    );
  } else {
    assert(
      // @ts-ignore doc is defined
      tag.doc !== undefined,
      `@typeParam tag for ${typeParamName} must have a description`,
      document,
    );
  }
}

/**
 * Asserts that a function document has:
 * - A `@typeParam` tag for each type parameter.
 * - A {@linkcode https://jsdoc.app/tags-param | @param} tag for each parameter.
 * - A {@linkcode https://jsdoc.app/tags-returns | @returns} tag.
 * - At least one {@linkcode https://jsdoc.app/tags-example | @example} tag with
 *   a code snippet that executes successfully.
 */
function assertFunctionDocs(
  document: DocNodeWithJsDoc<DocNodeFunction | ClassMethodDef>,
) {
  assertSnippetsWork(document.jsDoc.doc!, document, false);
  for (const param of document.functionDef.params) {
    if (param.kind === "identifier") {
      assertHasParamTag(document, param.name);
    }
    if (param.kind === "assign" && param.left.kind === "identifier") {
      assertHasParamTag(document, param.left.name);
    }
  }
  for (const typeParam of document.functionDef.typeParams) {
    assertHasTypeParamTags(document, typeParam.name);
  }
  if (
    document.functionDef.returnType !== undefined &&
    !isVoidOrPromiseVoid(document.functionDef.returnType) &&
    !isTypeAsserts(document.functionDef.returnType)
  ) {
    assertHasReturnTag(document);
  }
  assertHasExampleTag(document);
}

/**
 * Asserts that a class document has:
 * - A `@typeParam` tag for each type parameter.
 * - At least one {@linkcode https://jsdoc.app/tags-example | @example} tag with
 *   a code snippet that executes successfully.
 * - Documentation on all properties, methods, and constructors.
 */
function assertClassDocs(document: DocNodeWithJsDoc<DocNodeClass>) {
  assertSnippetsWork(document.jsDoc.doc!, document, false);
  for (const typeParam of document.classDef.typeParams) {
    assertHasTypeParamTags(document, typeParam.name);
  }
  assertHasExampleTag(document);

  for (const property of document.classDef.properties) {
    if (property.jsDoc === undefined) continue; // this is caught by `deno doc --lint`
    if (property.accessibility !== undefined) {
      diagnostics.push(
        new DocumentError(
          "Do not use `public`, `protected`, or `private` fields in classes",
          property,
        ),
      );
      continue;
    }
    assertClassPropertyDocs(
      property as DocNodeWithJsDoc<ClassPropertyDef>,
    );
  }
  for (const method of document.classDef.methods) {
    if (method.jsDoc === undefined) continue; // this is caught by `deno doc --lint`
    if (method.accessibility !== undefined) {
      diagnostics.push(
        new DocumentError(
          "Do not use `public`, `protected`, or `private` methods in classes",
          method,
        ),
      );
    }
    assertFunctionDocs(method as DocNodeWithJsDoc<ClassMethodDef>);
  }
  for (const constructor of document.classDef.constructors) {
    if (constructor.jsDoc === undefined) continue; // this is caught by `deno doc --lint`
    if (constructor.accessibility !== undefined) {
      diagnostics.push(
        new DocumentError(
          "Do not use `public`, `protected`, or `private` constructors in classes",
          constructor,
        ),
      );
    }
    assertConstructorDocs(
      constructor as DocNodeWithJsDoc<ClassConstructorDef>,
    );
  }
}

/**
 * Asserts that a class property document has:
 * - At least one {@linkcode https://jsdoc.app/tags-example | @example} tag with
 *   a code snippet that executes successfully.
 */
function assertClassPropertyDocs(
  property: DocNodeWithJsDoc<ClassPropertyDef>,
) {
  assertHasExampleTag(property);
}

/**
 * Checks a constructor document for:
 * - No TypeScript parameters marked with `public`, `protected`, or `private`.
 * - A {@linkcode https://jsdoc.app/tags-param | @param} tag for each parameter.
 * - At least one {@linkcode https://jsdoc.app/tags-example | @example} tag with
 *   a code snippet that executes successfully.
 */
function assertConstructorDocs(
  constructor: DocNodeWithJsDoc<ClassConstructorDef>,
) {
  for (const param of constructor.params) {
    assert(
      param.accessibility === undefined,
      "Do not use `public`, `protected`, or `private` parameters in constructors",
      constructor,
    );
    if (param.kind === "identifier") {
      assertHasParamTag(constructor, param.name);
    }
    if (param.kind === "assign" && param.left.kind === "identifier") {
      assertHasParamTag(constructor, param.left.name);
    }
  }
}

/**
 * Checks a module document for:
 * - Code snippets that execute successfully.
 */
function assertModuleDoc(document: DocNodeWithJsDoc<DocNodeModuleDoc>) {
  assertSnippetsWork(document.jsDoc.doc!, document);
}

/**
 * Ensures an interface document:
 * - Has `@default` tags for all optional properties.
 */
// deno-lint-ignore no-unused-vars
function assertHasDefaultTags(document: DocNodeWithJsDoc<DocNodeInterface>) {
  for (const prop of document.interfaceDef.properties) {
    if (!prop.optional) continue;
    if (!prop.jsDoc?.tags?.find((tag) => tag.kind === "default")) {
      diagnostics.push(
        new DocumentError(
          "Optional interface properties should have default values",
          document,
        ),
      );
    }
  }
}

// deno-lint-ignore no-unused-vars
function assertInterfaceDocs(document: DocNodeWithJsDoc<DocNodeInterface>) {
  // TODO(iuioiua): This is currently disabled deliberately, as it throws errors
  // for interface properties that don't have a `@default` tag. Re-enable this
  // when checking for `@default` tags again, or when a solution is found for
  // ignoring some properties (those that don't require a `@default` tag).
  // assertHasDefaultTags(document);
}

function resolve(specifier: string, referrer: string): string {
  if (specifier.startsWith("@std/")) {
    specifier = specifier.replace("@std/", "../").replaceAll("-", "_");
    const parts = specifier.split("/");
    if (parts.length === 2) {
      specifier += "/mod.ts";
    } else if (parts.length > 2) {
      specifier += ".ts";
    }
  }
  return new URL(specifier, referrer).href;
}

async function checkDocs(specifier: string) {
  const docs = await doc(specifier, { resolve });
  for (const d of docs.filter(isExported)) {
    if (d.jsDoc === undefined) continue; // this is caught by other checks
    const document = d as DocNodeWithJsDoc<DocNode>;
    switch (document.kind) {
      case "moduleDoc": {
        assertModuleDoc(document);
        break;
      }
      case "function": {
        assertFunctionDocs(document);
        break;
      }
      case "class": {
        assertClassDocs(document);
        break;
      }
      case "interface":
        assertInterfaceDocs(document);
    }
  }
}

const ENTRY_POINT_URLS = ENTRY_POINTS.map((entry) =>
  new URL(entry, import.meta.url).href
);

const lintStatus = await new Deno.Command(Deno.execPath(), {
  args: ["doc", "--lint", ...ENTRY_POINT_URLS],
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
}).output();
if (!lintStatus.success) {
  // deno-lint-ignore no-console
  console.error(
    `%c[error] %c'deno doc --lint' failed`,
    "color: red",
    "",
  );
  Deno.exit(1);
}

await Promise.all(ENTRY_POINT_URLS.map(checkDocs));

const iter = pooledMap(
  navigator.hardwareConcurrency,
  snippetPromises,
  (fn) => fn(),
);
for await (const _ of iter) {
  // noop
}
if (diagnostics.length > 0) {
  for (const error of diagnostics) {
    // deno-lint-ignore no-console
    console.error(
      `%c[error] %c${error.message} %cat ${error.cause}`,
      "color: red",
      "",
      "color: gray",
    );
  }

  // deno-lint-ignore no-console
  console.log(`%c${diagnostics.length} errors found`, "color: red");
  Deno.exit(1);
}
