// Copyright 2018-2026 the Deno authors. MIT license.

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
  type JsDocTagParam,
  type Location,
  type TsTypeDef,
} from "@deno/doc";
import { distinctBy } from "@std/collections/distinct-by";
import { getEntrypoints, resolve } from "./utils.ts";

type DocNodeWithJsDoc<T = DocNodeBase> = T & {
  jsDoc: JsDoc;
};

const TS_SNIPPET = /```ts[\s\S]*?```/g;
const ASSERTION_IMPORT =
  /from "@std\/(assert(\/[a-z-]+)?|expect(\/[a-z-]+)?|testing\/(mock|snapshot|types))"/g;
const NEWLINE = "\n";
const diagnostics: DocumentError[] = [];

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
): asserts condition {
  if (!condition) {
    diagnostics.push(new DocumentError(message, document));
  }
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
  assert(
    tag !== undefined,
    "Symbol must have a @return or @returns tag",
    document,
  );
  if (tag === undefined) return;
  assert(
    tag.doc !== undefined,
    "@return tag must have a description",
    document,
  );
}

/**
 * Asserts that a @param tag has a corresponding function definition.
 */
function assertHasParamDefinition(
  document: DocNodeWithJsDoc<DocNodeFunction | ClassMethodDef>,
  param: JsDocTagParam,
) {
  const paramDoc = document.functionDef.params.find((paramDoc) => {
    if (paramDoc.kind === "identifier") {
      return paramDoc.name === param.name;
    } else if (paramDoc.kind === "rest" && paramDoc.arg.kind === "identifier") {
      return paramDoc.arg.name === param.name;
    } else if (
      paramDoc.kind === "assign" && paramDoc.left.kind === "identifier"
    ) {
      return paramDoc.left.name === param.name;
    }
    return false;
  });

  assert(
    paramDoc !== undefined,
    `@param ${param.name} must have a corresponding function parameter definition.`,
    document,
  );
}

function assertHasParamTag(
  document: { jsDoc: JsDoc; location: Location },
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
  if (tag === undefined) return;
  assert(
    // @ts-ignore doc is defined
    tag.doc !== undefined,
    `@param tag for ${param} must have a description`,
    document,
  );
}

function assertHasSnippets(
  doc: string,
  document: { jsDoc: JsDoc; location: Location },
) {
  const snippets = doc.match(TS_SNIPPET);
  assert(
    snippets !== null,
    "@example tag must have a TypeScript code snippet",
    document,
  );
  if (snippets === null) return;
  for (let snippet of snippets) {
    const delim = snippet.split(NEWLINE)[0];
    // Trim the code block delimiters
    snippet = snippet.split(NEWLINE).slice(1, -1).join(NEWLINE);
    if (!(delim?.includes("no-assert") || delim?.includes("ignore"))) {
      assert(
        snippet.match(ASSERTION_IMPORT) !== null,
        "Snippet must contain assertion from `@std/assert`, `@std/expect` or `@std/testing`",
        document,
      );
    }
  }
}

function assertHasExampleTag(
  document: { jsDoc: JsDoc; location: Location },
) {
  const exampleTags = document.jsDoc.tags?.filter((tag) =>
    tag.kind === "example"
  ) as JsDocTagDocRequired[];
  assert(exampleTags?.length > 0, "Symbol must have an @example tag", document);
  if (exampleTags === undefined) return;
  for (const tag of exampleTags) {
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
    assertHasSnippets(tag.doc, document);
  }
}

function assertHasTypeParamTags(
  document: { jsDoc: JsDoc; location: Location },
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
 * - A parameter definition inside the function for each @param tag.
 * - A {@linkcode https://jsdoc.app/tags-returns | @returns} tag.
 * - At least one {@linkcode https://jsdoc.app/tags-example | @example} tag with
 *   a code snippet that executes successfully.
 */
function assertFunctionDocs(
  document: DocNodeWithJsDoc<DocNodeFunction | ClassMethodDef>,
) {
  for (const param of document.functionDef.params) {
    if (param.kind === "identifier") {
      assertHasParamTag(document, param.name);
    }
    if (param.kind === "rest" && param.arg.kind === "identifier") {
      assertHasParamTag(document, param.arg.name);
    }
    if (param.kind === "assign" && param.left.kind === "identifier") {
      assertHasParamTag(document, param.left.name);
    }
  }

  const documentedParams = document.jsDoc.tags?.filter((
    tag,
  ): tag is JsDocTagParam =>
    // Filter nested definitions like options.root as it is still documenting options parameter
    tag.kind === "param" && !tag.name.includes(".")
  ) ?? [];
  for (const param of documentedParams) {
    assertHasParamDefinition(document, param);
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
  for (const typeParam of document.classDef.typeParams) {
    assertHasTypeParamTags(document, typeParam.name);
  }
  if (!document.jsDoc.tags?.some((tag) => tag.kind === "example")) {
    assertHasExampleTag(document);
  }

  for (const property of document.classDef.properties) {
    if (property.jsDoc === undefined) continue; // this is caught by `deno doc --lint`
    assert(
      property.accessibility === undefined,
      "Do not use `public`, `protected`, or `private` fields in classes",
      property,
    );
    assertClassPropertyDocs(
      property as DocNodeWithJsDoc<ClassPropertyDef>,
    );
  }
  for (const method of document.classDef.methods) {
    if (method.jsDoc === undefined) continue; // this is caught by `deno doc --lint`
    assert(
      method.accessibility === undefined,
      "Do not use `public`, `protected`, or `private` methods in classes",
      document,
    );
    assertFunctionDocs(method as DocNodeWithJsDoc<ClassMethodDef>);
  }
  for (const constructor of document.classDef.constructors) {
    if (constructor.jsDoc === undefined) continue; // this is caught by `deno doc --lint`
    assert(
      constructor.accessibility === undefined,
      "Do not use `public`, `protected`, or `private` constructors in classes",
      constructor,
    );
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
  assertHasSnippets(document.jsDoc.doc!, document);
}

/**
 * Ensures an interface document:
 * - Has `@default` tags for all optional properties.
 */
// deno-lint-ignore no-unused-vars
function assertHasDefaultTags(document: DocNodeWithJsDoc<DocNodeInterface>) {
  for (const prop of document.interfaceDef.properties) {
    if (!prop.optional) continue;
    assert(
      prop.jsDoc?.tags?.find((tag) => tag.kind === "default") !== undefined,
      "Optional interface properties should have default values",
      document,
    );
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

function assertHasDeprecationDesc(document: DocNodeWithJsDoc<DocNode>) {
  const tags = document.jsDoc?.tags;
  if (!tags) return;
  for (const tag of tags) {
    if (tag.kind !== "deprecated") continue;
    assert(
      tag.doc !== undefined,
      "@deprecated tag must have a description",
      document,
    );
  }
}

async function assertDocs(specifiers: string[]) {
  const docs = await doc(specifiers, { resolve });
  for (const d of Object.values(docs).flat()) {
    if (d.jsDoc === undefined || d.declarationKind !== "export") continue; // this is caught by other checks

    const document = d as DocNodeWithJsDoc<DocNode>;
    assertHasDeprecationDesc(document);
    switch (document.kind) {
      case "moduleDoc": {
        if (document.location.filename.endsWith("/mod.ts")) {
          assertModuleDoc(document);
        }
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
        break;
    }
  }
}

export async function checkDocs(specifiers: string[]) {
  const { success, stderr } = await new Deno.Command(Deno.execPath(), {
    args: ["doc", "--lint", ...specifiers],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "piped",
  }).output();
  if (!success) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  await assertDocs(specifiers);

  if (diagnostics.length > 0) {
    const errors = distinctBy(diagnostics, (e) => e.message + e.cause);
    for (const error of errors) {
      // deno-lint-ignore no-console
      console.error(
        `%c[error] %c${error.message} %cat ${error.cause}`,
        "color: red",
        "",
        "color: gray",
      );
    }

    // deno-lint-ignore no-console
    console.log(`%c${errors.length} errors found`, "color: red");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  const specifiers = (await getEntrypoints())
    .map((entrypoint) => import.meta.resolve(entrypoint))
    .filter((specifier) => specifier.endsWith(".ts"));
  await checkDocs(specifiers);
}
