// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import * as INI from "./ini.ts";
import {
  assert,
  assertEquals,
  assertStrictEquals,
  assertThrows,
} from "../testing/asserts.ts";

function assertValidParse(
  text: string,
  expected: unknown,
  options?: INI.ParseOptions,
) {
  assertEquals(INI.parse(text, options), expected);
}

function assertValidStringify(
  obj: unknown,
  expected: unknown,
  options?: INI.StringifyOptions,
) {
  assertEquals(INI.stringify(obj, options), expected);
}

function assertInvalidParse(
  text: string,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes?: string,
  options?: INI.ParseOptions,
) {
  assertThrows(
    () => INI.parse(text, options),
    ErrorClass,
    msgIncludes,
  );
}

Deno.test({
  name: "[ini] parse",
  fn() {
    assertValidParse(`a=100`, { a: 100 }, {
      reviver: (_, value) => Number(value),
    });
    assertValidParse(`a=b\n[section]\nc=d`, { a: "b", section: { c: "d" } });
  },
});

Deno.test({
  name: "[ini] stringify",
  fn() {
    assertValidStringify({ a: "b" }, `a=b`);
    assertValidStringify({ a: "b" }, `a = b`, { pretty: true });
    assertValidStringify({ a: "b" }, `a : b`, {
      assignment: ":",
      pretty: true,
    });
    assertValidStringify(
      { a: "b", section: { c: "d" } },
      `a=b\n[section]\nc=d`,
    );
  },
});

Deno.test({
  name: "[ini] parse with comment",
  fn() {
    assertValidParse(`#comment\na=b`, { a: "b" });
    assertValidParse(`;comment\ra=b`, { a: "b" });
    assertValidParse(`//comment\n\ra=b`, { a: "b" });
  },
});

Deno.test({
  name: "[ini] preserve comments",
  fn() {
    const text = "#comment\na=b";
    const ini = INI.IniMap.parse(text);

    assertEquals(ini.toString(), text);
  },
});

Deno.test({
  name: "[ini] parse special character",
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
  name: "[ini] error message",
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
  name: "[ini] __proto__",
  fn() {
    // The result of JSON.parse and the result of INI.parse should match
    const json = JSON.parse('{"__proto__": 100}');
    const ini = INI.parse("__proto__ = 100", {
      reviver: (key, value) => {
        if (key === "__proto__") return Number(value);
      },
    });
    assertEquals(ini, json);
    assertEquals((ini as Record<string, number>).__proto__, 100);
    assertEquals((ini as Record<string, string>).__proto__, json.__proto__);
    assertStrictEquals(Object.getPrototypeOf(ini), Object.prototype);
    assertStrictEquals(
      Object.getPrototypeOf(ini),
      Object.getPrototypeOf(json),
    );
  },
});

Deno.test({
  name: "[ini] duplicate object key",
  fn() {
    // The result of JSON.parse and the result of INI.parse should match
    const json = JSON.parse('{"aaa": 0, "aaa": 1}');
    const ini = INI.parse("aaa=0\naaa=1", {
      reviver: (_, value) => Number(value),
    });
    assertEquals(ini, { aaa: 1 });
    assertEquals(ini, json);
  },
});

Deno.test({
  name: "[ini] does not parse other than strings",
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
  name: "[ini] use Object.defineProperty when setting object property",
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
      import { parse } from "${import.meta.resolve("./ini.ts")}";
      parse('[__proto__]\\nisAdmin = true');
    `;
    const command = new Deno.Command(Deno.execPath(), {
      stdout: "inherit",
      stderr: "inherit",
      args: ["eval", testCode],
    });
    const { success } = await command.output();
    assert(success);
  },
});
