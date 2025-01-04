// Copyright 2018-2025 the Deno authors. MIT license.

import { parse } from "./parse.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";

import "./testdata/JSONTestSuite/test.ts";
import "./testdata/node-jsonc-parser/test.ts";
import "./testdata/test262/test.ts";

// The test code for the jsonc module can also be found in the testcode directory.

function assertValidParse(text: string, expected: unknown) {
  assertEquals(parse(text), expected);
}

function assertInvalidParse(
  text: string,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes?: string,
) {
  assertThrows(
    () => parse(text),
    ErrorClass,
    msgIncludes,
  );
}

Deno.test({
  name: "parse() handles single line comment",
  fn() {
    assertValidParse(`"aaa"//comment`, "aaa");
    assertValidParse(`["aaa"//comment\n,"aaa"]`, ["aaa", "aaa"]);
    assertValidParse(`["aaa"//comment\r,"aaa"]`, ["aaa", "aaa"]);
    assertValidParse(`["aaa"//comment\n\r,"aaa"]`, ["aaa", "aaa"]);
  },
});

Deno.test({
  name: "parse() handles multi line comments",
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
  name: "parse() handles special characters",
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
  name: "parse() handles #numberEndToken correctly",
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
  name: "parse() throws error message",
  fn() {
    assertInvalidParse(
      `:::::`,
      SyntaxError,
      'Cannot parse JSONC: unexpected token ":" in JSONC at position 0',
    );
    assertInvalidParse(
      `[`,
      SyntaxError,
      "Cannot parse JSONC: unexpected end of JSONC input",
    );
    assertInvalidParse(
      `[]100`,
      SyntaxError,
      'Cannot parse JSONC: unexpected token "100" in JSONC at position 2',
    );
    assertInvalidParse(
      `[aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa]`,
      SyntaxError,
      'Cannot parse JSONC: unexpected token "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..." in JSONC at position 1',
    );
    assertInvalidParse(
      `}`,
      SyntaxError,
      'Cannot parse JSONC: unexpected token "}" in JSONC at position 0',
    );
    assertInvalidParse(
      `]`,
      SyntaxError,
      'Cannot parse JSONC: unexpected token "]" in JSONC at position 0',
    );
    assertInvalidParse(
      `,`,
      SyntaxError,
      'Cannot parse JSONC: unexpected token "," in JSONC at position 0',
    );
  },
});

Deno.test({
  name: "parse() handles __proto__",
  fn() {
    // The result of JSON.parse and the result of JSONC.parse should match
    const json = JSON.parse('{"__proto__": 100}');
    const jsonc = parse('{"__proto__": 100}');
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
  name: "parse() handles duplicate object key",
  fn() {
    // The result of JSON.parse and the result of JSONC.parse should match
    const json = JSON.parse('{"aaa": 0, "aaa": 1}');
    const jsonc = parse('{"aaa": 0, "aaa": 1}');
    assertEquals(jsonc, { aaa: 1 });
    assertEquals(jsonc, json);
  },
});

Deno.test({
  name: "parse() handles non-string input type",
  fn() {
    assertInvalidParse(
      // deno-lint-ignore no-explicit-any
      undefined as any,
      SyntaxError,
      'Cannot parse JSONC: unexpected token "undefined" in JSONC at position 0',
    );
    // deno-lint-ignore no-explicit-any
    assertValidParse(0 as any, 0);
  },
});

Deno.test({
  name: "parse() handles consecutive backslash",
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
  name: "parse() uses Object.defineProperty when setting object property",
  async fn() {
    // Tests if the value is set using `Object.defineProperty(target, key, {value})`
    // instead of `target[key] = value` when parsing the object.
    // This makes a difference in behavior when __proto__ is set in Node.js and browsers.
    // Using `Object.defineProperty` avoids prototype pollution in Node.js and browsers.
    // reference: https://github.com/advisories/GHSA-9c47-m6qq-7p4h (CVE-2022-46175)

    const testCode = `
      Object.defineProperty(Object.prototype, "__proto__", {
        set() {
          throw new Error("Don't try to set the value directly to the key __proto__.")
        }
      });
      import { parse } from "${import.meta.resolve("./parse.ts")}";
      parse('{"__proto__": {"isAdmin": true}}');
    `;
    const command = new Deno.Command(Deno.execPath(), {
      stdout: "inherit",
      stderr: "inherit",
      args: ["eval", "--no-lock", testCode],
    });
    const { success } = await command.output();
    assert(success);
  },
});

Deno.test({
  name: "new parse() throws error",
  fn() {
    assertThrows(
      // deno-lint-ignore no-explicit-any
      () => new (parse as any)(""),
      TypeError,
      "parse is not a constructor",
    );
  },
});

Deno.test("parse() handles lone continuation byte in key and tailing comma", () => {
  assertEquals(parse('{"�":"0",}'), { "�": "0" });
});
