// Test ported from Golang
// https://github.com/golang/go/blob/2cc15b1/src/encoding/csv/reader_test.go
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../testing/asserts.ts";
import { parse, ParseError } from "./csv.ts";
import { StringReader } from "../io/readers.ts";
import { BufReader } from "../io/buffer.ts";

Deno.test({
  name: "Simple",
  async fn() {
    const input = "a,b,c\n";
    assertEquals(
      await parse(input),
      [["a", "b", "c"]],
    );
  },
});
Deno.test({
  name: "CRLF",
  async fn() {
    const input = "a,b\r\nc,d\r\n";
    assertEquals(
      await parse(input),
      [
        ["a", "b"],
        ["c", "d"],
      ],
    );
  },
});

Deno.test({
  name: "BareCR",
  async fn() {
    const input = "a,b\rc,d\r\n";
    assertEquals(
      await parse(input),
      [["a", "b\rc", "d"]],
    );
  },
});

Deno.test({
  name: "RFC4180test",
  async fn() {
    const input =
      '#field1,field2,field3\n"aaa","bbb","ccc"\n"a,a","bbb","ccc"\nzzz,yyy,xxx';
    assertEquals(
      await parse(input),
      [
        ["#field1", "field2", "field3"],
        ["aaa", "bbb", "ccc"],
        ["a,a", `bbb`, "ccc"],
        ["zzz", "yyy", "xxx"],
      ],
    );
  },
});
Deno.test({
  name: "NoEOLTest",
  async fn() {
    const input = "a,b,c";
    assertEquals(
      await parse(input),
      [["a", "b", "c"]],
    );
  },
});

Deno.test({
  name: "Semicolon",
  async fn() {
    const input = "a;b;c\n";
    assertEquals(
      await parse(input, { separator: ";" }),
      [["a", "b", "c"]],
    );
  },
});

Deno.test({
  name: "MultiLine",
  async fn() {
    const input = '"two\nline","one line","three\nline\nfield"';
    assertEquals(
      await parse(input),
      [["two\nline", "one line", "three\nline\nfield"]],
    );
  },
});

Deno.test({
  name: "BlankLine",
  async fn() {
    const input = "a,b,c\n\nd,e,f\n\n";
    assertEquals(
      await parse(input),
      [
        ["a", "b", "c"],
        ["d", "e", "f"],
      ],
    );
  },
});

Deno.test({
  name: "BlankLineFieldCount",
  async fn() {
    const input = "a,b,c\n\nd,e,f\n\n";
    assertEquals(
      await parse(input, { fieldsPerRecord: 0 }),
      [
        ["a", "b", "c"],
        ["d", "e", "f"],
      ],
    );
  },
});

Deno.test({
  name: "TrimSpace",
  async fn() {
    const input = " a,  b,   c\n";
    assertEquals(
      await parse(input, { trimLeadingSpace: true }),
      [["a", "b", "c"]],
    );
  },
});

Deno.test({
  name: "LeadingSpace",
  async fn() {
    const input = " a,  b,   c\n";
    const output = [[" a", "  b", "   c"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "Comment",
  async fn() {
    const input = "#1,2,3\na,b,c\n#comment";
    const output = [["a", "b", "c"]];
    assertEquals(await parse(input, { comment: "#" }), output);
  },
});
Deno.test({
  name: "NoComment",
  async fn() {
    const input = "#1,2,3\na,b,c";
    const output = [
      ["#1", "2", "3"],
      ["a", "b", "c"],
    ];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "LazyQuotes",
  async fn() {
    const input = `a "word","1"2",a","b`;
    const output = [[`a "word"`, `1"2`, `a"`, `b`]];
    assertEquals(await parse(input, { lazyQuotes: true }), output);
  },
});
Deno.test({
  name: "BareQuotes",
  async fn() {
    const input = `a "word","1"2",a"`;
    const output = [[`a "word"`, `1"2`, `a"`]];
    assertEquals(await parse(input, { lazyQuotes: true }), output);
  },
});
Deno.test({
  name: "BareDoubleQuotes",
  async fn() {
    const input = `a""b,c`;
    const output = [[`a""b`, `c`]];
    assertEquals(await parse(input, { lazyQuotes: true }), output);
  },
});
Deno.test({
  name: "BadDoubleQuotes",
  async fn() {
    const input = `a""b,c`;
    await assertRejects(
      async () => await parse(input),
      ParseError,
      'parse error on line 1, column 1: bare " in non-quoted-field',
    );
  },
});
Deno.test({
  name: "TrimQuote",
  async fn() {
    const input = ` "a"," b",c`;
    const output = [["a", " b", "c"]];
    assertEquals(await parse(input, { trimLeadingSpace: true }), output);
  },
});
Deno.test({
  name: "BadBareQuote",
  async fn() {
    const input = `a "word","b"`;
    await assertRejects(
      async () => await parse(input),
      ParseError,
      'parse error on line 1, column 2: bare " in non-quoted-field',
    );
  },
});
Deno.test({
  name: "BadTrailingQuote",
  async fn() {
    const input = `"a word",b"`;
    await assertRejects(
      async () => await parse(input),
      ParseError,
      'parse error on line 1, column 10: bare " in non-quoted-field',
    );
  },
});
Deno.test({
  name: "ExtraneousQuote",
  async fn() {
    const input = `"a "word","b"`;
    await assertRejects(
      async () => await parse(input),
      ParseError,
      `parse error on line 1, column 3: extraneous or missing " in quoted-field`,
    );
  },
});
Deno.test({
  name: "BadFieldCount",
  async fn() {
    const input = "a,b,c\nd,e";
    await assertRejects(
      async () => await parse(input, { fieldsPerRecord: 0 }),
      ParseError,
      "record on line 2: wrong number of fields",
    );
  },
});
Deno.test({
  name: "BadFieldCount1",
  async fn() {
    const input = `a,b,c`;
    await assertRejects(
      async () => await parse(input, { fieldsPerRecord: 2 }),
      ParseError,
      "record on line 1: wrong number of fields",
    );
  },
});
Deno.test({
  name: "FieldCount",
  async fn() {
    const input = "a,b,c\nd,e";
    const output = [
      ["a", "b", "c"],
      ["d", "e"],
    ];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "TrailingCommaEOF",
  async fn() {
    const input = "a,b,c,";
    const output = [["a", "b", "c", ""]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "TrailingCommaEOL",
  async fn() {
    const input = "a,b,c,\n";
    const output = [["a", "b", "c", ""]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "TrailingCommaSpaceEOF",
  async fn() {
    const input = "a,b,c, ";
    const output = [["a", "b", "c", ""]];
    assertEquals(await parse(input, { trimLeadingSpace: true }), output);
  },
});
Deno.test({
  name: "TrailingCommaSpaceEOL",
  async fn() {
    const input = "a,b,c, \n";
    const output = [["a", "b", "c", ""]];
    assertEquals(await parse(input, { trimLeadingSpace: true }), output);
  },
});
Deno.test({
  name: "TrailingCommaLine3",
  async fn() {
    const input = "a,b,c\nd,e,f\ng,hi,";
    const output = [
      ["a", "b", "c"],
      ["d", "e", "f"],
      ["g", "hi", ""],
    ];
    assertEquals(await parse(input, { trimLeadingSpace: true }), output);
  },
});
Deno.test({
  name: "NotTrailingComma3",
  async fn() {
    const input = "a,b,c, \n";
    const output = [["a", "b", "c", " "]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "CommaFieldTest",
  async fn() {
    const input =
      `x,y,z,w\nx,y,z,\nx,y,,\nx,,,\n,,,\n"x","y","z","w"\n"x","y","z",""\n"x","y","",""\n"x","","",""\n"","","",""\n`;
    const output = [
      ["x", "y", "z", "w"],
      ["x", "y", "z", ""],
      ["x", "y", "", ""],
      ["x", "", "", ""],
      ["", "", "", ""],
      ["x", "y", "z", "w"],
      ["x", "y", "z", ""],
      ["x", "y", "", ""],
      ["x", "", "", ""],
      ["", "", "", ""],
    ];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "TrailingCommaIneffective1",
  async fn() {
    const input = "a,b,\nc,d,e";
    const output = [
      ["a", "b", ""],
      ["c", "d", "e"],
    ];
    assertEquals(await parse(input, { trimLeadingSpace: true }), output);
  },
});
Deno.test({
  name: "ReadAllReuseRecord",
  async fn() {
    const input = "a,b\nc,d";
    const output = [
      ["a", "b"],
      ["c", "d"],
    ];
    assertEquals(await parse(input), output);
    // ReuseRecord: true,
  },
});
Deno.test({
  name: "StartLine1", // Issue 19019
  async fn() {
    const input = 'a,"b\nc"d,e';
    await assertRejects(
      async () => await parse(input, { fieldsPerRecord: 2 }),
      ParseError,
      'record on line 1; parse error on line 2, column 1: extraneous or missing " in quoted-field',
    );
  },
});
Deno.test({
  name: "StartLine2",
  async fn() {
    const input = 'a,b\n"d\n\n,e';
    await assertRejects(
      async () => await parse(input, { fieldsPerRecord: 2 }),
      ParseError,
      'record on line 2; parse error on line 5, column 0: extraneous or missing " in quoted-field',
    );
  },
});
Deno.test({
  name: "CRLFInQuotedField", // Issue 21201
  async fn() {
    const input = 'A,"Hello\r\nHi",B\r\n';
    const output = [["A", "Hello\nHi", "B"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "BinaryBlobField", // Issue 19410
  async fn() {
    const input = "x09\x41\xb4\x1c,aktau";
    const output = [["x09A\xb4\x1c", "aktau"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "TrailingCR",
  async fn() {
    const input = "field1,field2\r";
    const output = [["field1", "field2"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "QuotedTrailingCR",
  async fn() {
    const input = '"field"\r';
    const output = [["field"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "QuotedTrailingCRCR",
  async fn() {
    const input = '"field"\r\r';
    await assertRejects(
      async () => await parse(input, { fieldsPerRecord: 2 }),
      ParseError,
      'parse error on line 1, column 6: extraneous or missing " in quoted-field',
    );
  },
});
Deno.test({
  name: "FieldCR",
  async fn() {
    const input = "field\rfield\r";
    const output = [["field\rfield"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "FieldCRCR",
  async fn() {
    const input = "field\r\rfield\r\r";
    const output = [["field\r\rfield\r"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "FieldCRCRLF",
  async fn() {
    const input = "field\r\r\nfield\r\r\n";
    const output = [["field\r"], ["field\r"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "FieldCRCRLFCR",
  async fn() {
    const input = "field\r\r\n\rfield\r\r\n\r";
    const output = [["field\r"], ["\rfield\r"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "FieldCRCRLFCRCR",
  async fn() {
    const input = "field\r\r\n\r\rfield\r\r\n\r\r";
    const output = [["field\r"], ["\r\rfield\r"], ["\r"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "MultiFieldCRCRLFCRCR",
  async fn() {
    const input = "field1,field2\r\r\n\r\rfield1,field2\r\r\n\r\r,";
    const output = [
      ["field1", "field2\r"],
      ["\r\rfield1", "field2\r"],
      ["\r\r", ""],
    ];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "NonASCIICommaAndComment",
  async fn() {
    const input = "a£b,c£ \td,e\n€ comment\n";
    const output = [["a", "b,c", "d,e"]];
    assertEquals(
      await parse(input, {
        trimLeadingSpace: true,
        separator: "£",
        comment: "€",
      }),
      output,
    );
  },
});
Deno.test({
  name: "NonASCIICommaAndCommentWithQuotes",
  async fn() {
    const input = 'a€"  b,"€ c\nλ comment\n';
    const output = [["a", "  b,", " c"]];
    assertEquals(
      await parse(input, { separator: "€", comment: "λ" }),
      output,
    );
  },
});
Deno.test(
  {
    // λ and θ start with the same byte.
    // This tests that the parser doesn't confuse such characters.
    name: "NonASCIICommaConfusion",
    async fn() {
      const input = '"abθcd"λefθgh';
      const output = [["abθcd", "efθgh"]];
      assertEquals(
        await parse(input, { separator: "λ", comment: "€" }),
        output,
      );
    },
  },
);
Deno.test({
  name: "NonASCIICommentConfusion",
  async fn() {
    const input = "λ\nλ\nθ\nλ\n";
    const output = [["λ"], ["λ"], ["λ"]];
    assertEquals(await parse(input, { comment: "θ" }), output);
  },
});
Deno.test({
  name: "QuotedFieldMultipleLF",
  async fn() {
    const input = '"\n\n\n\n"';
    const output = [["\n\n\n\n"]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "MultipleCRLF",
  async fn() {
    const input = "\r\n\r\n\r\n\r\n";
    const output: string[][] = [];
    assertEquals(await parse(input), output);
  },
  /**
   * The implementation may read each line in several chunks if
   * it doesn't fit entirely.
   * in the read buffer, so we should test the code to handle that condition.
   */
} /* TODO(kt3k): Enable this test case)
 Deno.test({
    name: "HugeLines",
    async fn() {
    const input = "#ignore\n".repeat(10000) + "@".repeat(5000) + ","
      "*".repeat(5000),
    const output = [["@".repeat(5000), "*".repeat(5000)]]
    assertEquals(await parse(input), output)
    Comment: "#",
  },
  }*/);
Deno.test({
  name: "QuoteWithTrailingCRLF",
  async fn() {
    const input = '"foo"bar"\r\n';
    await assertRejects(
      async () => await parse(input),
      ParseError,
      `parse error on line 1, column 4: extraneous or missing " in quoted-field`,
    );
  },
});
Deno.test({
  name: "LazyQuoteWithTrailingCRLF",
  async fn() {
    const input = '"foo"bar"\r\n';
    const output = [[`foo"bar`]];
    assertEquals(await parse(input, { lazyQuotes: true }), output);
  },
});
Deno.test({
  name: "DoubleQuoteWithTrailingCRLF",
  async fn() {
    const input = '"foo""bar"\r\n';
    const output = [[`foo"bar`]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "EvenQuotes",
  async fn() {
    const input = `""""""""`;
    const output = [[`"""`]];
    assertEquals(await parse(input), output);
  },
});
Deno.test({
  name: "OddQuotes",
  async fn() {
    const input = `"""""""`;
    await assertRejects(
      async () => await parse(input),
      ParseError,
      `parse error on line 1, column 7: extraneous or missing " in quoted-field`,
    );
  },
});
Deno.test({
  name: "LazyOddQuotes",
  async fn() {
    const input = `"""""""`;
    const output = [[`"""`]];
    assertEquals(await parse(input, { lazyQuotes: true }), output);
  },
});
Deno.test({
  name: "BadComma1",
  async fn() {
    const input = "";
    await assertRejects(
      async () => await parse(input, { separator: "\n" }),
      Error,
      "Invalid Delimiter",
    );
  },
});
Deno.test({
  name: "BadComma2",
  async fn() {
    const input = "";
    await assertRejects(
      async () => await parse(input, { separator: "\r" }),
      Error,
      "Invalid Delimiter",
    );
  },
});
Deno.test({
  name: "BadComma3",
  async fn() {
    const input = "";
    await assertRejects(
      async () => await parse(input, { separator: '"' }),
      Error,
      "Invalid Delimiter",
    );
  },
});
Deno.test({
  name: "BadComment1",
  async fn() {
    const input = "";
    await assertRejects(
      async () => await parse(input, { comment: "\n" }),
      Error,
      "Invalid Delimiter",
    );
  },
});
Deno.test({
  name: "BadComment2",
  async fn() {
    const input = "";
    await assertRejects(
      async () => await parse(input, { comment: "\r" }),
      Error,
      "Invalid Delimiter",
    );
  },
});
Deno.test({
  name: "BadCommaComment",
  async fn() {
    const input = "";
    await assertRejects(
      async () => await parse(input, { separator: "X", comment: "X" }),
      Error,
      "Invalid Delimiter",
    );
  },
});

Deno.test({
  name: "simple",
  async fn() {
    const input = "a,b,c";
    const output = [["a", "b", "c"]];
    assertEquals(await parse(input, { skipFirstRow: false }), output);
  },
});
Deno.test({
  name: "simple Bufreader",
  async fn() {
    const input = new BufReader(new StringReader("a,b,c"));
    const output = [["a", "b", "c"]];
    assertEquals(await parse(input, { skipFirstRow: false }), output);
  },
});
Deno.test({
  name: "multiline",
  async fn() {
    const input = "a,b,c\ne,f,g\n";
    const output = [
      ["a", "b", "c"],
      ["e", "f", "g"],
    ];
    assertEquals(await parse(input, { skipFirstRow: false }), output);
  },
});
Deno.test({
  name: "header mapping boolean",
  async fn() {
    const input = "a,b,c\ne,f,g\n";
    const output = [{ a: "e", b: "f", c: "g" }];
    assertEquals(await parse(input, { skipFirstRow: true }), output);
  },
});
Deno.test({
  name: "header mapping array",
  async fn() {
    const input = "a,b,c\ne,f,g\n";
    const output = [
      { this: "a", is: "b", sparta: "c" },
      { this: "e", is: "f", sparta: "g" },
    ];
    assertEquals(
      await parse(input, { columns: ["this", "is", "sparta"] }),
      output,
    );
  },
});
Deno.test({
  name: "header mapping object",
  async fn() {
    const input = "a,b,c\ne,f,g\n";
    const output = [
      { this: "a", is: "b", sparta: "c" },
      { this: "e", is: "f", sparta: "g" },
    ];
    assertEquals(
      await parse(input, {
        columns: [{ name: "this" }, { name: "is" }, { name: "sparta" }],
      }),
      output,
    );
  },
});
Deno.test({
  name: "provides both opts.skipFirstRow and opts.columns",
  async fn() {
    const input = "a,b,1\nc,d,2\ne,f,3";
    const output = [
      { foo: "c", bar: "d", baz: "2" },
      { foo: "e", bar: "f", baz: "3" },
    ];
    assertEquals(
      await parse(input, {
        skipFirstRow: true,
        columns: [{ name: "foo" }, { name: "bar" }, { name: "baz" }],
      }),
      output,
    );
  },
});
Deno.test({
  name: "mismatching number of headers and fields",
  async fn() {
    const input = "a,b,c\nd,e";
    await assertRejects(
      async () =>
        await parse(input, {
          skipFirstRow: true,
          columns: [{ name: "foo" }, { name: "bar" }, { name: "baz" }],
        }),
      Error,
      "Error number of fields line: 1\nNumber of fields found: 3\nExpected number of fields: 2",
    );
  },
});
