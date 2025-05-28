// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { stringify } from "./stringify.ts";

// https://github.com/denoland/std/issues/1067#issuecomment-907740319
Deno.test({
  name: "stringify() handles object value contains '='",
  fn() {
    const src = {
      "a": "a = 1",
      "helloooooooo": 1,
    };

    const actual = stringify(src, { keyAlignment: true });
    const expected = `a            = "a = 1"
helloooooooo = 1
`;
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles key alignment",
  fn() {
    const src = {
      "a": 1,
      "aa": 1,
      "aaa": 1,
      "aaaa": 1,
      "aaaaa": 1,
    };
    const actual = stringify(src, { keyAlignment: true });
    const expected = `a     = 1
aa    = 1
aaa   = 1
aaaa  = 1
aaaaa = 1
`;
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles empty key",
  fn() {
    const src = {
      "": "a",
      "b": { "": "c" },
    };
    const actual = stringify(src);
    const expected = `"" = "a"

[b]
"" = "c"
`;
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles empty object",
  fn() {
    const src = {
      "a": {},
      "b": { "c": {} },
    };
    const actual = stringify(src);
    const expected = `
[a]

[b.c]
`;
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles special keys in inline object",
  fn() {
    const src = {
      "a": [{ "/": "b" }, "c"],
    };
    const actual = stringify(src);
    const expected = 'a = [{"/" = "b"},"c"]\n';
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() throws on invalid value",
  fn() {
    assertThrows(
      () => stringify({ a: [[null]] }),
      Error,
      "Should never reach",
    );
    assertThrows(
      () => stringify({ a: [[undefined]] }),
      Error,
      "Should never reach",
    );
  },
});

Deno.test({
  name: "stringify()",
  fn() {
    const src = {
      foo: { bar: "deno" },
      this: { is: { nested: "denonono" } },
      "https://deno.land/std": {
        $: "dollar",
      },
      "##": {
        deno: {
          "https://deno.land": {
            proto: "https",
            ":80": "port",
          },
        },
      },
      arrayObjects: [{ stuff: "in" }, {}, { the: "array" }],
      deno: "is",
      not: "[node]",
      regex: "<ic*s*>",
      NANI: "何?!",
      comment: "Comment inside # the comment",
      int1: 99,
      int2: 42,
      int3: 0,
      int4: -17,
      int5: 1000,
      int6: 5349221,
      int7: 12345,
      flt1: 1.0,
      flt2: 3.1415,
      flt3: -0.01,
      flt4: 5e22,
      flt5: 1e6,
      flt6: -2e-2,
      flt7: 6.626e-34,
      odt1: new Date("1979-05-01T07:32:00Z"),
      odt2: new Date("1979-05-27T00:32:00-07:00"),
      odt3: new Date("1979-05-27T00:32:00.999999-07:00"),
      odt4: new Date("1979-05-27 07:32:00Z"),
      ld1: new Date("1979-05-27"),
      reg: /foo[bar]/,
      sf1: Infinity,
      sf2: Infinity,
      sf3: -Infinity,
      sf4: NaN,
      sf5: NaN,
      sf6: NaN,
      data: [
        ["gamma", "delta"],
        [1, 2],
      ],
      hosts: ["alpha", "omega"],
      bool: true,
      bool2: false,
    };
    const expected = `deno = "is"
not = "[node]"
regex = "<ic*s*>"
NANI = "何?!"
comment = "Comment inside # the comment"
int1 = 99
int2 = 42
int3 = 0
int4 = -17
int5 = 1000
int6 = 5349221
int7 = 12345
flt1 = 1
flt2 = 3.1415
flt3 = -0.01
flt4 = 5e+22
flt5 = 1000000
flt6 = -0.02
flt7 = 6.626e-34
odt1 = 1979-05-01T07:32:00.000
odt2 = 1979-05-27T07:32:00.000
odt3 = 1979-05-27T07:32:00.999
odt4 = 1979-05-27T07:32:00.000
ld1 = 1979-05-27T00:00:00.000
reg = "/foo[bar]/"
sf1 = inf
sf2 = inf
sf3 = -inf
sf4 = nan
sf5 = nan
sf6 = nan
data = [["gamma","delta"],[1,2]]
hosts = ["alpha","omega"]
bool = true
bool2 = false

[foo]
bar = "deno"

[this.is]
nested = "denonono"

["https://deno.land/std"]
"$" = "dollar"

["##".deno."https://deno.land"]
proto = "https"
":80" = "port"

[[arrayObjects]]
stuff = "in"

[[arrayObjects]]

[[arrayObjects]]
the = "array"
`;
    const actual = stringify(src);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles mixed array",
  fn() {
    const src = {
      emptyArray: [],
      mixedArray1: [1, { b: 2 }],
      mixedArray2: [{ b: 2 }, 1],
      nestedArray1: [[{ b: 1, date: new Date("2022-05-13") }]],
      nestedArray2: [[[{ b: 1 }]]],
      nestedArray3: [[], [{ b: 1 }]],
      deepNested: {
        a: {
          b: [1, { c: 2, d: [{ e: 3 }, true] }],
        },
      },
    };
    const expected = `emptyArray = []
mixedArray1 = [1,{b = 2}]
mixedArray2 = [{b = 2},1]
nestedArray1 = [[{b = 1,date = "2022-05-13T00:00:00.000"}]]
nestedArray2 = [[[{b = 1}]]]
nestedArray3 = [[],[{b = 1}]]

[deepNested.a]
b = [1,{c = 2,d = [{e = 3},true]}]
`;
    const actual = stringify(src);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "stringify() handles string values",
  fn: () => {
    const src = {
      '"': '"',
      "'": "'",
      " ": " ",
      "\\": "\\",
      "\n": "\n",
      "\t": "\t",
    };
    const expected = `
"\\"" = "\\""
"'" = "'"
" " = " "
"\\\\" = "\\\\"
"\\n" = "\\n"
"\\t" = "\\t"
`.trim();
    const actual = stringify(src).trim();
    assertEquals(actual, expected);
  },
});
