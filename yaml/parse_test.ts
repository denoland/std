// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { parse, parseAll } from "./parse.ts";
import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertThrows,
} from "@std/assert";
import { YamlError } from "./_error.ts";
import { assertSpyCall, spy } from "@std/testing/mock";

Deno.test({
  name: "parse() handles single document yaml string",
  fn() {
    const yaml = `
      test: toto
      foo:
        bar: True
        baz: 1
        qux: ~
    `;

    const expected = { test: "toto", foo: { bar: true, baz: 1, qux: null } };

    assertEquals(parse(yaml), expected);
  },
});

Deno.test({
  name: "parseAll() handles yaml string with multiple documents",
  fn() {
    const yaml = `
---
id: 1
name: Alice
---
id: 2
name: Bob
---
id: 3
name: Eve
    `;
    const expected = [
      {
        id: 1,
        name: "Alice",
      },
      {
        id: 2,
        name: "Bob",
      },
      {
        id: 3,
        name: "Eve",
      },
    ];
    assertEquals(parseAll(yaml), expected);
  },
});

Deno.test({
  name: "parse() throws with `!!js/*` yaml types with default schemas",
  fn() {
    const yaml = `undefined: !!js/undefined ~`;
    assertThrows(() => parse(yaml), YamlError, "unknown tag !");
  },
});

Deno.test({
  name:
    "parse() handles `!!js/*` yaml types with extended schema while parsing",
  fn() {
    const yaml = `
      regexp:
        simple: !!js/regexp foobar
        modifiers: !!js/regexp /foobar/mi
      undefined: !!js/undefined ~
    `;

    const expected = {
      regexp: {
        simple: /foobar/,
        modifiers: /foobar/mi,
      },
      undefined: undefined,
    };

    assertEquals(parse(yaml, { schema: "extended" }), expected);
  },
});

Deno.test({
  name: "parse() throws with `!!js/function` yaml type with extended schema",
  fn() {
    const func = function foobar() {
      return "hello world!";
    };

    const yaml = `
function: !!js/function >
${func.toString().split("\n").map((line) => `  ${line}`).join("\n")}
`;

    assertThrows(() => parse(yaml, { schema: "extended" }));
  },
});

Deno.test({
  name: "parseAll() accepts parse options",
  fn() {
    const yaml = `
---
regexp: !!js/regexp foo
---
regexp: !!js/regexp bar
    `;

    const expected = [
      {
        regexp: /foo/,
      },
      {
        regexp: /bar/,
      },
    ];

    assertEquals(parseAll(yaml, { schema: "extended" }), expected);
  },
});

Deno.test({
  name: "parse() handles __proto__",
  async fn() {
    // Tests if the value is set using `Object.defineProperty(target, key, {value})`
    // instead of `target[key] = value` when parsing the object.
    // This makes a difference in behavior when __proto__ is set in Node.js and browsers.
    // Using `Object.defineProperty` avoids prototype pollution in Node.js and browsers.
    // reference: https://github.com/advisories/GHSA-9c47-m6qq-7p4h (CVE-2022-46175)

    const yaml1 = `
__proto__:
  isAdmin: true
    `;

    const yaml2 = `
anchor: &__proto__
  __proto__: 1111
alias_test:
  aaa: *__proto__
merge_test:
  bbb: 2222
  <<: *__proto__
    `;

    const testCode = `
      Object.defineProperty(Object.prototype, "__proto__", {
        set() {
          throw new Error("Don't try to set the value directly to the key __proto__.")
        }
      });
      import { parse } from "${import.meta.resolve("./parse.ts")}";
      parse(\`${yaml1}\`);
      parse(\`${yaml2}\`);
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
  name: "parse() returns `null` when yaml is empty or only comments",
  fn() {
    const expected = null;

    const yaml1 = ``;
    assertEquals(parse(yaml1), expected);
    const yaml2 = ` \n\n `;
    assertEquals(parse(yaml2), expected);
    const yaml3 = `# just a bunch of comments \n # in this file`;
    assertEquals(parse(yaml3), expected);
  },
});

Deno.test({
  name: "parse() handles binary type",
  fn() {
    const yaml = `message: !!binary "SGVsbG8="`;
    assertEquals(parse(yaml), {
      message: new Uint8Array([72, 101, 108, 108, 111]),
    });
  },
});

Deno.test({
  name: "parse() handles float types",
  fn() {
    const yaml = `
      - 3.14
      - -3.14
      - .inf
      - -.inf
      - .nan
      - 12e03
      - 1:15
      - 1:15:20
      - -1:15:20
      - !!float 12000
    `;

    assertEquals(parse(yaml), [
      3.14,
      -3.14,
      Infinity,
      -Infinity,
      NaN,
      12000,
      75,
      4520,
      -4520,
      12000,
    ]);
  },
});

Deno.test({
  name: "parse() handles omap type",
  fn() {
    const yaml = `--- !!omap
- Mark McGwire: 65
- Sammy Sosa: 63
- Ken Griffey: 58
`;
    assertEquals(parse(yaml), [
      { "Mark McGwire": 65 },
      { "Sammy Sosa": 63 },
      { "Ken Griffey": 58 },
    ]);

    // Invalid omap
    // map entry is not an object
    assertThrows(
      () => parse("--- !!omap\n- 1"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:omap> explicit tag",
    );
    // map entry is empty object
    assertThrows(
      () => parse("--- !!omap\n- {}"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:omap> explicit tag",
    );
    // map entry is an object with multiple keys
    assertThrows(
      () => parse("--- !!omap\n- foo: 1\n  bar: 2"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:omap> explicit tag",
    );
    // 2 map entries have the same key
    assertThrows(
      () => parse("--- !!omap\n- foo: 1\n- foo: 2"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:omap> explicit tag",
    );
  },
});

Deno.test("parse() handles escaped strings in double quotes", () => {
  assertEquals(parse('"\\"bar\\""'), '"bar"');
  assertEquals(parse('"\\x30\\x31"'), "01");
  assertEquals(parse('"\\\na"'), "a");
  assertEquals(parse('"\\x4a"'), "J");
  assertEquals(parse('"\\u0041"'), "A");
  assertEquals(parse('"\\U00000041"'), "A");
  assertEquals(parse('"\\U0001F431"'), "🐱");

  assertThrows(
    // invalid hex character
    () => parse('"\\xyz"'),
    YamlError,
    'expected hexadecimal character at line 1, column 4:\n    "\\xyz"\n       ^',
  );
  assertThrows(
    // invalid escape sequence
    () => parse('"\\X30"'),
    YamlError,
    'unknown escape sequence at line 1, column 3:\n    "\\X30"\n      ^',
  );
});

Deno.test("parse() handles %YAML directive", () => {
  assertEquals(
    parse(`%YAML 1.2
---
hello: world`),
    { hello: "world" },
  );
  // you can write comments after the directive
  assertEquals(
    parse(`%YAML 1.2 # comment
---
hello: world`),
    { hello: "world" },
  );

  assertThrows(
    () =>
      parse(`%YAML 1.2
%YAML 1.2
---
hello: world`),
    YamlError,
    "duplication of %YAML directive at line 3, column 1:\n    ---\n    ^",
  );
  assertThrows(
    () =>
      parse(`%YAML 1.2 1.1
---
hello: world`),
    YamlError,
    "YAML directive accepts exactly one argument at line 2, column 1:\n    ---\n    ^",
  );
  assertThrows(
    () =>
      parse(`%YAML 1.2.3
---
hello: world`),
    YamlError,
    "ill-formed argument of the YAML directive at line 2, column 1:\n    ---\n    ^",
  );
  assertThrows(
    () =>
      parse(`%YAML 2.0
---
hello: world`),
    YamlError,
    "unacceptable YAML version of the document at line 2, column 1:\n    ---\n    ^",
  );
  assertEquals(
    // The future 1.x version is acceptable
    parse(`%YAML 1.3
---
hello: world`),
    { hello: "world" },
  );

  {
    const warningSpy = spy();
    assertEquals(
      parse(
        `%YAML 1.3
---
hello: world`,
        { onWarning: warningSpy },
      ),
      { hello: "world" },
    );
    assertSpyCall(warningSpy, 0);
    const warning = warningSpy.calls[0]?.args[0];
    assertEquals(
      warning.message,
      "unsupported YAML version of the document at line 2, column 1:\n    ---\n    ^",
    );
    assertInstanceOf(warning, YamlError);
  }
});

Deno.test("parse() handles %TAG directive", () => {
  assertEquals(
    parse(`%TAG ! tag:example.com,2000:
---
hello: world`),
    { hello: "world" },
  );

  assertThrows(
    () =>
      parse(`%TAG !
---
hello: world`),
    YamlError,
    "TAG directive accepts exactly two arguments at line 2, column 1:\n    ---\n    ^",
  );

  assertThrows(
    () =>
      parse(`%TAG abc tag:example.com,2000:
---
hello: world`),
    YamlError,
    "ill-formed tag handle (first argument) of the TAG directive at line 2, column 1:\n    ---\n    ^",
  );

  assertThrows(
    () =>
      parse(`%TAG ! tag:example.com,2000:
%TAG ! tag:example.com,2000:
---
hello: world`),
    YamlError,
    'there is a previously declared suffix for "!" tag handle at line 3, column 1:\n    ---\n    ^',
  );

  assertThrows(
    () =>
      parse(`%TAG ! ,:
---
hello: world`),
    YamlError,
    "ill-formed tag prefix (second argument) of the TAG directive at line 2, column 1:\n    ---\n    ^",
  );
});

Deno.test("parse() throws with invalid strings", () => {
  assertThrows(() => parse(`"`), YamlError, "unexpected end of the stream");
  assertThrows(
    () => parse(`"\x08"`),
    YamlError,
    'expected valid JSON character at line 1, column 3:\n    "\b"\n      ^',
  );
  // non-printable char in block scalar
  assertThrows(
    () => parse(`foo: |\n  \x08`),
    YamlError,
    "the stream contains non-printable characters at line 2, column 4:\n      \b\n       ^",
  );
});

Deno.test("parse() handles merge (<<) types", () => {
  assertEquals(
    parse(`<<: { a: 1, b: 2 }
c: 3`),
    { a: 1, b: 2, c: 3 },
  );

  assertThrows(
    () =>
      // number can't be used as merge value
      parse(`<<: 1
c: 3`),
    YamlError,
    "cannot merge mappings; the provided source object is unacceptable at line 1, column 6:\n    <<: 1\n         ^",
  );
});

// 8.1. Block Scalar Styles
// https://yaml.org/spec/1.2.2/#81-block-scalar-styles
Deno.test("parse() handles block scalars", () => {
  assertEquals(
    parse(`foo: |
  bar`),
    { foo: "bar\n" },
  );
  assertEquals(
    parse(`foo: |
  bar

  bar`),
    { foo: "bar\n\nbar\n" },
  );
  assertEquals(
    parse(`foo: |+
  bar`),
    { foo: "bar\n" },
  );
  assertEquals(
    parse(`foo: |+
bar: baz`),
    { foo: "", bar: "baz" },
  );
  assertEquals(
    parse(`foo: |-
  bar`),
    { foo: "bar" },
  );
  assertThrows(
    () => parse(`foo: |++\n  bar`),
    YamlError,
    "repeat of a chomping mode identifier at line 1, column 8:\n    foo: |++\n           ^",
  );
  assertEquals(
    parse(`foo: |1
  bar`),
    { foo: " bar\n" },
  );
  assertEquals(
    parse(`foo: |

  bar`),
    { foo: "\nbar\n" },
  );
  assertEquals(
    parse(`foo: | \n  bar`),
    { foo: "bar\n" },
  );
  assertEquals(
    parse(`foo: | # comment\n  bar`),
    { foo: "bar\n" },
  );
  assertThrows(
    () => parse(`foo: |0\n  bar`),
    YamlError,
    "bad explicit indentation width of a block scalar; it cannot be less than one at line 1, column 7:\n    foo: |0\n          ^",
  );
  assertThrows(
    () => parse(`foo: |11\n  bar`),
    YamlError,
    "repeat of an indentation width identifier at line 1, column 8:\n    foo: |11\n           ^",
  );

  // folding style (>)
  assertEquals(parse(`foo: >1\n  bar`), { foo: " bar\n" });
  assertEquals(
    parse(`foo: >

  a
  b

  c
    - d
    - e

  f
  g

  `),
    { foo: "\na b\nc\n  - d\n  - e\n\nf g\n" },
  );
});

Deno.test("parse() handles BOM at the beginning of the yaml", () => {
  const yaml = "\uFEFFhello: world";
  assertEquals(parse(yaml), { hello: "world" });
});

Deno.test("parse() throws if there are more than one document in the yaml", () => {
  assertThrows(
    () => parse("hello: world\n---\nfoo: bar"),
    YamlError,
    "expected a single document in the stream, but found more",
  );
});

Deno.test("parse() throws when the directive name is empty", () => {
  assertThrows(
    () =>
      parse(`% 1.2
---
hello: world`),
    YamlError,
    "directive name must not be less than one character in length at line 1, column 2:\n    % 1.2\n     ^",
  );
});

Deno.test("parse() ignores unknown directive", () => {
  assertEquals(
    parse(`%FOOBAR 1.2
---
hello: world`),
    { hello: "world" },
  );
});

Deno.test("parse() handles document separator", () => {
  assertEquals(
    parse(`---
hello: world
...`),
    { hello: "world" },
  );
});

Deno.test("parse() show warning with non-ascii line breaks if YAML version is < 1.2", () => {
  const warningSpy = spy();
  assertEquals(
    parse(
      `%YAML 1.1
---
hello: world\r\nfoo: bar\x85`,
      { onWarning: warningSpy },
    ),
    { hello: "world", foo: "bar\x85" },
  );
  assertSpyCall(warningSpy, 0);
  const warning = warningSpy.calls[0]?.args[0];
  assertEquals(
    warning.message,
    "non-ASCII line breaks are interpreted as content at line 5, column 1:\n    \n    ^",
  );
});

Deno.test("parse() throws with directive only document", () => {
  assertThrows(
    () => parse(`%YAML 1.2`),
    YamlError,
    "directives end mark is expected at line 2, column 1:\n    \n    ^",
  );
});

Deno.test("parse() throws with \0 in the middle of the document", () => {
  assertThrows(
    () => parse("hello: \0 world"),
    YamlError,
    "end of the stream or a document separator is expected at line 1, column 8:\n    hello: \n           ^",
  );
});
