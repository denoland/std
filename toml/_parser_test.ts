// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import {
  arrayValue,
  bareKey,
  basicString,
  binary,
  boolean,
  dateTime,
  deepAssign,
  dottedKey,
  float,
  hex,
  infinity,
  inlineTable,
  integer,
  literalString,
  localTime,
  multilineBasicString,
  multilineLiteralString,
  nan,
  octal,
  pair,
  parserFactory,
  Scanner,
  table,
  value,
} from "./_parser.ts";

Deno.test({
  name: "Scanner",
  fn() {
    const scanner = new Scanner(" # comment\n\n\na \nb");
    scanner.skipWhitespaces();
    assertEquals(scanner.char(), "#");
    scanner.nextUntilChar();
    assertEquals(scanner.char(), "a");
    scanner.next();
    scanner.skipWhitespaces();
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
  name: "parse() handles boolean",
  fn() {
    const parse = parserFactory(boolean);
    assertEquals(parse("true"), true);
    assertEquals(parse("false"), false);
    assertThrows(() => parse("truetrue"));
    assertThrows(() => parse("false "));
  },
});

Deno.test({
  name: "parse() handles infinity",
  fn() {
    const parse = parserFactory(infinity);
    assertEquals(parse("inf"), Infinity);
    assertEquals(parse("+inf"), Infinity);
    assertEquals(parse("-inf"), -Infinity);
    assertThrows(() => parse("infinf"));
    assertThrows(() => parse("+inf "));
    assertThrows(() => parse("-inf_"));
  },
});
Deno.test({
  name: "parse() handles nan",
  fn() {
    const parse = parserFactory(nan);
    assertEquals(parse("nan"), NaN);
    assertEquals(parse("+nan"), NaN);
    assertEquals(parse("-nan"), NaN);
    assertThrows(() => parse("nannan"));
    assertThrows(() => parse("+nan "));
    assertThrows(() => parse("-nan_"));
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
        keys: ["foo", "bar"],
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
      keys: ["only", "header"],
      value: {},
    });
    assertThrows(() => parse(""));
    assertThrows(() => parse("["));
    assertThrows(() => parse("[o"));
  },
});

Deno.test({
  name: "parse() handles binary",
  fn() {
    const parse = parserFactory(binary);
    assertEquals(parse("0b11010110"), 0b11010110); // 0b11010110 = 214
    assertEquals(parse("0b1101_0110"), 0b11010110);
    assertThrows(() => parse(""));
    assertThrows(() => parse("+Z"));
    assertThrows(() => parse("0x"));
    assertThrows(() => parse("0b_11010110"));
    assertThrows(() => parse("0b11010110_"));
    assertThrows(() => parse("0b1101__0110"));
  },
});
Deno.test({
  name: "parse() handles octal",
  fn() {
    const parse = parserFactory(octal);
    assertEquals(parse("0o01234567"), 0o01234567); //  0o01234567 = 342391
    assertEquals(parse("0o0123_4567"), 0o01234567); //  0o01234567 = 342391
    assertEquals(parse("0o755"), 0o755); // 0o755 = 493
    assertThrows(() => parse(""));
    assertThrows(() => parse("+Z"));
    assertThrows(() => parse("0x"));
    assertThrows(() => parse("0o_755"));
    assertThrows(() => parse("0o755_"));
    assertThrows(() => parse("0o0123__4567"));
  },
});
Deno.test({
  name: "parse() handles hex",
  fn() {
    const parse = parserFactory(hex);

    assertEquals(parse("0xDEADBEEF"), 0xDEADBEEF); // 0xDEADBEEF = 3735928559
    assertEquals(parse("0xDEAD_BEEF"), 0xDEADBEEF); // 0xDEADBEEF = 3735928559
    assertEquals(parse("0xdeadbeef"), 0xdeadbeef); // 0xdeadbeef = 3735928559
    assertEquals(parse("0xdead_beef"), 0xdead_beef); // 0xdead_beef = 3735928559
    assertThrows(() => parse(""));
    assertThrows(() => parse("+Z"));
    assertThrows(() => parse("0x"));
    assertThrows(() => parse("0x_DEADBEEF"));
    assertThrows(() => parse("0xDEADBEEF_"));
    assertThrows(() => parse("0xDEAD__BEEF"));
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
    assertEquals(parse("0"), 0);
    assertThrows(() => parse(""));
    assertThrows(() => parse("+Z"));
    assertThrows(() => parse("0x"));
    assertThrows(() => parse("_123"));
    assertThrows(() => parse("123_"));
    assertThrows(() => parse("123__456"));
    assertThrows(() => parse("01"));
    assertThrows(() => parse("00"));
    assertThrows(() => parse("-01"));
    assertThrows(() => parse("+0_2"));
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
    assertEquals(parse("0.0"), 0.0);
    assertEquals(parse("+0.0"), 0.0);
    assertEquals(parse("-0.0"), 0.0);
    assertThrows(() => parse(""));
    assertThrows(() => parse("X"));
    assertThrows(() => parse("e_+-"));
    assertThrows(() => parse("_3.1415"));
    assertThrows(() => parse("3_.1415"));
    assertThrows(() => parse("3._1415"));
    assertThrows(() => parse("3.1415_"));
    assertThrows(() => parse("3.14__15"));
    assertThrows(() => parse("_1e06"));
    assertThrows(() => parse("1_e06"));
    assertThrows(() => parse("1e_06"));
    assertThrows(() => parse("1e06_"));
    assertThrows(() => parse("03.14"));
    assertThrows(() => parse("+03.14"));
    assertThrows(() => parse("-03.14"));
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
      parse("1979-05-27T14:32:00+07:00"),
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
    assertThrows(() => parse("2100-02-29"));
    assertThrows(() => parse("1988-02-30"));
    assertThrows(() => parse("1988-02-30T15:15:15Z"));
    assertThrows(() => parse("2100-02-29T15:15:15Z"));
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
  name: "(private) deepAssign() works correctly",
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

    deepAssign(
      source,
      {
        type: "Table",
        keys: ["foo", "items", "profile", "email", "x"],
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
  name: "(private) deepAssign() handles Table and TableArray correctly",
  fn() {
    const source = {
      foo: {},
      bar: null,
    };

    deepAssign(
      source,
      {
        type: "TableArray",
        keys: ["foo", "items"],
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
    deepAssign(
      source,
      {
        type: "TableArray",
        keys: ["foo", "items"],
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
        deepAssign(
          source,
          {
            type: "TableArray",
            keys: [],
            value: { email: "sub@example.com" },
          },
        ),
      Error,
      "Cannot parse the TOML: key length is not a positive number",
    );

    assertThrows(
      () =>
        deepAssign(
          source,
          {
            type: "TableArray",
            keys: ["bar", "items"],
            value: { email: "mail@example.com" },
          },
        ),
      Error,
      "Unexpected assign",
    );

    assertThrows(
      () =>
        deepAssign(
          source,
          {
            type: "Table",
            keys: ["bar", "items"],
            value: { email: "mail@example.com" },
          },
        ),
      Error,
      "Unexpected assign",
    );
  },
});
