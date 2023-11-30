// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import * as mod from "./mod.ts";
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertStrictEquals,
  assertThrows,
} from "../assert/mod.ts";

function assertValidParse(
  text: string,
  expected: unknown,
  options?: mod.ParseOptions,
) {
  assertEquals(mod.parse(text, options), expected);
}

function assertValidStringify(
  obj: unknown,
  expected: unknown,
  options?: mod.StringifyOptions,
) {
  assertEquals(mod.stringify(obj, options), expected);
}

function assertInvalidParse(
  text: string,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes?: string,
  options?: mod.ParseOptions,
) {
  assertThrows(
    () => mod.parse(text, options),
    ErrorClass,
    msgIncludes,
  );
}

Deno.test({
  name: "[ini] create and manage an IniMap",
  async fn({ step }) {
    const text = "#comment\nkeyA=1977-05-25\n[section1]\nkeyA=100";
    let ini = new mod.IniMap();

    await step({
      name: "[IniMap] set values",
      fn() {
        assertEquals(ini.size, 0);
        assertEquals(ini.set("section1", "keyA", null), ini);
        assertEquals(ini.set("keyA", true), ini);
        assertEquals(ini.set("section1", "keyA", 100), ini);
        assertEquals(ini.set("keyA", "1977-05-25"), ini);
        assertEquals(ini.size, 2);
      },
    });

    await step({
      name: "[IniMap] get values",
      fn() {
        assertEquals(ini.get("section1", "keyA"), 100);
        assertEquals(ini.get("keyA"), "1977-05-25");
      },
    });

    await step({
      name: "[IniMap] delete values",
      fn() {
        assertEquals(ini.delete("section1", "keyB"), false);
        assertEquals(ini.delete("keyB"), false);
        assertEquals(ini.delete("section1", "keyA"), true);
        assertEquals(ini.delete("keyA"), true);
      },
    });

    await step({
      name: "[IniMap] has values",
      fn() {
        assertEquals(ini.has("section1", "keyA"), false);
        assertEquals(ini.has("keyA"), false);
        ini.set("section1", "keyA", 100);
        ini.set("keyA", "1977-05-25");
        assertEquals(ini.has("section1", "keyA"), true);
        assertEquals(ini.has("keyA"), true);
      },
    });

    await step({
      name: "[IniMap] clear map",
      fn() {
        ini.clear("section1");
        assertEquals(ini.size, 1);
        assertEquals(ini.has("section1", "keyA"), false);
        ini.clear();
        assertEquals(ini.size, 0);
        assertEquals(ini.has("keyA"), false);
      },
    });

    await step({
      name: "[IniMap] entries",
      fn() {
        ini.set("section1", "keyA", 100);
        ini.set("keyA", "1977-05-25");
        assertObjectMatch(
          Array.from(ini.entries()),
          // deno-lint-ignore no-explicit-any
          [["keyA", "1977-05-25"], ["keyA", 100, "section1"]] as any,
        );
      },
    });

    await step({
      name: "[IniMap] parse INI string",
      fn() {
        ini = new mod.IniMap();
        ini.parse(text);
        assertEquals(ini.get("section1", "keyA"), "100");
        assertEquals(ini.get("keyA"), "1977-05-25");
        ini.clear();
        ini.parse(
          text,
          (key, val, sec) =>
            sec === "section1" && key === "keyA" ? Number(val) : val,
        );
        assertEquals(ini.get("section1", "keyA"), 100);
        assertEquals(ini.get("keyA"), "1977-05-25");
      },
    });

    await step({
      name: "[IniMap] convert to INI string",
      fn() {
        assertEquals(ini.toString(), text);
        assertEquals(
          ini.toString((key, val, sec) => key && sec ? "one hundred" : val),
          "#comment\nkeyA=1977-05-25\n[section1]\nkeyA=one hundred",
        );
      },
    });

    await step({
      name: "[IniMap] convert to object",
      fn() {
        assertObjectMatch(ini.toObject(), {
          keyA: "1977-05-25",
          section1: { keyA: 100 },
        });
      },
    });

    await step({
      name: "[IniMap] convert to JSON",
      fn() {
        assertEquals(
          JSON.stringify(ini),
          '{"keyA":"1977-05-25","section1":{"keyA":100}}',
        );
      },
    });

    await step({
      name: "[IniMap] create from",
      fn() {
        assertEquals(
          mod.IniMap.from("keyA=1977-05-25\n[section1]\nkeyA=100").toString(),
          mod.IniMap.from({
            keyA: "1977-05-25",
            section1: { keyA: 100 },
          }).toString(),
        );
      },
    });

    await step({
      name: "[IniMap] detect unambiguous formatting marks",
      fn() {
        assertObjectMatch(mod.IniMap.from("# comment\na = b").formatting, {
          comment: "#",
          lineBreak: "\n",
          pretty: true,
        });
        assertObjectMatch(mod.IniMap.from("; comment\ra=b").formatting, {
          comment: ";",
          lineBreak: "\r",
          pretty: false,
        });
        assertObjectMatch(mod.IniMap.from("// comment\r\na= b").formatting, {
          comment: "//",
          lineBreak: "\r\n",
          pretty: false,
        });
        assertObjectMatch(mod.IniMap.from("# comment\n\ra =b").formatting, {
          comment: "#",
          lineBreak: "\n\r",
          pretty: false,
        });
      },
    });

    await step({
      name: "[IniMap] manage comments",
      async fn({ step }) {
        ini = mod.IniMap.from({
          keyA: "1977-05-25",
          section1: { keyA: 100 },
        });

        await step({
          name: "[Comments] set comments",
          fn() {
            assertEquals(
              ini.comments.setAtLine(4, "# set comment 1"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtLine(6, "without formatting mark"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtKey("keyA", "# set comment 2"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtKey("section1", "keyA", "# set comment 3"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtSection("section1", "# set comment 4"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtLine(7, "# modified comment 1"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtKey("keyA", "# modified comment 2"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtKey("section1", "keyA", "# modified comment 3"),
              ini.comments,
            );
            assertEquals(
              ini.comments.setAtSection("section1", "# modified comment 4"),
              ini.comments,
            );
          },
        });

        await step({
          name: "[Comments] get comments",
          fn() {
            assertEquals(ini.comments.getAtLine(7), "# modified comment 1");
            assertEquals(ini.comments.getAtLine(8), "");
            assertEquals(
              ini.comments.getAtLine(9),
              "# without formatting mark",
            );
            assertEquals(ini.comments.getAtKey("keyA"), "# modified comment 2");
            assertEquals(
              ini.comments.getAtKey("section1", "keyA"),
              "# modified comment 3",
            );
            assertEquals(
              ini.comments.getAtSection("section1"),
              "# modified comment 4",
            );
          },
        });

        await step({
          name: "[Comments] delete comments",
          fn() {
            ini.comments.setAtLine(1, "# set comment 1");
            assertEquals(ini.comments.deleteAtLine(9), true);
            assertEquals(ini.comments.deleteAtLine(8), true);
            assertEquals(ini.comments.deleteAtLine(7), true);
            assertEquals(ini.comments.deleteAtKey("keyA"), true);
            assertEquals(ini.comments.deleteAtKey("section1", "keyA"), true);
            assertEquals(ini.comments.deleteAtSection("section1"), true);
            assertEquals(ini.comments.deleteAtLine(9), false);
            assertEquals(ini.comments.deleteAtLine(8), false);
            assertEquals(ini.comments.deleteAtLine(7), false);
            assertEquals(ini.comments.deleteAtKey("keyA"), false);
            assertEquals(ini.comments.deleteAtKey("section1", "keyA"), false);
            assertEquals(ini.comments.deleteAtSection("section1"), false);
            assertEquals(ini.comments.deleteAtKey("section1", "keyB"), false);
            assertEquals(ini.comments.deleteAtSection("section2"), false);
          },
        });

        await step({
          name: "[Comments] clear comments",
          fn() {
            ini.comments.setAtLine(1, "# set comment 1");
            ini.comments.setAtKey("section1", "keyA", "# set comment 2");
            ini.comments.setAtSection("section1", "# set comment 3");
            assertEquals(
              ini.toString(),
              "# set comment 1\nkeyA=1977-05-25\n# set comment 3\n[section1]\n# set comment 2\nkeyA=100",
            );
            ini.comments.clear();
            assertEquals(
              ini.toString(),
              "keyA=1977-05-25\n[section1]\nkeyA=100",
            );
          },
        });

        await step({
          name: "[Comments] preserve comments",
          fn() {
            const comment = "# comment";
            assertEquals(mod.IniMap.from(comment).toString(), comment);
          },
        });
      },
    });
  },
});

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
  name: "[ini] parse with comment",
  fn() {
    assertValidParse(`#comment\na=b`, { a: "b" });
    assertValidParse(`;comment\ra=b`, { a: "b" });
    assertValidParse(`//comment\n\ra=b`, { a: "b" });
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
    const ini = mod.parse("__proto__ = 100", {
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
    const ini = mod.parse("aaa=0\naaa=1", {
      reviver: (_, value) => Number(value),
    });
    assertEquals(ini, { aaa: 1 });
    assertEquals(ini, json);
    assertEquals(
      mod.IniMap.from("#comment\naaa=0\naaa=1", { deduplicate: true })
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
      import { parse } from "${import.meta.resolve("./mod.ts")}";
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
