import { parse, ParseOptions } from "./jsonc.ts";
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { walk } from "../fs/mod.ts";
import { fromFileUrl } from "../path/mod.ts";

function getError(fn: () => void): [hasError: boolean, error: unknown] {
  try {
    fn();
    return [false, null];
  } catch (error: unknown) {
    return [true, error];
  }
}

function assertValidParse(
  text: string,
  expected: unknown,
  options?: ParseOptions,
) {
  assertEquals(parse(text, options), expected);
}

function assertInvalidParse(
  text: string,
  // deno-lint-ignore no-explicit-any
  ErrorClass?: (new (...args: any[]) => Error),
  msgIncludes?: string,
  options?: ParseOptions,
) {
  assertThrows(
    () => parse(text, options),
    ErrorClass,
    msgIncludes,
  );
}

const ignoreFile = new Set([
  "n_object_trailing_comment.json",
  "n_object_trailing_comment_slash_open.json",
  "n_structure_object_with_comment.json",
]);
for await (
  const dirEntry of walk(
    fromFileUrl(new URL("./testdata/jsonc/JSONTestSuite/", import.meta.url)),
  )
) {
  if (!dirEntry.isFile) {
    continue;
  }
  if (ignoreFile.has(dirEntry.name)) {
    continue;
  }
  Deno.test({
    name: `[jsonc] parse JSONTestSuite:${dirEntry.name}`,
    async fn() {
      const text = await Deno.readTextFile(dirEntry.path);
      const [hasJsonParseError, jsonParseError] = getError(() => {
        JSON.parse(text);
      });
      const [hasJsoncParseError, jsoncParseError] = getError(() => {
        parse(text, { allowTrailingComma: false });
      });
      if (hasJsonParseError !== hasJsoncParseError) {
        throw new AggregateError(
          [jsonParseError, jsoncParseError],
          `failed: ${dirEntry.path}`,
        );
      }
    },
  });
}

Deno.test({
  name: "[jsonc] parse with single line comment",
  fn() {
    assertValidParse(`"aaa"//comment`, "aaa");
    assertValidParse(`"aaa"//comment\n`, "aaa");
    assertValidParse(`"aaa"//comment\r\n`, "aaa");
  },
});

Deno.test({
  name: "[jsonc] parse with multi line comments",
  fn() {
    assertValidParse(`"aaa"/*comment*/`, "aaa");
    assertValidParse(`100/*comment*/`, 100);
    assertValidParse(`"aaa/*comment*/"`, "aaa/*comment*/");
    assertValidParse(`"aaa"/*comment\ncomment*/`, "aaa");
    assertInvalidParse(`"aaa"/*`, SyntaxError);
    assertInvalidParse(`"aaa"/*/`, SyntaxError);
  },
});

Deno.test({
  name: "[jsonc] parse special character",
  fn() {
    assertValidParse(`"👪"`, "👪");
  },
});
