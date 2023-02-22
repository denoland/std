// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import * as INI from "./ini.ts";
import {
  assert,
  assertEquals,
  assertObjectMatch,
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
      { a: "b", section: { c: "d" }, e: "f" },
      `a=b\ne=f\n[section]\nc=d`,
    );
    assertValidStringify(
      { dates: { a: new Date("1977-05-25") } },
      `[dates]\na=1977-05-25T00:00:00.000Z`,
      { replacer: (_, val) => val?.toJSON() },
    );
  },
});

Deno.test({
  name: "[ini] create and manage an IniMap",
  async fn({ step }) {
    const ini = new INI.IniMap();

    await step({
      name: "[IniMap] get and set values",
      fn() {
        assertEquals(ini.size, 0);
        assertEquals(ini.get("keyA"), undefined);
        assertEquals(ini.get("section1", "keyA"), undefined);

        ini.set("section1", "keyA", null).set("keyA", "1977-05-25");

        assertEquals(ini.size, 2);
        assertEquals(ini.get("keyA"), "1977-05-25");
        assertEquals(ini.get("section1", "keyA"), null);

        ini.set("section1", "keyA", 100);

        assertEquals(ini.get("section1", "keyA"), 100);
        assertEquals(ini.toString(), "keyA=1977-05-25\n[section1]\nkeyA=100");
        assertObjectMatch(
          Array.from(ini.entries()),
          // deno-lint-ignore no-explicit-any
          [["keyA", "1977-05-25"], ["keyA", 100, "section1"]] as any,
        );
      },
    });

    await step({
      name: "[IniMap] has and delete values",
      fn() {
        assertEquals(ini.delete("section1", "keyA"), true);
        assertEquals(ini.delete("section1", "keyA"), false);
        assertEquals(ini.toString(), "keyA=1977-05-25\n[section1]");

        ini.clear("section1");

        assertEquals(ini.size, 1);
        assertEquals(ini.has("keyA"), true);
        assertEquals(ini.has("keyB"), false);
        assertEquals(ini.toString(), "keyA=1977-05-25");

        ini.set("section2", "keyC", null);
        ini.set("keyB", 42);
        ini.set("section1", "keyB", 42);
        ini.set("section2", "keyD", null);

        assertEquals(ini.has("keyB"), true);
        assertEquals(ini.has("section1", "keyB"), true);
        assertEquals(ini.has("section3", "keyB"), false);
        assertEquals(ini.delete("keyB"), true);
        assertEquals(ini.delete("section1", "keyB"), true);
        assertEquals(ini.delete("keyB"), false);
        assertEquals(ini.delete("section1", "keyB"), false);
      },
    });

    await step({
      name: "[IniMap] clear map",
      fn() {
        ini.clear();

        assertEquals(ini.size, 0);
        assertEquals(ini.has("keyA"), false);
        assertEquals(ini.toString(), "");
      },
    });

    await step({
      name: "[IniMap] convert map to JSON",
      fn() {
        ini.clear();
        ini.set("section1", "key1", null);

        assertEquals(JSON.stringify(ini), '{"section1":{"key1":null}}');
      },
    });

    await step({
      name: "[IniMap] detect unambiguous formatting marks",
      fn() {
        assertObjectMatch(INI.IniMap.parse("# comment\na = b").formatting, {
          comment: "#",
          lineBreak: "\n",
          pretty: true,
        });
        assertObjectMatch(INI.IniMap.parse("; comment\ra=b").formatting, {
          comment: ";",
          lineBreak: "\r",
          pretty: false,
        });
        assertObjectMatch(INI.IniMap.parse("// comment\r\na= b").formatting, {
          comment: "//",
          lineBreak: "\r\n",
          pretty: false,
        });
        assertObjectMatch(INI.IniMap.parse("# comment\n\ra =b").formatting, {
          comment: "#",
          lineBreak: "\n\r",
          pretty: false,
        });
      },
    });
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
  name: "[ini] get and set comments",
  fn() {
    const ini = INI.IniMap.parse("a=b");

    assertEquals(ini.comments.getAtKey("a"), undefined);
    ini.comments.setAtKey("a", "# added comment 1");
    assertEquals(ini.comments.getAtKey("a"), "# added comment 1");
    ini.comments.setAtKey("a", "# modified comment 1");
    assertEquals(ini.comments.getAtKey("a"), "# modified comment 1");
    ini.set("section1", "c", "d");
    ini.comments.setAtSection("section1", "added comment 2");
    assertEquals(ini.comments.getAtSection("section1"), "# added comment 2");
    ini.comments.setAtSection("section1", "modified comment 2");
    assertEquals(ini.comments.getAtSection("section1"), "# modified comment 2");
    ini.comments.setAtKey("section1", "c", "# added comment 3");
    assertEquals(ini.comments.getAtKey("section1", "c"), "# added comment 3");
    ini.comments.setAtKey("section1", "c", "# modified comment 3");
    assertEquals(
      ini.comments.getAtKey("section1", "c"),
      "# modified comment 3",
    );

    const line = ini.size + 8;

    ini.comments.setAtLine(line, "added comment 4");
    assertEquals(ini.comments.getAtLine(line), "# added comment 4");
    ini.comments.setAtLine(line, "modified comment 4");
    assertEquals(ini.comments.getAtLine(line), "# modified comment 4");

    const expected = "# modified comment 1\na=b\n# modified comment 2\n" +
      "[section1]\n# modified comment 3\nc=d\n\n\n\n# modified comment 4";

    assertEquals(ini.toString(), expected);
    assertEquals(ini.comments.deleteAtLine(line), true);
    assertEquals(ini.comments.deleteAtLine(line), false);
    assertEquals(ini.comments.deleteAtKey("a"), true);
    assertEquals(ini.comments.deleteAtKey("a"), false);
    assertEquals(ini.comments.deleteAtKey("b"), false);
    assertEquals(ini.comments.deleteAtSection("section1"), true);
    assertEquals(ini.comments.deleteAtSection("section1"), false);
    assertEquals(ini.comments.deleteAtSection("section2"), false);
    assertEquals(ini.comments.deleteAtKey("section1", "c"), true);
    assertEquals(ini.comments.deleteAtKey("section1", "c"), false);
    assertEquals(ini.toString(), "a=b\n[section1]\nc=d\n\n\n");
    ini.comments.clear();
    assertEquals(ini.toString(), "a=b\n[section1]\nc=d");
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
    assertEquals(
      INI.IniMap.parse("#comment\naaa=0\naaa=1", { deduplicate: true })
        .toString(),
      "#comment\naaa=1",
    );
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
