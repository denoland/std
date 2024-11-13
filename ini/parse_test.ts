// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { parse, type ParseOptions } from "./mod.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "@std/assert";

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
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes?: string,
  options?: ParseOptions,
) {
  assertThrows(
    () => parse(text, options),
    ErrorClass,
    msgIncludes,
  );
}

Deno.test({
  name: "parse()",
  fn() {
    assertValidParse(`a=100`, { a: 100 }, {
      reviver: (_, value) => Number(value),
    });
    assertValidParse(`a=b\n[section]\nc=d`, { a: "b", section: { c: "d" } });
    assertValidParse('value="value"', { value: "value" });
    assertValidParse('#comment\nkeyA=1977-05-25\n[section1]\nkeyA="100"', {
      keyA: "1977-05-25",
      section1: { keyA: "100" },
    });
  },
});

Deno.test({
  name: "parse() with comment",
  fn() {
    assertValidParse(`#comment\na=b`, { a: "b" });
    assertValidParse(`;comment\ra=b`, { a: "b" });
    assertValidParse(`//comment\n\ra=b`, { a: "b" });
  },
});

Deno.test({
  name: "parse() special character",
  fn() {
    assertValidParse(`a=👪`, { a: "👪" });
    assertValidParse(`a=🦕`, { a: "🦕" });
    assertValidParse(
      `a=\u543e\u8f29\u306f\u732b\u3067\u3042\u308b\u3002`,
      { a: "\u543e\u8f29\u306f\u732b\u3067\u3042\u308b\u3002" },
    );
  },
});

Deno.test({
  name: "parse() throws error with correct messages",
  fn() {
    assertInvalidParse(
      `:::::`,
      SyntaxError,
      "Unexpected token : in INI at line 1",
    );
    assertInvalidParse(
      `[`,
      SyntaxError,
      "Unexpected end of INI section at line 1",
    );
    assertInvalidParse(
      `[]`,
      SyntaxError,
      "Unexpected empty section name at line 1",
    );
    assertInvalidParse(
      `=100`,
      SyntaxError,
      "Unexpected empty key name at line 1",
    );
  },
});

Deno.test({
  name: "parse() handles __proto__",
  fn() {
    // The result of JSON.parse and the result of INI.parse should match
    const json = JSON.parse('{"__proto__": 100}');
    const ini = parse("__proto__ = 100", {
      reviver: (key, value) => {
        if (key === "__proto__") return Number(value);
      },
    });
    assertEquals(ini, json);
    assertEquals((ini as Record<string, number>).__proto__, 100);
    assertEquals((ini as Record<string, undefined>).__proto__, json.__proto__);
    assertStrictEquals(Object.getPrototypeOf(ini), Object.prototype);
    assertStrictEquals(
      Object.getPrototypeOf(ini),
      Object.getPrototypeOf(json),
    );
  },
});

Deno.test({
  name: "parse() duplicates object key",
  fn() {
    // The result of JSON.parse and the result of INI.parse should match
    const json = JSON.parse('{"aaa": 0, "aaa": 1}');
    const ini = parse("aaa=0\naaa=1", {
      reviver: (_, value) => Number(value),
    });
    assertEquals(ini, { aaa: 1 });
    assertEquals(ini, json);
  },
});

Deno.test({
  name: "parse() does not parse other than strings",
  fn() {
    assertInvalidParse(
      // deno-lint-ignore no-explicit-any
      undefined as any,
      SyntaxError,
      "Unexpected token undefined in INI at line 0",
    );
    assertInvalidParse(
      // deno-lint-ignore no-explicit-any
      0 as any,
      SyntaxError,
      "Unexpected token 0 in INI at line 0",
    );
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
      parse('[__proto__]\\nisAdmin = true');
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
  name: "parse() return value as number",
  fn() {
    assertEquals(parse("value=123"), { value: 123 });
    assertEquals(parse("value=1e3"), { value: 1000 });
  },
});

Deno.test({
  name: "parse() correctly parse number with special characters ",
  fn() {
    assertEquals(parse("value=123foo"), { value: "123foo" });
    assertEquals(parse('value="1e3"'), { value: "1e3" });
  },
});

Deno.test({
  name: "parse() return value as null",
  fn() {
    assertEquals(parse("value=null"), { value: null });
  },
});

Deno.test({
  name: "parse() correctly parse booleans",
  fn() {
    assertEquals(parse("value=true"), { value: true });
    assertEquals(parse("value=false"), { value: false });
  },
});
