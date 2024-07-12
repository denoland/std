// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { stringify } from "./stringify.ts";
import { YamlError } from "./_error.ts";

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
  name: "stringify() serializes integers",
  fn() {
    assertEquals(stringify(42), "42\n");
    assertEquals(stringify(-42), "-42\n");

    // binary, octal, and hexadecimal can be specified in styles options
    assertEquals(
      stringify(42, { styles: { "!!int": "binary" } }),
      "0b101010\n",
    );
    assertEquals(
      stringify(42, { styles: { "!!int": "octal" } }),
      "052\n",
    );
    assertEquals(
      stringify(42, { styles: { "!!int": "hexadecimal" } }),
      "0x2A\n",
    );
  },
});

Deno.test({
  name: "stringify() serializes boolean values",
  fn() {
    assertEquals(stringify([true, false]), "- true\n- false\n");

    // casing can be controlled with styles options
    assertEquals(
      stringify([true, false], { styles: { "!!bool": "camelcase" } }),
      "- True\n- False\n",
    );
    assertEquals(
      stringify([true, false], { styles: { "!!bool": "uppercase" } }),
      "- TRUE\n- FALSE\n",
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
    const object = { undefined: undefined };
    assertThrows(
      () => stringify(object),
      YamlError,
      "unacceptable kind of an object to dump",
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
  name: "stringify() handles float types",
  fn() {
    const floats = [
      4.1,
      -1.473,
      6.82e-5,
      6.82e-12,
      5e-12,
      0,
      -0,
    ];
    assertEquals(
      stringify(floats),
      `- 4.1
- -1.473
- 0.0000682
- 6.82e-12
- 5.e-12
- 0
- -0.0
`,
    );
    const infNaN = [Infinity, -Infinity, NaN];
    assertEquals(
      stringify(infNaN),
      `- .inf
- -.inf
- .nan
`,
    );
    assertEquals(
      stringify(infNaN, { styles: { "tag:yaml.org,2002:float": "uppercase" } }),
      `- .INF
- -.INF
- .NAN
`,
    );
    assertEquals(
      stringify(infNaN, { styles: { "tag:yaml.org,2002:float": "camelcase" } }),
      `- .Inf
- -.Inf
- .NaN
`,
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
