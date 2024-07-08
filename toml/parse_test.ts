// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import {
  arrayValue,
  bareKey,
  basicString,
  dateTime,
  deepAssignWithTable,
  dottedKey,
  float,
  inlineTable,
  integer,
  literalString,
  localTime,
  multilineBasicString,
  multilineLiteralString,
  pair,
  parserFactory,
  Scanner,
  symbols,
  table,
  value,
} from "./_parser.ts";
import { parse, stringify } from "./mod.ts";
import { existsSync } from "@std/fs/exists";
import * as path from "@std/path";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "./testdata");

function parseFile(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return parse(Deno.readTextFileSync(filePath));
}

Deno.test({
  name: "Scanner",
  fn() {
    const scanner = new Scanner(" # comment\n\n\na \nb");
    scanner.nextUntilChar({ inline: true });
    assertEquals(scanner.char(), "#");
    scanner.nextUntilChar();
    assertEquals(scanner.char(), "a");
    scanner.next();
    scanner.nextUntilChar({ inline: true });
    assertEquals(scanner.char(), "\n");
    scanner.nextUntilChar();
    assertEquals(scanner.char(), "b");
    scanner.next();
    assertEquals(scanner.eof(), true);
  },
});

Deno.test({
  name: "parse() handles bare key",
  fn() {
    const parse = parserFactory(bareKey);
    assertEquals(parse("A-Za-z0-9_-"), "A-Za-z0-9_-");
    assertThrows(() => parse(""));
    assertThrows(() => parse('"foo"'));
  },
});

Deno.test({
  name: "parse() handles basic string",
  fn() {
    const parse = parserFactory(basicString);
    assertEquals(
      parse('"a\\"\\n\\t\\b\\\\\\u3042\\U01F995"'),
      'a"\n\t\b\\\あ🦕',
    );
    assertEquals(parse('""'), "");
    assertEquals(parse('"a\\n"'), "a\n");
    assertThrows(
      () => parse('"a\\0b\\?c"'),
      SyntaxError,
      "Invalid escape sequence: \\0",
    );
    assertThrows(() => parse(""));
    assertThrows(() => parse('"a'));
    assertThrows(() => parse('"a\nb"'));
  },
});

Deno.test({
  name: "parse() handles literal string",
  fn() {
    const parse = parserFactory(literalString);
    assertEquals(parse("'a\\n'"), "a\\n");
    assertThrows(() => parse(""));
    assertThrows(() => parse("'a"));
    assertThrows(() => parse("a\nb"));
  },
});

Deno.test({
  name: "parse() handles multi-line basic string",
  fn() {
    const parse = parserFactory(multilineBasicString);
    assertEquals(
      parse(`"""
Roses are red
Violets are\\tblue"""`),
      "Roses are red\nViolets are\tblue",
    );
    assertEquals(
      parse(`"""\\
    The quick brown \\
    fox jumps over \\
    the lazy dog.\\
    """`),
      "The quick brown fox jumps over the lazy dog.",
    );
    assertThrows(
      () =>
        parse(`"""\\
    The quick brown \\
    fox jumps over\\? \\
    the lazy dog\\0.\\
    """`),
      SyntaxError,
      "Invalid escape sequence: \\?",
    );
    assertThrows(
      () =>
        parse(`"""
Roses are red
Violets are\\tblue`),
      SyntaxError,
      "not closed",
    );
  },
});

Deno.test({
  name: "parse() handles multi-line basic string (CRLF)",
  fn() {
    const parse = parserFactory(multilineBasicString);
    assertEquals(
      parse(`"""\r
Roses are red\r
Violets are\\tblue"""`),
      "Roses are red\r\nViolets are\tblue",
    );
    assertEquals(
      parse(`"""\\\r
    The quick brown \\\r
    fox jumps over \\\r
    the lazy dog.\\\r
    """`),
      "The quick brown fox jumps over the lazy dog.",
    );
  },
});

Deno.test({
  name: "parse() handles multi-line literal string",
  fn() {
    const parse = parserFactory(multilineLiteralString);
    assertEquals(
      parse(`'''
Roses are red
Violets are\\tblue'''`),
      "Roses are red\nViolets are\\tblue",
    );
    assertThrows(
      () =>
        parse(`'''
Roses are red
Violets are\\tblue`),
      SyntaxError,
      "not closed",
    );
  },
});

Deno.test({
  name: "parse() handles multi-line literal string (CRLF)",
  fn() {
    const parse = parserFactory(multilineLiteralString);
    assertEquals(
      parse(`'''\r
Roses are red\r
Violets are\\tblue'''`),
      "Roses are red\r\nViolets are\\tblue",
    );
  },
});

Deno.test({
  name: "parse() handles symbols",
  fn() {
    const parse = parserFactory(symbols);
    assertEquals(parse("true"), true);
    assertEquals(parse("nan"), NaN);
    assertEquals(parse("inf"), Infinity);
    assertThrows(() => parse(""));
    assertThrows(() => parse("_"));
  },
});

Deno.test({
  name: "parse() handles dotted key",
  fn() {
    const parse = parserFactory(dottedKey);
    assertEquals(parse("a . b . c"), ["a", "b", "c"]);
    assertEquals(parse(`a.'b.c'."d.e"`), ["a", "b.c", "d.e"]);
    assertThrows(() => parse(""));
    assertThrows(() => parse("a.b ."));
    assertThrows(() => parse("."));
  },
});

Deno.test({
  name: "parse() handles table",
  fn() {
    const parse = parserFactory(table);
    assertEquals(
      parse(`
[foo.bar]
baz = true
fizz.buzz = true
`.trim()),
      {
        type: "Table",
        key: ["foo", "bar"],
        value: {
          baz: true,
          fizz: {
            buzz: true,
          },
        },
      },
    );
    assertEquals(parse(`[only.header]`), {
      type: "Table",
      key: ["only", "header"],
      value: {},
    });
    assertThrows(() => parse(""));
    assertThrows(() => parse("["));
    assertThrows(() => parse("[o"));
  },
});

Deno.test({
  name: "parse() handles integer",
  fn() {
    const parse = parserFactory(integer);
    assertEquals(parse("123"), 123);
    assertEquals(parse("+123"), 123);
    assertEquals(parse("-123"), -123);
    assertEquals(parse("123_456"), 123456);
    assertEquals(parse("0xDEADBEEF"), "0xDEADBEEF");
    assertEquals(parse("0xdeadbeef"), "0xdeadbeef");
    assertEquals(parse("0xdead_beef"), "0xdead_beef");
    assertEquals(parse("0o01234567"), "0o01234567");
    assertEquals(parse("0o755"), "0o755");
    assertEquals(parse("0b11010110"), "0b11010110");
    assertThrows(() => parse(""));
    assertThrows(() => parse("+Z"));
    assertThrows(() => parse("0x"));
  },
});

Deno.test({
  name: "parse() handles float",
  fn() {
    const parse = parserFactory(float);
    assertEquals(parse("+1.0"), 1.0);
    assertEquals(parse("3.1415"), 3.1415);
    assertEquals(parse("-0.01"), -0.01);
    assertEquals(parse("5e+22"), 5e+22);
    assertEquals(parse("1e06"), 1e06);
    assertEquals(parse("-2E-2"), -2E-2);
    assertEquals(parse("6.626e-34"), 6.626e-34);
    assertEquals(parse("224_617.445_991_228"), 224_617.445_991_228);
    assertThrows(() => parse(""));
    assertThrows(() => parse("X"));
    assertThrows(() => parse("e_+-"));
  },
});

Deno.test({
  name: "parse() handles date and date time",
  fn() {
    const parse = parserFactory(dateTime);
    assertEquals(
      parse("1979-05-27T07:32:00Z"),
      new Date("1979-05-27T07:32:00Z"),
    );
    assertEquals(
      parse("1979-05-27T00:32:00-07:00"),
      new Date("1979-05-27T07:32:00Z"),
    );
    assertEquals(
      parse("1979-05-27T00:32:00.999999-07:00"),
      new Date("1979-05-27T07:32:00.999Z"),
    );
    assertEquals(
      parse("1979-05-27 07:32:00Z"),
      new Date("1979-05-27T07:32:00Z"),
    );
    assertEquals(parse("1979-05-27T07:32:00"), new Date("1979-05-27T07:32:00"));
    assertEquals(
      parse("1979-05-27T00:32:00.999999"),
      new Date("1979-05-27T00:32:00.999999"),
    );
    assertEquals(parse("1979-05-27"), new Date("1979-05-27"));
    assertThrows(() => parse(""));
    assertThrows(() => parse("X"));
    assertThrows(() => parse("0000-00-00"));
  },
});

Deno.test({
  name: "parse() handles local time",
  fn() {
    const parse = parserFactory(localTime);
    assertEquals(parse("07:32:00"), "07:32:00");
    assertEquals(parse("07:32:00.999"), "07:32:00.999");
    assertThrows(() => parse(""));
  },
});

Deno.test({
  name: "parse() handles value",
  fn() {
    const parse = parserFactory(value);
    assertEquals(parse("1"), 1);
    assertEquals(parse("1.2"), 1.2);
    assertEquals(parse("1979-05-27"), new Date("1979-05-27"));
    assertEquals(parse("07:32:00"), "07:32:00");
    assertEquals(parse(`"foo.com"`), "foo.com");
    assertEquals(parse(`'foo.com'`), "foo.com");
  },
});

Deno.test({
  name: "parse() handles key value pair",
  fn() {
    const parse = parserFactory(pair);
    assertEquals(parse("key = 'value'"), { key: "value" });
    assertThrows(() => parse("key ="));
    assertThrows(() => parse("key = \n 'value'"));
    assertThrows(() => parse("key \n = 'value'"));
  },
});

Deno.test({
  name: "parse() handles array",
  fn() {
    const parse = parserFactory(arrayValue);
    assertEquals(parse("[]"), []);
    assertEquals(parse("[1, 2, 3]"), [1, 2, 3]);
    assertEquals(parse(`[ "red", "yellow", "green" ]`), [
      "red",
      "yellow",
      "green",
    ]);
    assertEquals(parse(`[ [ 1, 2 ], [3, 4, 5] ]`), [[1, 2], [3, 4, 5]]);
    assertEquals(parse(`[ [ 1, 2 ], ["a", "b", "c"] ]`), [
      [1, 2],
      ["a", "b", "c"],
    ]);
    assertEquals(
      parse(`[
      { x = 1, y = 2, z = 3 },
      { x = 7, y = 8, z = 9 },
      { x = 2, y = 4, z = 8 }
    ]`),
      [{ x: 1, y: 2, z: 3 }, { x: 7, y: 8, z: 9 }, { x: 2, y: 4, z: 8 }],
    );
    assertEquals(
      parse(`[ # comment
        1, # comment
        2, # this is ok
      ]`),
      [1, 2],
    );
    assertThrows(() => parse("[1, 2, 3"), SyntaxError, "not closed");
  },
});

Deno.test({
  name: "parse() handles inline table",
  fn() {
    const parse = parserFactory(inlineTable);
    assertEquals(parse(`{ first = "Tom", last = "Preston-Werner" }`), {
      first: "Tom",
      last: "Preston-Werner",
    });
    assertEquals(parse(`{ type.name = "pug" }`), { type: { name: "pug" } });
    assertThrows(() => parse(`{ x = 1`));
    assertThrows(() => parse(`{ x = 1,\n y = 2 }`));
    assertThrows(() => parse(`{ x = 1, }`));
  },
});

Deno.test({
  name: "parse() handles deepAssignWithTable",
  fn() {
    const source = {
      foo: {
        items: [
          {
            id: "a",
          },
          {
            id: "b",
            profile: {
              name: "b",
            },
          },
        ],
      },
    };

    deepAssignWithTable(
      source,
      {
        type: "Table",
        key: ["foo", "items", "profile", "email", "x"],
        value: { main: "mail@example.com" },
      },
    );
    assertEquals(
      source,
      {
        foo: {
          items: [
            {
              id: "a",
            },
            {
              id: "b",
              profile: {
                name: "b",
                email: {
                  x: { main: "mail@example.com" },
                },
              } as unknown,
            },
          ],
        },
      },
    );
  },
});

Deno.test({
  name: "parse() handles deepAssignWithTable / TableArray",
  fn() {
    const source = {
      foo: {},
      bar: null,
    };

    deepAssignWithTable(
      source,
      {
        type: "TableArray",
        key: ["foo", "items"],
        value: { email: "mail@example.com" },
      },
    );
    assertEquals(
      source,
      {
        foo: {
          items: [
            {
              email: "mail@example.com",
            },
          ],
        },
        bar: null,
      },
    );
    deepAssignWithTable(
      source,
      {
        type: "TableArray",
        key: ["foo", "items"],
        value: { email: "sub@example.com" },
      },
    );
    assertEquals(
      source,
      {
        foo: {
          items: [
            {
              email: "mail@example.com",
            },
            {
              email: "sub@example.com",
            },
          ],
        },
        bar: null,
      },
    );

    assertThrows(
      () =>
        deepAssignWithTable(
          source,
          {
            type: "TableArray",
            key: [],
            value: { email: "sub@example.com" },
          },
        ),
      Error,
      "Unexpected key length",
    );

    assertThrows(
      () =>
        deepAssignWithTable(
          source,
          {
            type: "TableArray",
            key: ["bar", "items"],
            value: { email: "mail@example.com" },
          },
        ),
      Error,
      "Unexpected assign",
    );
  },
});

Deno.test({
  name: "parse() handles error message",
  fn() {
    assertThrows(
      () => parse("foo = 1\nbar ="),
      SyntaxError,
      "line 2, column 5",
    );
    assertThrows(
      () => parse("foo = 1\nbar = 'foo\nbaz=1"),
      SyntaxError,
      "line 2, column 10",
    );
    assertThrows(
      () => parse(""),
      SyntaxError,
      "line 1, column 0",
    );
    assertThrows(
      () =>
        parserFactory((_s) => {
          throw "Custom parser";
        })(""),
      SyntaxError,
      "[non-error thrown]",
    );
  },
});

Deno.test({
  name: "parse() handles strings",
  fn() {
    const expected = {
      strings: {
        str0: "deno",
        str1: "Roses are not Deno\n          Violets are not Deno either",
        str2: "Roses are not Deno\nViolets are not Deno either",
        str3: "Roses are not Deno\r\nViolets are not Deno either",
        str4: 'this is a "quote"',
        str5: "The quick brown fox jumps over the lazy dog.",
        str6: "The quick brown fox jumps over the lazy dog.",
        str7: "Roses are red\tViolets are blue",
        str8: "Roses are red\fViolets are blue",
        str9: "Roses are red\bViolets are blue",
        str10: "Roses are red\\Violets are blue",
        str11: `double "quote"\nsingle 'quote'\n`,
        str12: 'Here are two quotation marks: "". Simple enough.',
        str13: 'Here are three quotation marks: """.',
        str14: 'Here are fifteen quotation marks: """"""""""""""".',
        str15: '"This," she said, "is just a pointless statement."',
        literal1:
          "The first newline is\ntrimmed in raw strings.\n   All other whitespace\n   is preserved.\n",
        literal2: '"\\n#=*{',
        literal3: "\\n\\t is 'literal'\\\n",
        literal4: 'Here are fifteen quotation marks: """""""""""""""',
        literal5: "Here are fifteen apostrophes: '''''''''''''''",
        literal6: "'That,' she said, 'is still pointless.'",
        withApostrophe: "What if it's not?",
        withSemicolon: `const message = 'hello world';`,
        withHexNumberLiteral:
          "Prevent bug from stripping string here ->0xabcdef",
        withUnicodeChar1: "あ",
        withUnicodeChar2: "Deno🦕",
      },
    };
    const actual = parseFile(path.join(testdataDir, "string.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles CRLF",
  fn() {
    const expected = { boolean: { bool1: true, bool2: false } };
    const actual = parseFile(path.join(testdataDir, "CRLF.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles boolean",
  fn() {
    const expected = { boolean: { bool1: true, bool2: false, bool3: true } };
    const actual = parseFile(path.join(testdataDir, "boolean.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles integer",
  fn() {
    const expected = {
      integer: {
        int1: 99,
        int2: 42,
        int3: 0,
        int4: -17,
        int5: 1000,
        int6: 5349221,
        int7: 12345,
        hex1: "0xDEADBEEF",
        hex2: "0xdeadbeef",
        hex3: "0xdead_beef",
        oct1: "0o01234567",
        oct2: "0o755",
        bin1: "0b11010110",
      },
    };
    const actual = parseFile(path.join(testdataDir, "integer.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles float",
  fn() {
    const expected = {
      float: {
        flt1: 1.0,
        flt2: 3.1415,
        flt3: -0.01,
        flt4: 5e22,
        flt5: 1e6,
        flt6: -2e-2,
        flt7: 6.626e-34,
        flt8: 224_617.445_991_228,
        sf1: Infinity,
        sf2: Infinity,
        sf3: -Infinity,
        sf4: NaN,
        sf5: NaN,
        sf6: NaN,
      },
    };
    const actual = parseFile(path.join(testdataDir, "float.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles arrays",
  fn() {
    const expected = {
      arrays: {
        data: [
          ["gamma", "delta"],
          [1, 2],
        ],
        floats: [
          0.1,
          -1.25,
        ],
        hosts: ["alpha", "omega"],
        profiles: [
          {
            "john@example.com": true,
            name: "John",
          },
          {
            "doe@example.com": true,
            name: "Doe",
          },
        ],
      },
    };
    const actual = parseFile(path.join(testdataDir, "arrays.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles table",
  fn() {
    const expected = {
      deeply: {
        nested: {
          object: {
            in: {
              the: {
                toml: {
                  name: "Tom Preston-Werner",
                },
              },
            },
          },
        },
      },
      servers: {
        alpha: {
          ip: "10.0.0.1",
          dc: "eqdc10",
        },
        beta: {
          ip: "10.0.0.2",
          dc: "eqdc20",
        },
      },
      dog: {
        "tater.man": {
          type: {
            name: "pug",
          },
        },
      },
    };
    const actual = parseFile(path.join(testdataDir, "table.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles various keys",
  fn() {
    const expected = {
      site: { "google.com": { bar: 1, baz: 1 } },
      a: { b: { c: 1, d: 1 }, e: 1 },
      "": 1,
      "127.0.0.1": 1,
      "ʎǝʞ": 1,
      'this is "literal"': 1,
      'double "quote"': 1,
      "basic__\n__": 1,
      "literal__\\n__": 1,
    };
    const actual = parseFile(path.join(testdataDir, "keys.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles simple",
  fn() {
    const expected = {
      deno: "is",
      not: "[node]",
      regex: "<\\i\\c*\\s*>",
      NANI: "何?!",
      comment: "Comment inside # the comment",
    };
    const actual = parseFile(path.join(testdataDir, "simple.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles datetime",
  fn() {
    const expected = {
      datetime: {
        odt1: new Date("1979-05-27T07:32:00Z"),
        odt2: new Date("1979-05-27T00:32:00-07:00"),
        odt3: new Date("1979-05-27T00:32:00.999999-07:00"),
        odt4: new Date("1979-05-27 07:32:00Z"),
        ld1: new Date("1979-05-27"),
        lt1: "07:32:00",
        lt2: "00:32:00.999999",
      },
    };
    const actual = parseFile(path.join(testdataDir, "datetime.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles inline table",
  fn() {
    const expected = {
      inlinetable: {
        nile: {
          also: {
            malevolant: {
              creation: {
                drum: {
                  kit: "Tama",
                },
              },
            },
          },
          derek: {
            roddy: "drummer",
          },
        },
        name: {
          first: "Tom",
          last: "Preston-Werner",
        },
        point: {
          x: 1,
          y: 2,
        },
        dog: {
          type: {
            name: "pug",
          },
        },
        "tosin.abasi": "guitarist",
        animal: {
          as: {
            leaders: "tosin",
          },
        },
        annotation_filter: { "kubernetes.io/ingress.class": "nginx" },
        literal_key: {
          "foo\\nbar": "foo\\nbar",
        },
        nested: {
          parent: {
            "child.ren": [
              "[",
              "]",
            ],
            children: [
              "{",
              "}",
            ],
          },
        },
        empty: {},
      },
    };
    const actual = parseFile(path.join(testdataDir, "inlineTable.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles array of tables",
  fn() {
    const expected = {
      bin: [
        { name: "deno", path: "cli/main.rs" },
        { name: "deno_core", path: "src/foo.rs" },
      ],
      nib: [{ name: "node", path: "not_found" }],
      a: {
        c: {
          z: "z",
        },
      },
      b: [
        {
          c: {
            z: "z",
          },
        },
        {
          c: {
            z: "z",
          },
        },
      ],
      aaa: [
        {
          bbb: {
            asdf: "asdf",
          },
          hi: "hi",
        },
      ],
    };
    const actual = parseFile(path.join(testdataDir, "arrayTable.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles cargo",
  fn() {
    const expected = {
      workspace: { members: ["./", "core"] },
      bin: [{ name: "deno", path: "cli/main.rs" }],
      package: { name: "deno", version: "0.3.4", edition: "2018" },
      dependencies: {
        deno_core: { path: "./core" },
        atty: "0.2.11",
        dirs: "1.0.5",
        flatbuffers: "0.5.0",
        futures: "0.1.25",
        getopts: "0.2.18",
        http: "0.1.16",
        hyper: "0.12.24",
        "hyper-rustls": "0.16.0",
        "integer-atomics": "1.0.2",
        lazy_static: "1.3.0",
        libc: "0.2.49",
        log: "0.4.6",
        rand: "0.6.5",
        regex: "1.1.0",
        remove_dir_all: "0.5.2",
        ring: "0.14.6",
        rustyline: "3.0.0",
        serde_json: "1.0.38",
        "source-map-mappings": "0.5.0",
        tempfile: "3.0.7",
        tokio: "0.1.15",
        "tokio-executor": "0.1.6",
        "tokio-fs": "0.1.5",
        "tokio-io": "0.1.11",
        "tokio-process": "0.2.3",
        "tokio-threadpool": "0.1.11",
        url: "1.7.2",
      },
      target: {
        "cfg(windows)": { dependencies: { winapi: "0.3.6" } },
        "cfg(linux)": { dependencies: { winapi: "0.3.9" } },
      },
    };
    const actual = parseFile(path.join(testdataDir, "cargo.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles stringify",
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
sf4 = NaN
sf5 = NaN
sf6 = NaN
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
  name: "parse() handles mixed array",
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
  name: "parse() handles stringify with string values",
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
    const parsed = parse(actual);
    assertEquals(src, parsed);
  },
});

Deno.test({
  name: "parse() handles comments",
  fn: () => {
    const expected = {
      str0: "value",
      str1: "# This is not a comment",
      str2:
        " # this is not a comment!\nA multiline string with a #\n# this is also not a comment\n",
      str3:
        '"# not a comment"\n\t# this is a real tab on purpose \n# not a comment\n',
      point0: { x: 1, y: 2, str0: "#not a comment", z: 3 },
      point1: { x: 7, y: 8, z: 9, str0: "#not a comment" },
      deno: {
        features: ["#secure by default", "supports typescript # not a comment"],
        url: "https://deno.land/",
        is_not_node: true,
      },
      toml: {
        name: "Tom's Obvious, Minimal Language",
        objectives: ["easy to read", "minimal config file", "#not a comment"],
      },
    };
    const actual = parseFile(path.join(testdataDir, "comment.toml"));
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles inline array of inline table",
  fn() {
    const expected = {
      inlineArray: {
        string: [{ var: "a string" }],
        my_points: [
          { x: 1, y: 2, z: 3 },
          { x: 7, y: 8, z: 9 },
          { x: 2, y: 4, z: 8 },
        ],
        points: [
          { x: 1, y: 2, z: 3 },
          { x: 7, y: 8, z: 9 },
          { x: 2, y: 4, z: 8 },
        ],
      },
    };
    const actual = parseFile(
      path.join(testdataDir, "inlineArrayOfInlineTable.toml"),
    );
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles parse malformed local time as string (#8433)",
  fn() {
    const expected = { sign: "2020-01-01x" };
    const actual = parse(`sign='2020-01-01x'`);
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "parse() handles single-line string comment error",
  fn() {
    assertThrows(
      () => {
        parseFile(path.join(testdataDir, "error-open-string.toml"));
      },
      Error,
      `Parse error on line 1, column 34: Single-line string cannot contain EOL`,
    );
  },
});

Deno.test({
  name: "parse() handles invalid string format",
  fn() {
    assertThrows(
      () => {
        parseFile(path.join(testdataDir, "error-invalid-string.toml"));
      },
      Error,
      `invalid data format`,
    );
  },
});

Deno.test({
  name: "parse() handles invalid whitespaces",
  fn() {
    assertThrows(
      () => {
        parseFile(path.join(testdataDir, "error-invalid-whitespace1.toml"));
      },
      Error,
      "Contains invalid whitespaces: `\\u3000`",
    );
    assertThrows(
      () => {
        parseFile(path.join(testdataDir, "error-invalid-whitespace2.toml"));
      },
      Error,
      "Contains invalid whitespaces: `\\u3000`",
    );
  },
});
