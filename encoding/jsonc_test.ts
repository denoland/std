import * as JSONC from "./jsonc.ts";
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { walk } from "../fs/mod.ts";
import { fromFileUrl } from "../path/mod.ts";

function getError<T>(
  fn: () => T,
): [hasError: boolean, error: unknown, result?: T] {
  try {
    const res = fn();
    return [false, null, res];
  } catch (error: unknown) {
    return [true, error];
  }
}

function assertValidParse(
  text: string,
  expected: unknown,
  options?: JSONC.ParseOptions,
) {
  assertEquals(JSONC.parse(text, options), expected);
}

function assertInvalidParse(
  text: string,
  // deno-lint-ignore no-explicit-any
  ErrorClass?: (new (...args: any[]) => Error),
  msgIncludes?: string,
  options?: JSONC.ParseOptions,
) {
  assertThrows(
    () => JSONC.parse(text, options),
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

      const [hasJsonError, jsonError, jsonResult] = getError(() => {
        JSON.parse(text);
      });
      const [hasJsoncError, jsoncError, jsoncResult] = getError(() => {
        JSONC.parse(text, { allowTrailingComma: false });
      });

      // If an error occurs in JSON.parse() but no error occurs in JSONC.parse(), or vice versa, an error is thrown.
      if (hasJsonError !== hasJsoncError) {
        throw new AggregateError(
          [jsonError, jsoncError],
          `failed: ${dirEntry.path}`,
        );
      }
      assertEquals(jsonResult, jsoncResult);
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
    assertValidParse(`"🦕"`, "🦕");
    assertValidParse(
      `"\u543e\u8f29\u306f\u732b\u3067\u3042\u308b\u3002"`,
      "\u543e\u8f29\u306f\u732b\u3067\u3042\u308b\u3002",
    );
    assertValidParse(
      `"\\" \\\\ \\/ \\b \\f \\n \\r \\t"`,
      '" \\ \/ \b \f \n \r \t',
    );
  },
});

Deno.test({
  name: "[jsonc] JSONCParser.#numberEndToken",
  fn() {
    // Correctly parses the letters after the numbers (` \t\r\n[]{}:,/`)
    assertValidParse(`{"a":0}`, { a: 0 });
    assertValidParse(`[0]`, [0]);
    assertValidParse(`[0,]`, [0]);
    assertValidParse(`0//`, 0);
    assertValidParse(`0\r`, 0);
    assertValidParse(`0\n`, 0);
    assertValidParse(`0\t`, 0);
    assertValidParse(`0 `, 0);
    assertInvalidParse(`{"a":0{}`, SyntaxError);
    assertInvalidParse(`{"a":0[}`, SyntaxError);
    assertInvalidParse(`{"a":0:}`, SyntaxError);
  },
});

Deno.test({
  name: "[jsonc] error message",
  fn() {
    assertInvalidParse(
      `:::::`,
      SyntaxError,
      "Unexpected token : in JSONC at position 0",
    );
    assertInvalidParse(
      `[`,
      SyntaxError,
      "Unexpected end of JSONC input",
    );
    assertInvalidParse(
      `[]100`,
      SyntaxError,
      "Unexpected token 100 in JSONC at position 2",
    );
    assertInvalidParse(
      `[aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa]`,
      SyntaxError,
      "Unexpected token aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa... in JSONC at position 1",
    );
  },
});
