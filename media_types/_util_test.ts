// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import {
  consumeMediaParam,
  consumeToken,
  consumeValue,
  decode2331Encoding,
  isIterator,
  isToken,
  isTSpecial,
} from "./_util.ts";

Deno.test({
  name: "consumeToken()",
  fn() {
    const fixtures = [
      ["foo bar", "foo", " bar"],
      ["bar", "bar", ""],
      ["", "", ""],
      [" foo", "", " foo"],
    ] as const;
    for (const [fixture, token, rest] of fixtures) {
      assertEquals(consumeToken(fixture), [token, rest]);
    }
  },
});

Deno.test({
  name: "consumeValue()",
  fn() {
    const fixtures = [
      ["", "", ""],
      [`"\n"foo`, "", `"\n"foo`],
      [`"\r"foo`, "", `"\r"foo`],
      [`"\\\\;"`, "\\;", ""],
      ["foo bar", "foo", " bar"],
      ["bar", "bar", ""],
      [" bar ", "", " bar "],
      [`"My value"end`, "My value", "end"],
      [`"My value" end`, "My value", " end"],
      [`"\\\\" rest`, "\\", " rest"],
      [`"My \\" value"end`, 'My " value', "end"],
      [`"\\" rest`, "", `"\\" rest`],
      [`"C:\\dev\\go\\robots.txt"`, `C:\\dev\\go\\robots.txt`, ""],
      [
        `"C:\\新建文件夹\\中文第二次测试.mp4"`,
        `C:\\新建文件夹\\中文第二次测试.mp4`,
        "",
      ],
    ] as const;
    for (const [fixture, value, rest] of fixtures) {
      assertEquals(consumeValue(fixture), [value, rest]);
    }
  },
});

Deno.test({
  name: "consumeMediaParam()",
  fn() {
    const fixtures = [
      ["", "", "", ""],
      ["foo=bar", "", "", "foo=bar"],
      [";", "", "", ";"],
      [";foo", "", "", ";foo"],
      [" ; foo=bar", "foo", "bar", ""],
      ["; foo=bar", "foo", "bar", ""],
      [";foo=bar", "foo", "bar", ""],
      [";FOO=bar", "foo", "bar", ""],
      [`;foo="bar"`, "foo", "bar", ""],
      [`;foo="bar"; `, "foo", "bar", "; "],
      [`;foo="bar"; foo=baz`, "foo", "bar", "; foo=baz"],
      [` ; boundary=----CUT;`, "boundary", "----CUT", ";"],
      [
        ` ; key=value;  blah="value";name="foo" `,
        "key",
        "value",
        `;  blah="value";name="foo" `,
      ],
      [`;  blah="value";name="foo" `, "blah", "value", `;name="foo" `],
      [`;name="foo" `, "name", "foo", ` `],
    ] as const;
    for (const [fixture, key, value, rest] of fixtures) {
      assertEquals(consumeMediaParam(fixture), [key, value, rest]);
    }
  },
});

Deno.test({
  name: "decode2331Encoding()",
  fn() {
    const fixtures = [
      ["", undefined],
      ["foo", undefined],
      [`foo'bar'baz`, undefined],
      [`us-ascii'en-us'`, undefined],
      [`us-ascii'en-us'This%20is%20%2A%2A%2Afun%2A%2A%2A`, "This is ***fun***"],
      [`UTF-8''foo-a%cc%88.html`, "foo-ä.html"],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(decode2331Encoding(fixture), expected);
    }
  },
});

Deno.test({
  name: "isIterator()",
  fn() {
    const fixtures = [
      [null, false],
      [undefined, false],
      [{}, false],
      ["", true],
      [[], true],
      [Object.entries({}), true],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(isIterator(fixture), expected);
    }
  },
});

Deno.test({
  name: "isToken()",
  fn() {
    const fixtures = [
      ["", false],
      [";", false],
      ["\\", false],
      ["foo", true],
    ] as const;
    for (const [fixture, expected] of fixtures) {
      assertEquals(isToken(fixture), expected);
    }
  },
});

Deno.test({
  name: "isTSpecial()",
  fn() {
    const fixtues = [
      ["", false],
      [` ()<>@,;:\\"/[]?=`, false],
      ["(", true],
      [")", true],
      ["<", true],
      [">", true],
      ["@", true],
      [",", true],
      [";", true],
      [":", true],
      ["\\", true],
      ['"', true],
      ["/", true],
      ["[", true],
      ["]", true],
      ["?", true],
      ["=", true],
      [" ", false],
      ["\t", false],
      ["\n", false],
      ["\r", false],
      ["\f", false],
      ["\v", false],
      ["foo", false],
    ] as const;
    for (const [fixture, expected] of fixtues) {
      assertEquals(isTSpecial(fixture), expected);
    }
  },
});
