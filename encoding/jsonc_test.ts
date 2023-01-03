// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { bundle } from "https://deno.land/x/emit@0.12.0/mod.ts";
import * as JSONC from "./jsonc.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "../testing/asserts.ts";

// The test code for the jsonc module can also be found in the testcode directory.

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
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes?: string,
  options?: JSONC.ParseOptions,
) {
  assertThrows(
    () => JSONC.parse(text, options),
    ErrorClass,
    msgIncludes,
  );
}

Deno.test({
  name: "[jsonc] parse with single line comment",
  fn() {
    assertValidParse(`"aaa"//comment`, "aaa");
    assertValidParse(`["aaa"//comment\n,"aaa"]`, ["aaa", "aaa"]);
    assertValidParse(`["aaa"//comment\r,"aaa"]`, ["aaa", "aaa"]);
    assertValidParse(`["aaa"//comment\n\r,"aaa"]`, ["aaa", "aaa"]);
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

Deno.test({
  name: "[jsonc] __proto__",
  fn() {
    // The result of JSON.parse and the result of JSONC.parse should match
    const json = JSON.parse('{"__proto__": 100}');
    const jsonc = JSONC.parse('{"__proto__": 100}');
    assertEquals(jsonc, json);
    assertEquals((jsonc as Record<string, number>).__proto__, 100);
    assertEquals((jsonc as Record<string, string>).__proto__, json.__proto__);
    assertStrictEquals(Object.getPrototypeOf(jsonc), Object.prototype);
    assertStrictEquals(
      Object.getPrototypeOf(jsonc),
      Object.getPrototypeOf(json),
    );
  },
});

Deno.test({
  name: "[jsonc] duplicate object key",
  fn() {
    // The result of JSON.parse and the result of JSONC.parse should match
    const json = JSON.parse('{"aaa": 0, "aaa": 1}');
    const jsonc = JSONC.parse('{"aaa": 0, "aaa": 1}');
    assertEquals(jsonc, { aaa: 1 });
    assertEquals(jsonc, json);
  },
});

Deno.test({
  name: "[jsonc] parse other than strings",
  fn() {
    assertInvalidParse(
      // deno-lint-ignore no-explicit-any
      undefined as any,
      SyntaxError,
      "Unexpected token undefined in JSONC at position 0",
    );
    // deno-lint-ignore no-explicit-any
    assertValidParse(0 as any, 0);
  },
});

Deno.test({
  name: "[jsonc] parse consecutive backslash",
  fn() {
    assertValidParse('"foo\\\\"', "foo\\");

    assertValidParse('  ["foo\\"", "bar"]', ['foo"', "bar"]);
    assertInvalidParse('["foo\\\\"", "bar"]', SyntaxError);
    assertValidParse('  ["foo\\\\\\"", "bar"]', ['foo\\"', "bar"]);
    assertInvalidParse('["foo\\\\\\\\"", "bar"]', SyntaxError);

    assertInvalidParse('["foo\\", "bar"]', SyntaxError);
    assertValidParse('  ["foo\\\\", "bar"]', ["foo\\", "bar"]);
    assertInvalidParse('["foo\\\\\\", "bar"]', SyntaxError);
    assertValidParse('  ["foo\\\\\\\\", "bar"]', ["foo\\\\", "bar"]);
  },
});

Deno.test({
  name: "[jsonc] avoid prototype pollution",
  fn() {
    // reference: https://github.com/advisories/GHSA-9c47-m6qq-7p4h
    // Check for prototype pollution using the code contained in the CVE-2022-46175.

    const jsonc = JSONC.parse('{"__proto__": { "isAdmin": true }}');
    // @ts-expect-error: for test
    assertEquals(jsonc.__proto__, { isAdmin: true });
    // @ts-expect-error: for test
    assertEquals(jsonc.isAdmin, undefined);
    // @ts-expect-error: for test
    assertEquals(Object.keys(jsonc), ["__proto__"]);
  },
});

Deno.test({
  name: "[jsonc] avoid prototype pollution in Node.js",
  async fn() {
    // reference: https://github.com/advisories/GHSA-9c47-m6qq-7p4h (CVE-2022-46175)
    // Check whether prototype pollution does not occur when running in Node.js or browser environment using the code contained in the CVE-2022-46175.
    const tempTile = await Deno.makeTempFile();
    try {
      // 1. generate code
      const { code } = await bundle(
        new URL(import.meta.resolve("./testdata/jsonc/node/check_proto.ts")),
        { type: "classic" },
      );

      // 2. create tmp file
      await Deno.writeTextFile(tempTile, code);

      // 3. run in Node.js
      const command = new Deno.Command("node", {
        stdout: "inherit",
        stderr: "inherit",
        args: [tempTile],
      });

      // 4. check for successful completion
      const { success } = await command.output();
      assert(success);
    } finally {
      await Deno.remove(tempTile);
    }
  },
});
