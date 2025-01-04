// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { stringify } from "./stringify.ts";
import { compare, parse } from "@std/semver";

Deno.test({
  name: "stringify()",
  fn() {
    const FIXTURE = {
      foo: {
        bar: true,
        test: [
          "a",
          "b",
          {
            a: false,
          },
          {
            a: false,
          },
        ],
      },
      test: "foobar",
      binary: new Uint8Array([72, 101, 108, 108, 111]),
    };

    const ASSERTS = `foo:
  bar: true
  test:
    - a
    - b
    - a: false
    - a: false
test: foobar
binary: !<tag:yaml.org,2002:binary> SGVsbG8=
`;

    assertEquals(stringify(FIXTURE), ASSERTS);
  },
});

Deno.test({
  name: "arrays can be stringified directly",
  fn() {
    const array = [1, 2, 3];

    const expected = "- 1\n- 2\n- 3\n";

    assertEquals(stringify(array), expected);
  },
});

Deno.test({
  name: "strings can be stringified directly",
  fn() {
    const string = "Hello world";

    const expected = "Hello world\n";

    assertEquals(stringify(string), expected);
  },
});

Deno.test({
  name: "numbers can be stringified directly",
  fn() {
    const number = 1.01;

    const expected = "1.01\n";

    assertEquals(stringify(number), expected);
  },
});

Deno.test({
  name: "stringify() handles integers",
  fn() {
    assertEquals(stringify(42), "42\n");
    assertEquals(stringify(-42), "-42\n");

    assertEquals(stringify(new Number(42)), "42\n");
    assertEquals(stringify(new Number(-42)), "-42\n");
  },
});
Deno.test({
  name: "stringify() handles integers with styles option",
  fn() {
    // binary, octal, and hexadecimal can be specified in styles options
    assertEquals(
      stringify(42, { styles: { "!!int": "binary" } }),
      "0b101010\n",
    );
    assertEquals(
      stringify(-42, { styles: { "!!int": "binary" } }),
      "-0b101010\n",
    );
    assertEquals(
      stringify(new Number(42), { styles: { "!!int": "binary" } }),
      "0b101010\n",
    );
    assertEquals(
      stringify(42, { styles: { "!!int": "octal" } }),
      "052\n",
    );
    assertEquals(
      stringify(-42, { styles: { "!!int": "octal" } }),
      "-052\n",
    );
    assertEquals(
      stringify(new Number(42), { styles: { "!!int": "octal" } }),
      "052\n",
    );
    assertEquals(
      stringify(42, { styles: { "!!int": "hexadecimal" } }),
      "0x2A\n",
    );
    assertEquals(
      stringify(-42, { styles: { "!!int": "hexadecimal" } }),
      "-0x2A\n",
    );
    assertEquals(
      stringify(new Number(42), { styles: { "!!int": "hexadecimal" } }),
      "0x2A\n",
    );
    assertThrows(
      () => stringify(42, { styles: { "!!int": "camelcase" } }),
      TypeError,
      '!<tag:yaml.org,2002:int> tag resolver accepts not "camelcase" style',
    );
  },
});

Deno.test({
  name: "stringify() handles boolean values",
  fn() {
    assertEquals(stringify(true), "true\n");
    assertEquals(stringify(false), "false\n");

    assertEquals(stringify(new Boolean(true)), "true\n");
    assertEquals(stringify(new Boolean(false)), "false\n");
  },
});
Deno.test({
  name: "stringify() handles boolean with styles option",
  fn() {
    assertEquals(
      stringify(true, { styles: { "!!bool": "camelcase" } }),
      "True\n",
    );
    assertEquals(
      stringify(false, { styles: { "!!bool": "camelcase" } }),
      "False\n",
    );
    assertEquals(
      stringify(new Boolean(true), { styles: { "!!bool": "camelcase" } }),
      "True\n",
    );
    assertEquals(
      stringify(true, { styles: { "!!bool": "uppercase" } }),
      "TRUE\n",
    );
    assertEquals(
      stringify(false, { styles: { "!!bool": "uppercase" } }),
      "FALSE\n",
    );
    assertEquals(
      stringify(new Boolean(true), { styles: { "!!bool": "uppercase" } }),
      "TRUE\n",
    );
    assertThrows(
      () => stringify(true, { styles: { "!!bool": "octal" } }),
      TypeError,
      '!<tag:yaml.org,2002:bool> tag resolver accepts not "octal" style',
    );
    assertThrows(
      () => stringify(false, { styles: { "!!bool": "octal" } }),
      TypeError,
      '!<tag:yaml.org,2002:bool> tag resolver accepts not "octal" style',
    );
  },
});

Deno.test({
  name: "stringify() serializes Uint8Array as !!binary",
  fn() {
    assertEquals(
      stringify(new Uint8Array([1])),
      "!<tag:yaml.org,2002:binary> AQ==\n",
    );
    assertEquals(
      stringify(new Uint8Array([1, 2])),
      "!<tag:yaml.org,2002:binary> AQI=\n",
    );
    assertEquals(
      stringify(new Uint8Array([1, 2, 3])),
      "!<tag:yaml.org,2002:binary> AQID\n",
    );
    assertEquals(
      stringify(new Uint8Array(Array(50).keys())),
      "!<tag:yaml.org,2002:binary> AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDE=\n",
    );
  },
});

Deno.test({
  name: "stringify() throws with `!!js/*` yaml types with default schemas",
  fn() {
    assertThrows(
      () => stringify(undefined),
      TypeError,
      "Cannot stringify undefined",
    );
    assertThrows(
      () => stringify(() => {}),
      TypeError,
      "Cannot stringify function",
    );
  },
});

Deno.test({
  name: "stringify() handles `!!js/*` yaml types with extended schema",
  fn() {
    const object = {
      regexp: {
        simple: /foobar/,
        modifiers: /foobar/im,
      },
      undefined: undefined,
    };

    const expected = `regexp:
  simple: !<tag:yaml.org,2002:js/regexp> /foobar/
  modifiers: !<tag:yaml.org,2002:js/regexp> /foobar/im
undefined: !<tag:yaml.org,2002:js/undefined> ''
`;

    assertEquals(stringify(object, { schema: "extended" }), expected);
  },
});

Deno.test({
  name:
    "stringify() throws with `!!js/function` yaml types with extended schema",
  fn() {
    const func = function foobar() {
      return "hello world!";
    };

    assertThrows(
      () => stringify({ function: func }, { schema: "extended" }),
    );
  },
});

Deno.test({
  name:
    "stringify() ignores `!!js/*` yaml types when skipInvalid option is true",
  fn() {
    assertEquals(
      stringify({ undefined: undefined }, { skipInvalid: true }),
      "{}\n",
    );
    assertEquals(
      stringify({
        foobar() {
          return "hello world!";
        },
      }, { skipInvalid: true }),
      "{}\n",
    );
  },
});

Deno.test({
  name: "stringify() handles float values",
  fn() {
    assertEquals(stringify(4.1), `4.1\n`);
    assertEquals(stringify(-1.473), `-1.473\n`);
    assertEquals(stringify(6.82e-5), `0.0000682\n`);
    assertEquals(stringify(6.82e-12), `6.82e-12\n`);
    assertEquals(stringify(5e-12), `5.e-12\n`);
    assertEquals(stringify(0.0), `0\n`);
    assertEquals(stringify(-0), `-0.0\n`);
    assertEquals(stringify(new Number(1.234)), `1.234\n`);
    assertEquals(stringify(new Number(-1.234)), `-1.234\n`);

    assertEquals(stringify(Infinity), `.inf\n`);
    assertEquals(stringify(-Infinity), `-.inf\n`);
    assertEquals(stringify(NaN), `.nan\n`);
  },
});
Deno.test({
  name: "stringify() handles float values with styles option",
  fn() {
    assertEquals(
      stringify(Infinity, {
        styles: { "tag:yaml.org,2002:float": "uppercase" },
      }),
      `.INF\n`,
    );
    assertEquals(
      stringify(-Infinity, {
        styles: { "tag:yaml.org,2002:float": "uppercase" },
      }),
      `-.INF\n`,
    );
    assertEquals(
      stringify(NaN, { styles: { "tag:yaml.org,2002:float": "uppercase" } }),
      `.NAN\n`,
    );
    assertEquals(
      stringify(Infinity, {
        styles: { "tag:yaml.org,2002:float": "camelcase" },
      }),
      `.Inf\n`,
    );
    assertEquals(
      stringify(-Infinity, {
        styles: { "tag:yaml.org,2002:float": "camelcase" },
      }),
      `-.Inf\n`,
    );
    assertEquals(
      stringify(NaN, { styles: { "tag:yaml.org,2002:float": "camelcase" } }),
      `.NaN\n`,
    );
  },
});

Deno.test({
  name: "stringify() encode string with special characters",
  fn() {
    assertEquals(stringify("\x03"), `"\\x03"\n`);
    assertEquals(stringify("\x08"), `"\\b"\n`);
    assertEquals(stringify("\uffff"), `"\\uFFFF"\n`);
    assertEquals(stringify("🐱"), `"\\U0001F431"\n`);
  },
});

Deno.test({
  name: "stringify() format Date objet into ISO string",
  fn() {
    assertEquals(
      stringify([new Date("2021-01-01T00:00:00.000Z")]),
      `- 2021-01-01T00:00:00.000Z\n`,
    );
  },
});

Deno.test({
  name: "stringify() works with useAnchors option",
  fn() {
    const obj = { foo: "bar" };
    assertEquals(
      stringify([obj, obj], { useAnchors: false }),
      `- foo: bar\n- foo: bar\n`,
    );
    assertEquals(
      stringify([obj, obj], { useAnchors: true }),
      `- &ref_0\n  foo: bar\n- *ref_0\n`,
    );
  },
});

Deno.test({
  name: "stringify() uses block scalar style for multiline strings",
  fn() {
    assertEquals(
      stringify("foo\nbar"),
      `|-
  foo
  bar
`,
    );
    assertEquals(
      stringify("foo  \nbar  "),
      `|-
  foo \x20
  bar \x20
`,
    );
  },
});

Deno.test({
  name: "stringify() uses folded scalar style for long strings",
  fn() {
    assertEquals(
      stringify(
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      ),
      `>-
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
  nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
  eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
  in culpa qui officia deserunt mollit anim id est laborum.
`,
    );
  },
});

Deno.test({
  name:
    "stringify() uses flow style for arrays and mappings when the nesting level exceeds flowLevel option value",
  fn() {
    assertEquals(
      stringify({ foo: ["bar", "baz"], bar: { hello: "world" } }, {
        flowLevel: 1,
      }),
      `foo: [bar, baz]
bar: {hello: world}
`,
    );

    const a = { foo: 42 };
    const b = [1, 2];
    const obj = { foo: [a, b], bar: { a, b } };
    assertEquals(
      stringify(obj, { flowLevel: 1 }),
      `foo: [&ref_0 {foo: 42}, &ref_1 [1, 2]]
bar: {a: *ref_0, b: *ref_1}
`,
    );
  },
});

Deno.test("stringify() handles indentation", () => {
  const object = {
    name: "John",
    age: 30,
    address: {
      street: "123 Main St",
      city: "Anytown",
      zip: 12345,
    },
    skills: ["JavaScript", "TypeScript", "Deno"],
  };

  const expected = `name: John
age: 30
address:
  street: 123 Main St
  city: Anytown
  zip: 12345
skills:
  - JavaScript
  - TypeScript
  - Deno
`;

  const actual = stringify(object);
  assertEquals(actual.trim(), expected.trim());
});

Deno.test("stringify() handles indentation with whitespace values", () => {
  const object = {
    name: "John",
    age: 30,
    address: {
      street: " 123 Main St ",
      city: "Anytown",
      zip: 12345,
    },
    skills: [" JavaScript ", "TypeScript", "Deno"],
  };

  const expected = `name: John
age: 30
address:
  street: ' 123 Main St '
  city: Anytown
  zip: 12345
skills:
  - ' JavaScript '
  - TypeScript
  - Deno
`;

  const actual = stringify(object);
  assertEquals(actual.trim(), expected.trim());
});

Deno.test("stringify() handles indentation with start newline values", () => {
  const object = {
    name: "John",
    age: 30,
    address: {
      street: "\n123 Main St",
      city: "Anytown",
      zip: 12345,
    },
    skills: ["\nJavaScript", "TypeScript", "Deno"],
  };

  const expected = `name: John
age: 30
address:
  street: |-\n\n    123 Main St
  city: Anytown
  zip: 12345
skills:
  - |-\n\n    JavaScript
  - TypeScript
  - Deno
`;

  const actual = stringify(object);
  assertEquals(actual.trim(), expected.trim());
});

Deno.test("stringify() handles indentation with trailing newline values", () => {
  const object = {
    name: "John",
    age: 30,
    address: {
      street: "123 Main St\n",
      city: "Anytown",
      zip: 12345,
    },
    skills: ["JavaScript\n", "TypeScript", "Deno"],
  };

  const expected = `name: John
age: 30
address:
  street: |\n    123 Main St
  city: Anytown
  zip: 12345
skills:
  - |\n    JavaScript
  - TypeScript
  - Deno
`;

  const actual = stringify(object);
  assertEquals(actual.trim(), expected.trim());
});

Deno.test(
  "stringify() changes indentation style for arrays when arrayIndent = false is specified",
  () => {
    const object = {
      name: "John",
      age: 30,
      address: {
        street: "123 Main St",
        city: "Anytown",
        zip: 12345,
      },
      skills: ["JavaScript", "TypeScript", "Deno"],
    };

    assertEquals(
      stringify(object, { arrayIndent: false }),
      `name: John
age: 30
address:
  street: 123 Main St
  city: Anytown
  zip: 12345
skills:
- JavaScript
- TypeScript
- Deno
`,
    );
  },
);

Deno.test("stringify() changes the key order when the sortKeys option is specified", () => {
  const object = {
    "1.0.0": null,
    "0.0.0-0": null,
    "0.0.0": null,
    "1.0.2": null,
    "1.0.10": null,
  };
  assertEquals(
    stringify(object),
    `1.0.0: null
0.0.0-0: null
0.0.0: null
1.0.2: null
1.0.10: null
`,
  );
  // When sortKeys is true, keys are sorted in ASCII char order
  assertEquals(
    stringify(object, { sortKeys: true }),
    `0.0.0: null
0.0.0-0: null
1.0.0: null
1.0.10: null
1.0.2: null
`,
  );
  // When sortKeys is a function, keys are sorted by the return value of the function
  assertEquals(
    stringify(object, { sortKeys: (a, b) => compare(parse(a), parse(b)) }),
    `0.0.0-0: null
0.0.0: null
1.0.0: null
1.0.2: null
1.0.10: null
`,
  );

  assertThrows(
    () => stringify(object, { sortKeys: "true" as unknown as boolean }),
    TypeError,
    '"sortKeys" must be a boolean or a function: received string',
  );
});

Deno.test("stringify() changes line wrap behavior based on lineWidth option", () => {
  const object = {
    message:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  };

  assertEquals(
    stringify(object, { lineWidth: 40 }),
    `message: >-
  Lorem ipsum dolor sit amet, consectetur
  adipiscing elit, sed do eiusmod tempor
  incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis
  nostrud exercitation ullamco laboris
  nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit
  in voluptate velit esse cillum dolore eu
  fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in
  culpa qui officia deserunt mollit anim
  id est laborum.
`,
  );
  // default lineWidth is 80
  assertEquals(
    stringify(object),
    `message: >-
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
  nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
  eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
  in culpa qui officia deserunt mollit anim id est laborum.
`,
  );
  assertEquals(
    stringify(object, { lineWidth: 120 }),
    `message: >-
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
  aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
  occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
  );
  assertEquals(
    stringify(object, { lineWidth: Infinity }),
    "message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'\n",
  );
});

Deno.test("stringify() changes indentation with indent option", () => {
  const object = {
    name: "John",
    age: 30,
    address: {
      street: "123 Main St",
      city: "Anytown",
      zip: 12345,
    },
    skills: ["JavaScript", "TypeScript", "Deno"],
  };

  assertEquals(
    stringify(object, { indent: 4 }),
    `name: John
age: 30
address:
    street: 123 Main St
    city: Anytown
    zip: 12345
skills:
    - JavaScript
    - TypeScript
    - Deno
`,
  );

  assertEquals(
    stringify(object, { indent: 8 }),
    `name: John
age: 30
address:
        street: 123 Main St
        city: Anytown
        zip: 12345
skills:
        - JavaScript
        - TypeScript
        - Deno
`,
  );
});

Deno.test("stringify() handles nil", () => {
  assertEquals(stringify(null), "null\n");
  assertEquals(
    stringify(null, { styles: { "tag:yaml.org,2002:null": "lowercase" } }),
    "null\n",
  );
  assertEquals(
    stringify(null, { styles: { "tag:yaml.org,2002:null": "uppercase" } }),
    "NULL\n",
  );
  assertEquals(
    stringify(null, { styles: { "tag:yaml.org,2002:null": "camelcase" } }),
    "Null\n",
  );
});

Deno.test("stringify() handles sequence", () => {
  assertEquals(stringify([]), "[]\n");
  assertEquals(
    stringify(["Clark Evans", "Ingy döt Net", "Oren Ben-Kiki"]),
    `- Clark Evans
- Ingy döt Net
- Oren Ben-Kiki
`,
  );
});

Deno.test("stringify() handles mapping", () => {
  assertEquals(stringify({}), "{}\n");
  assertEquals(
    stringify({ Clark: "Evans", Ingy: "döt Net", Oren: "Ben-Kiki" }),
    `Clark: Evans
Ingy: döt Net
Oren: Ben-Kiki
`,
  );
});

Deno.test("stringify() handles string", () => {
  assertEquals(stringify("Hello World"), "Hello World\n");
  assertEquals(stringify(new String("Hello World")), "Hello World\n");
});

Deno.test("stringify() uses quotes around deprecated boolean notations when `compatMode: true`", () => {
  assertEquals(stringify("On", { compatMode: true }), "'On'\n");
  assertEquals(stringify("Off", { compatMode: true }), "'Off'\n");
  assertEquals(stringify("Yes", { compatMode: true }), "'Yes'\n");
  assertEquals(stringify("No", { compatMode: true }), "'No'\n");
});

Deno.test("stringify() handles undefined with skipInvalid option", () => {
  assertEquals(
    stringify(undefined, { skipInvalid: true }),
    "",
  );
});

Deno.test({
  name: "stringify() handles object with condenseFlow option",
  fn() {
    assertEquals(
      stringify({ foo: ["bar", "baz"], bar: { hello: "world" } }, {
        flowLevel: 1,
        condenseFlow: true,
      }),
      `foo: [bar,baz]\nbar: {"hello":world}\n`,
    );
  },
});

Deno.test("stringify() returns emtpy array on invalid entries", () => {
  assertEquals(
    stringify([undefined], { skipInvalid: true }),
    "[]\n",
  );
});

Deno.test("stringify() handles duplicate array references", () => {
  const a = ["foo"];
  assertEquals(
    stringify([a, a]),
    "- &ref_0\n  - foo\n- *ref_0\n",
  );
});

Deno.test({
  name:
    "stringify() handles undefined array entry with skipInvalid and flowLevel option",
  fn() {
    assertEquals(
      stringify({ foo: [undefined] }, {
        flowLevel: 1,
        skipInvalid: true,
      }),
      `foo: []\n`,
    );
  },
});

Deno.test({
  name:
    "stringify() handles undefined object entry with skipInvalid and flowLevel option",
  fn() {
    assertEquals(
      stringify({ foo: { bar: undefined } }, {
        flowLevel: 1,
        skipInvalid: true,
      }),
      `foo: {}\n`,
    );
  },
});

Deno.test({
  name:
    "stringify() handles undefined object entry with big key and skipInvalid and flowLevel option",
  fn() {
    const key = "a".repeat(1025);
    assertEquals(
      stringify({ [key]: { bar: undefined } }, {
        flowLevel: 1,
        skipInvalid: true,
      }),
      `? aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n: {}\n`,
    );
  },
});

Deno.test({
  name: "stringify() handles duplicate binary references",
  fn() {
    const a = new Uint8Array();
    assertEquals(
      stringify([a, a]),
      "- !<tag:yaml.org,2002:binary> AAAA\n- !<tag:yaml.org,2002:binary> AAAA\n",
    );
  },
});
