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

    // ignore CR LF in base64 string
    assertEquals(
      parse(`message: !!binary |
  YWJjZGVmZ\r
  2hpamtsbW\r
  5vcHFyc3R\r
  1dnd4eXo=
`),
      {
        // deno-fmt-ignore
        message: new Uint8Array([97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122]),
      },
    );

    // check tailbits handling
    // 2 padding characters
    assertEquals(
      parse(`message: !!binary "AQ=="`),
      {
        message: new Uint8Array([1]),
      },
    );
    // 1 padding character
    assertEquals(
      parse(`message: !!binary "AQI="`),
      {
        message: new Uint8Array([1, 2]),
      },
    );
    // no padding character
    assertEquals(
      parse(`message: !!binary "AQID"`),
      {
        message: new Uint8Array([1, 2, 3]),
      },
    );

    // invalid base64 string
    assertThrows(
      () => parse("message: !!binary <>"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:binary> explicit tag at line 1, column 21:\n    message: !!binary <>\n                        ^",
    );

    // empty base64 string is error
    assertThrows(
      () => parse("message: !!binary"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:binary> explicit tag at line 2, column 1:\n    \n    ^",
    );
  },
});

Deno.test({
  name: "parse() handles boolean types",
  fn() {
    assertEquals(
      parse(`
        - true
        - True
        - TRUE
        - false
        - False
        - FALSE
      `),
      [true, true, true, false, false, false],
    );

    // if the boolean names are in strange casing, they become strings
    assertEquals(
      parse(`
        - TruE
        - tRue
        - FaLsE
        - fAlSe
      `),
      ["TruE", "tRue", "FaLsE", "fAlSe"],
    );

    // Yes, No, On, Off are not booleans in YAML 1.2
    assertEquals(
      parse(`
        - yes
        - Yes
        - YES
        - no
        - No
        - NO
        - on
        - On
        - ON
        - off
        - Off
        - OFF
      `),
      [
        "yes",
        "Yes",
        "YES",
        "no",
        "No",
        "NO",
        "on",
        "On",
        "ON",
        "off",
        "Off",
        "OFF",
      ],
    );
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
  name: "parse() handles integer types",
  fn() {
    assertEquals(
      parse(`
        - 0
        - 42
        - -42
        - 1_000
      `),
      [0, 42, -42, 1000],
    );

    // binary, octal, and hexadecimal
    assertEquals(
      parse(`
      - 0b1010
      - 0b1010_1010
      - 012
      - 012_34
      - 0x1A
      - 0x1A_2B
    `),
      [10, 170, 10, 668, 26, 6699],
    );

    // empty string is invalid integer
    assertThrows(
      () => parse('!!int ""'),
      YamlError,
      'cannot resolve a node with !<tag:yaml.org,2002:int> explicit tag at line 1, column 9:\n    !!int ""\n            ^',
    );

    // number can't start with _
    assertThrows(
      () => parse("!!int _42"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:int> explicit tag at line 2, column 1:\n    \n    ^",
    );
    // number can't end with _
    assertThrows(
      () => parse("!!int 42_"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:int> explicit tag at line 2, column 1:\n    \n    ^",
    );

    // invalid binary number
    assertThrows(
      () => parse("!!int 0b102"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:int> explicit tag at line 2, column 1:\n    \n    ^",
    );
    // invalid octal number
    assertThrows(
      () => parse("!!int 09"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:int> explicit tag at line 2, column 1:\n    \n    ^",
    );
    // invalid hexadecimal number
    assertThrows(
      () => parse("!!int 0x1G"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:int> explicit tag at line 2, column 1:\n    \n    ^",
    );
  },
});

Deno.test({
  name: "parse() handles timestamp types",
  fn() {
    assertEquals(
      parse(`
- 2001-12-15T02:59:43.1Z
- 2001-12-14t21:59:43.10-05:00
- 2001-12-14 21:59:43.10 -5
- 2002-12-14`),
      [
        new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
        new Date("2001-12-14T21:59:43.100-05:00"),
        new Date("2001-12-14T21:59:43.100-05:00"),
        new Date("2002-12-14"),
      ],
    );

    assertThrows(
      () => parse("- !!timestamp"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:timestamp> explicit tag at line 2, column 1:\n    \n    ^",
    );

    assertThrows(
      () => parse("- !!timestamp 1"),
      YamlError,
      "cannot resolve a node with !<tag:yaml.org,2002:timestamp> explicit tag at line 1, column 16:\n    - !!timestamp 1\n                   ^",
    );
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

Deno.test("parse() handles !!pairs type", () => {
  assertEquals(
    parse(`!!pairs
- Monday: 3
- Tuesday: 4`),
    [
      ["Monday", 3],
      ["Tuesday", 4],
    ],
  );
  // empty pairs
  assertEquals(
    parse(`!!pairs`),
    [],
  );
  // invalid pairs
  assertThrows(
    // pair is not an object
    () => parse(`!!pairs\n- 1`),
    YamlError,
    "cannot resolve a node with !<tag:yaml.org,2002:pairs> explicit tag",
  );
  assertThrows(
    // pair is object with multiple keys
    () => parse(`!!pairs\n- { Monday: 3, Tuesday: 4 }`),
    YamlError,
    "cannot resolve a node with !<tag:yaml.org,2002:pairs> explicit tag",
  );
});

Deno.test("parse() handles anchors and aliases", () => {
  assertEquals(
    parse(`- &anchor Foo
- *anchor`),
    ["Foo", "Foo"],
  );
  assertEquals(
    parse(`- &anchor 1
- *anchor`),
    [1, 1],
  );
  assertEquals(
    parse(`- &anchor { Monday: 3, Tuesday: 4 }
- *anchor`),
    [{ Monday: 3, Tuesday: 4 }, { Monday: 3, Tuesday: 4 }],
  );
  assertEquals(
    parse(`- &anchor
  Monday: 3
  Tuesday: 4
- <<: *anchor
  Wednesday: 5`),
    [
      { Monday: 3, Tuesday: 4 },
      { Monday: 3, Tuesday: 4, Wednesday: 5 },
    ],
  );
  assertEquals(
    parse(`- &anchor !!binary "SGVsbG8="
- *anchor`),
    [
      new Uint8Array([72, 101, 108, 108, 111]),
      new Uint8Array([72, 101, 108, 108, 111]),
    ],
  );
  assertThrows(
    () =>
      parse(`- &anchor Foo
- *anchor2`),
    YamlError,
    'unidentified alias "anchor2" at line 2, column 11:\n    - *anchor2\n              ^',
  );
  assertThrows(
    () =>
      parse(`- &anchor Foo
- *`),
    YamlError,
    "name of an alias node must contain at least one character at line 2, column 4:\n    - *\n       ^",
  );
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

Deno.test("parse() handles single quoted scalar", () => {
  assertEquals(parse("'bar'"), "bar");
  // escaped single quote
  assertEquals(parse("'''bar'''"), "'bar'");
  // line break in single quoted scalar
  assertEquals(parse("'foo\nbar'"), "foo bar");

  assertThrows(
    // document end in single quoted scalar
    () => parse("'bar\n"),
    YamlError,
    "unexpected end of the stream within a single quoted scalar at line 2, column 1:\n    \n    ^",
  );

  assertThrows(
    // document separator appears in single quoted scalar
    () => parse("'bar\n..."),
    YamlError,
    "unexpected end of the document within a single quoted scalar at line 2, column 1:\n    ...\n    ^",
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

Deno.test("parse() handles complex mapping key", () => {
  assertEquals(
    parse(`? - Detroit Tigers
  - Chicago cubs
: - 2001-07-23

? [ New York Yankees,
    Atlanta Braves ]
: [ 2001-07-02, 2001-08-12,
    2001-08-14 ]`),
    {
      "Detroit Tigers,Chicago cubs": [new Date("2001-07-23")],
      "New York Yankees,Atlanta Braves": [
        new Date("2001-07-02"),
        new Date("2001-08-12"),
        new Date("2001-08-14"),
      ],
    },
  );

  // Nested array as key is not supported
  assertThrows(
    () =>
      parse(`? - [ foo ]
: bar`),
    YamlError,
    "nested arrays are not supported inside keys at line 2, column 6:\n    : bar\n         ^",
  );

  assertEquals(
    parse(`? - { foo: bar }
: baz`),
    { "[object Object]": "baz" },
  );

  assertEquals(
    parse(`? { foo: bar }
: baz`),
    { "[object Object]": "baz" },
  );
});

Deno.test("parse() handles unordered set", () => {
  assertEquals(
    parse(`--- !!set
? Mark McGwire
? Sammy Sosa
? Ken Griffey`),
    { "Mark McGwire": null, "Sammy Sosa": null, "Ken Griffey": null },
  );
});

Deno.test("parse() throws with empty mapping key", () => {
  assertThrows(
    () => parse(`? : 1`),
    YamlError,
    "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line at line 1, column 3:\n    ? : 1\n      ^",
  );
});

Deno.test("parse() throws on duplicate keys", () => {
  assertThrows(
    () =>
      parse(
        `name: John Doe
age: 30
name: Jane Doe`,
      ),
    YamlError,
    "duplicated mapping key at line 3, column 1:\n    name: Jane Doe\n    ^",
  );
});

Deno.test("parse() allows duplicate keys when `allowDuplicateKeys` option is set to `true`", () => {
  assertEquals(
    parse(
      `name: John Doe
age: 30
name: Jane Doe`,
      { allowDuplicateKeys: true },
    ),
    { name: "Jane Doe", age: 30 },
  );
});
