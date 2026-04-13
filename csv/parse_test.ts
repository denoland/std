// Test ported from Golang
// https://github.com/golang/go/blob/2cc15b1/src/encoding/csv/reader_test.go
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertThrows } from "@std/assert";
import { parse, type ParseOptions } from "./parse.ts";
import type { AssertTrue, IsExact } from "@std/testing/types";

const BYTE_ORDER_MARK = "\ufeff";

Deno.test({
  name: "parse() handles various inputs",
  async fn(t) {
    await t.step({
      name: "Simple",
      fn() {
        const input = "a,b,c\n";
        assertEquals(
          parse(input),
          [["a", "b", "c"]],
        );
      },
    });

    await t.step({
      name: "CRLF",
      fn() {
        const input = "a,b\r\nc,d\r\n";
        assertEquals(
          parse(input),
          [
            ["a", "b"],
            ["c", "d"],
          ],
        );
      },
    });

    await t.step({
      name: "BareCR",
      fn() {
        const input = "a,b\rc,d\r\n";
        assertEquals(
          parse(input),
          [["a", "b\rc", "d"]],
        );
      },
    });

    await t.step({
      name: "RFC4180test",
      fn() {
        const input =
          '#field1,field2,field3\n"aaa","bbb","ccc"\n"a,a","bbb","ccc"\nzzz,yyy,xxx';
        assertEquals(
          parse(input),
          [
            ["#field1", "field2", "field3"],
            ["aaa", "bbb", "ccc"],
            ["a,a", `bbb`, "ccc"],
            ["zzz", "yyy", "xxx"],
          ],
        );
      },
    });
    await t.step({
      name: "NoEOLTest",
      fn() {
        const input = "a,b,c";
        assertEquals(
          parse(input),
          [["a", "b", "c"]],
        );
      },
    });

    await t.step({
      name: "Semicolon",
      fn() {
        const input = "a;b;c\n";
        assertEquals(
          parse(input, { separator: ";" }),
          [["a", "b", "c"]],
        );
      },
    });

    await t.step({
      name: "MultiLine",
      fn() {
        const input = '"two\nline","one line","three\nline\nfield"';
        assertEquals(
          parse(input),
          [["two\nline", "one line", "three\nline\nfield"]],
        );
      },
    });

    await t.step({
      name: "BlankField",
      fn() {
        const input = "a,b,c\nd,,f";
        assertEquals(
          parse(input),
          [["a", "b", "c"], ["d", "", "f"]],
        );
      },
    });

    await t.step({
      name: "BlankField2",
      fn() {
        const input = "a,b,c\nd,,f";
        assertEquals(
          parse(input, { skipFirstRow: true }),
          [{ a: "d", b: "", c: "f" }],
        );
      },
    });

    await t.step({
      name: "BlankField3",
      fn() {
        const input = "a,b,c\nd,,f";
        assertEquals(
          parse(input, { columns: ["one", "two", "three"] }),
          [
            { one: "a", two: "b", three: "c" },
            { one: "d", two: "", three: "f" },
          ],
        );
      },
    });

    await t.step({
      name: "BlankLine",
      fn() {
        const input = "a,b,c\n\nd,e,f\n\n";
        assertEquals(
          parse(input),
          [
            ["a", "b", "c"],
            ["d", "e", "f"],
          ],
        );
      },
    });

    await t.step({
      name: "BlankLineFieldCount",
      fn() {
        const input = "a,b,c\n\nd,e,f\n\n";
        assertEquals(
          parse(input, { fieldsPerRecord: 0 }),
          [
            ["a", "b", "c"],
            ["d", "e", "f"],
          ],
        );
      },
    });

    await t.step({
      name: "TrimSpace",
      fn() {
        const input = " a,  b,   c\n";
        assertEquals(
          parse(input, { trimLeadingSpace: true }),
          [["a", "b", "c"]],
        );
      },
    });

    await t.step({
      name: "LeadingSpace",
      fn() {
        const input = " a,  b,   c\n";
        const output = [[" a", "  b", "   c"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "Comment",
      fn() {
        const input = "#1,2,3\na,b,c\n#comment";
        const output = [["a", "b", "c"]];
        assertEquals(parse(input, { comment: "#" }), output);
      },
    });
    await t.step({
      name: "NoComment",
      fn() {
        const input = "#1,2,3\na,b,c";
        const output = [
          ["#1", "2", "3"],
          ["a", "b", "c"],
        ];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "LazyQuotes",
      fn() {
        const input = `a "word","1"2",a","b`;
        const output = [[`a "word"`, `1"2`, `a"`, `b`]];
        assertEquals(parse(input, { lazyQuotes: true }), output);
      },
    });
    await t.step({
      name: "BareQuotes",
      fn() {
        const input = `a "word","1"2",a"`;
        const output = [[`a "word"`, `1"2`, `a"`]];
        assertEquals(parse(input, { lazyQuotes: true }), output);
      },
    });
    await t.step({
      name: "BareDoubleQuotes",
      fn() {
        const input = `a""b,c`;
        const output = [[`a""b`, `c`]];
        assertEquals(parse(input, { lazyQuotes: true }), output);
      },
    });
    await t.step({
      name: "BadDoubleQuotes",
      fn() {
        const input = `a""b,c`;
        assertThrows(
          () => parse(input),
          SyntaxError,
          'parse error on line 1, column 2: bare " in non-quoted-field',
        );
      },
    });
    await t.step({
      name: "error column Unicode code point number",
      fn() {
        const input = `a,b,🐱"`;
        assertThrows(
          () => parse(input),
          SyntaxError,
          'parse error on line 1, column 6: bare " in non-quoted-field',
        );
      },
    });
    await t.step({
      name: "TrimQuote",
      fn() {
        const input = ` "a"," b",c`;
        const output = [["a", " b", "c"]];
        assertEquals(parse(input, { trimLeadingSpace: true }), output);
      },
    });
    await t.step({
      name: "BadBareQuote",
      fn() {
        const input = `a "word","b"`;
        assertThrows(
          () => parse(input),
          SyntaxError,
          'parse error on line 1, column 3: bare " in non-quoted-field',
        );
      },
    });
    await t.step({
      name: "BadTrailingQuote",
      fn() {
        const input = `"a word",b"`;
        assertThrows(
          () => parse(input),
          SyntaxError,
          'parse error on line 1, column 11: bare " in non-quoted-field',
        );
      },
    });
    await t.step({
      name: "ExtraneousQuote",
      fn() {
        const input = `"a "word","b"`;
        assertThrows(
          () => parse(input),
          SyntaxError,
          `parse error on line 1, column 4: extraneous or missing " in quoted-field`,
        );
      },
    });
    await t.step({
      name: "BadFieldCount",
      fn() {
        const input = "a,b,c\nd,e";
        assertThrows(
          () => parse(input, { fieldsPerRecord: 0 }),
          SyntaxError,
          "Syntax error on line 2: expected 3 fields but got 2",
        );
      },
    });
    await t.step({
      name: "BadFieldCount1",
      fn() {
        const input = `a,b,c`;
        assertThrows(
          () => parse(input, { fieldsPerRecord: 2 }),
          SyntaxError,
          "Syntax error on line 1: expected 2 fields but got 3",
        );
      },
    });
    await t.step({
      name: "NegativeFieldsPerRecord",
      fn() {
        const input = `a,b,c\nd,e`;
        const output = [
          ["a", "b", "c"],
          ["d", "e"],
        ];
        assertEquals(parse(input, { fieldsPerRecord: -1 }), output);
      },
    });
    await t.step({
      name: "FieldCount",
      fn() {
        const input = "a,b,c\nd,e";
        const output = [
          ["a", "b", "c"],
          ["d", "e"],
        ];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "TrailingCommaEOF",
      fn() {
        const input = "a,b,c,";
        const output = [["a", "b", "c", ""]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "TrailingCommaEOL",
      fn() {
        const input = "a,b,c,\n";
        const output = [["a", "b", "c", ""]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "TrailingCommaSpaceEOF",
      fn() {
        const input = "a,b,c, ";
        const output = [["a", "b", "c", ""]];
        assertEquals(parse(input, { trimLeadingSpace: true }), output);
      },
    });
    await t.step({
      name: "TrailingCommaSpaceEOL",
      fn() {
        const input = "a,b,c, \n";
        const output = [["a", "b", "c", ""]];
        assertEquals(parse(input, { trimLeadingSpace: true }), output);
      },
    });
    await t.step({
      name: "TrailingCommaLine3",
      fn() {
        const input = "a,b,c\nd,e,f\ng,hi,";
        const output = [
          ["a", "b", "c"],
          ["d", "e", "f"],
          ["g", "hi", ""],
        ];
        assertEquals(parse(input, { trimLeadingSpace: true }), output);
      },
    });
    await t.step({
      name: "NotTrailingComma3",
      fn() {
        const input = "a,b,c, \n";
        const output = [["a", "b", "c", " "]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "CommaFieldTest",
      fn() {
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
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "TrailingCommaIneffective1",
      fn() {
        const input = "a,b,\nc,d,e";
        const output = [
          ["a", "b", ""],
          ["c", "d", "e"],
        ];
        assertEquals(parse(input, { trimLeadingSpace: true }), output);
      },
    });
    await t.step({
      name: "ReadAllReuseRecord",
      fn() {
        const input = "a,b\nc,d";
        const output = [
          ["a", "b"],
          ["c", "d"],
        ];
        assertEquals(parse(input), output);
        // ReuseRecord: true,
      },
    });
    await t.step({
      name: "StartLine1", // Issue 19019
      fn() {
        const input = `a,"b
c"d,e`;
        assertThrows(
          () => parse(input, { fieldsPerRecord: 2 }),
          SyntaxError,
          'Syntax error on line 1; parse error on line 2, column 2: extraneous or missing " in quoted-field',
        );
      },
    });
    await t.step({
      name: "StartLine2",
      fn() {
        const input = `a,b
"d

,e`;
        assertThrows(
          () => parse(input, { fieldsPerRecord: 2 }),
          SyntaxError,
          'Syntax error on line 2; parse error on line 4, column 1: extraneous or missing " in quoted-field',
        );
      },
    });
    await t.step({
      name: "ParseErrorLine",
      fn() {
        const input = `id,name

1,foo
2,"baz
`;
        assertThrows(
          () => parse(input),
          SyntaxError,
          'Syntax error on line 4; parse error on line 4, column 1: extraneous or missing " in quoted-field',
        );
      },
    });
    await t.step({
      name: "CRLFInQuotedField", // Issue 21201
      fn() {
        const input = 'A,"Hello\r\nHi",B\r\n';
        const output = [["A", "Hello\nHi", "B"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "BinaryBlobField", // Issue 19410
      fn() {
        const input = "x09\x41\xb4\x1c,aktau";
        const output = [["x09A\xb4\x1c", "aktau"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "TrailingCR",
      fn() {
        const input = "field1,field2\r";
        const output = [["field1", "field2"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "QuotedTrailingCR",
      fn() {
        const input = '"field"\r';
        const output = [["field"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "QuotedTrailingCRCR",
      fn() {
        const input = '"field"\r\r';
        assertThrows(
          () => parse(input, { fieldsPerRecord: 2 }),
          SyntaxError,
          'parse error on line 1, column 7: extraneous or missing " in quoted-field',
        );
      },
    });
    await t.step({
      name: "FieldCR",
      fn() {
        const input = "field\rfield\r";
        const output = [["field\rfield"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "FieldCRCR",
      fn() {
        const input = "field\r\rfield\r\r";
        const output = [["field\r\rfield\r"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "FieldCRCRLF",
      fn() {
        const input = "field\r\r\nfield\r\r\n";
        const output = [["field\r"], ["field\r"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "FieldCRCRLFCR",
      fn() {
        const input = "field\r\r\n\rfield\r\r\n\r";
        const output = [["field\r"], ["\rfield\r"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "FieldCRCRLFCRCR",
      fn() {
        const input = "field\r\r\n\r\rfield\r\r\n\r\r";
        const output = [["field\r"], ["\r\rfield\r"], ["\r"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "MultiFieldCRCRLFCRCR",
      fn() {
        const input = "field1,field2\r\r\n\r\rfield1,field2\r\r\n\r\r,";
        const output = [
          ["field1", "field2\r"],
          ["\r\rfield1", "field2\r"],
          ["\r\r", ""],
        ];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "NonASCIICommaAndComment",
      fn() {
        const input = "a£b,c£ \td,e\n€ comment\n";
        const output = [["a", "b,c", "d,e"]];
        assertEquals(
          parse(input, {
            trimLeadingSpace: true,
            separator: "£",
            comment: "€",
          }),
          output,
        );
      },
    });
    await t.step({
      name: "NonASCIICommaAndCommentWithQuotes",
      fn() {
        const input = 'a€"  b,"€ c\nλ comment\n';
        const output = [["a", "  b,", " c"]];
        assertEquals(
          parse(input, { separator: "€", comment: "λ" }),
          output,
        );
      },
    });
    await t.step(
      {
        // λ and θ start with the same byte.
        // This tests that the parser doesn't confuse such characters.
        name: "NonASCIICommaConfusion",
        fn() {
          const input = '"abθcd"λefθgh';
          const output = [["abθcd", "efθgh"]];
          assertEquals(
            parse(input, { separator: "λ", comment: "€" }),
            output,
          );
        },
      },
    );
    await t.step({
      name: "NonASCIICommentConfusion",
      fn() {
        const input = "λ\nλ\nθ\nλ\n";
        const output = [["λ"], ["λ"], ["λ"]];
        assertEquals(parse(input, { comment: "θ" }), output);
      },
    });
    await t.step({
      name: "QuotedFieldMultipleLF",
      fn() {
        const input = '"\n\n\n\n"';
        const output = [["\n\n\n\n"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "MultipleCRLF",
      fn() {
        const input = "\r\n\r\n\r\n\r\n";
        const output: string[][] = [];
        assertEquals(parse(input), output);
      },
      /**
       * The implementation may read each line in several chunks if
       * it doesn't fit entirely.
       * in the read buffer, so we should test the code to handle that condition.
       */
    } /* TODO(kt3k): Enable this test case)
     await t.step({
        name: "HugeLines",
        fn() {
        const input = "#ignore\n".repeat(10000) + "@".repeat(5000) + ","
          "*".repeat(5000),
        const output = [["@".repeat(5000), "*".repeat(5000)]]
        assertEquals(parse(input), output)
        Comment: "#",
      },
      }*/);
    await t.step({
      name: "QuoteWithTrailingCRLF",
      fn() {
        const input = '"foo"bar"\r\n';
        assertThrows(
          () => parse(input),
          SyntaxError,
          `parse error on line 1, column 5: extraneous or missing " in quoted-field`,
        );
      },
    });
    await t.step({
      name: "LazyQuoteWithTrailingCRLF",
      fn() {
        const input = '"foo"bar"\r\n';
        const output = [[`foo"bar`]];
        assertEquals(parse(input, { lazyQuotes: true }), output);
      },
    });
    await t.step({
      name: "DoubleQuoteWithTrailingCRLF",
      fn() {
        const input = '"foo""bar"\r\n';
        const output = [[`foo"bar`]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "EvenQuotes",
      fn() {
        const input = `""""""""`;
        const output = [[`"""`]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "OddQuotes",
      fn() {
        const input = `"""""""`;
        assertThrows(
          () => parse(input),
          SyntaxError,
          `parse error on line 1, column 8: extraneous or missing " in quoted-field`,
        );
      },
    });
    await t.step({
      name: "LazyOddQuotes",
      fn() {
        const input = `"""""""`;
        const output = [[`"""`]];
        assertEquals(parse(input, { lazyQuotes: true }), output);
      },
    });
    await t.step({
      name: "BadComma1",
      fn() {
        const input = "";
        assertThrows(
          () => parse(input, { separator: "\n" }),
          Error,
          "Cannot parse input: invalid delimiter",
        );
      },
    });
    await t.step({
      name: "BadComma2",
      fn() {
        const input = "";
        assertThrows(
          () => parse(input, { separator: "\r" }),
          Error,
          "Cannot parse input: invalid delimiter",
        );
      },
    });
    await t.step({
      name: "BadComma3",
      fn() {
        const input = "";
        assertThrows(
          () => parse(input, { separator: '"' }),
          Error,
          "Cannot parse input: invalid delimiter",
        );
      },
    });
    await t.step({
      name: "BadComment1",
      fn() {
        const input = "";
        assertThrows(
          () => parse(input, { comment: "\n" }),
          Error,
          "Cannot parse input: invalid delimiter",
        );
      },
    });
    await t.step({
      name: "BadComment2",
      fn() {
        const input = "";
        assertThrows(
          () => parse(input, { comment: "\r" }),
          Error,
          "Cannot parse input: invalid delimiter",
        );
      },
    });
    await t.step({
      name: "BadCommaComment",
      fn() {
        const input = "";
        assertThrows(
          () => parse(input, { separator: "X", comment: "X" }),
          Error,
          "Cannot parse input: invalid delimiter",
        );
      },
    });

    await t.step({
      name: "simple",
      fn() {
        const input = "a,b,c";
        const output = [["a", "b", "c"]];
        assertEquals(parse(input, { skipFirstRow: false }), output);
      },
    });
    await t.step({
      name: "simple Bufreader",
      fn() {
        const input = "a,b,c";
        const output = [["a", "b", "c"]];
        assertEquals(parse(input, { skipFirstRow: false }), output);
      },
    });
    await t.step({
      name: "multiline",
      fn() {
        const input = "a,b,c\ne,f,g\n";
        const output = [
          ["a", "b", "c"],
          ["e", "f", "g"],
        ];
        assertEquals(parse(input, { skipFirstRow: false }), output);
      },
    });
    await t.step({
      name: "header mapping boolean",
      fn() {
        const input = "a,b,c\ne,f,g\n";
        const output = [{ a: "e", b: "f", c: "g" }];
        assertEquals(parse(input, { skipFirstRow: true }), output);
      },
    });
    await t.step({
      name: "header mapping array",
      fn() {
        const input = "a,b,c\ne,f,g\n";
        const output = [
          { this: "a", is: "b", sparta: "c" },
          { this: "e", is: "f", sparta: "g" },
        ];
        assertEquals(
          parse(input, { columns: ["this", "is", "sparta"] }),
          output,
        );
      },
    });

    await t.step({
      name: "provides both opts.skipFirstRow and opts.columns",
      fn() {
        const input = "a,b,1\nc,d,2\ne,f,3";
        const output = [
          { foo: "c", bar: "d", baz: "2" },
          { foo: "e", bar: "f", baz: "3" },
        ];
        assertEquals(
          parse(input, {
            skipFirstRow: true,
            columns: ["foo", "bar", "baz"],
          }),
          output,
        );
      },
    });
    await t.step({
      name: "mismatching number of headers and fields 1",
      fn() {
        const input = "a,b,c\nd,e";
        assertThrows(
          () =>
            parse(input, {
              skipFirstRow: true,
              columns: ["foo", "bar", "baz"],
            }),
          Error,
          "Syntax error on line 2: The record has 2 fields, but the header has 3 fields",
        );
      },
    });
    await t.step({
      name: "mismatching number of headers and fields 2",
      fn() {
        const input = "a,b,c\nd,e,,g";
        assertThrows(
          () =>
            parse(input, {
              skipFirstRow: true,
              columns: ["foo", "bar", "baz"],
            }),
          Error,
          "Syntax error on line 2: The record has 4 fields, but the header has 3 fields",
        );
      },
    });
    await t.step({
      name: "Strips leading byte-order mark with bare cell",
      fn() {
        const input = `${BYTE_ORDER_MARK}abc`;
        const output = [["abc"]];
        assert(!JSON.stringify(output).includes(BYTE_ORDER_MARK));
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "Strips leading byte-order mark with quoted cell",
      fn() {
        const input = `${BYTE_ORDER_MARK}"a""b"`;
        const output = [['a"b']];
        assert(!JSON.stringify(output).includes(BYTE_ORDER_MARK));
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "Does not strip byte-order mark after position [0]",
      fn() {
        const input = `a${BYTE_ORDER_MARK}bc`;
        const output = [[`a${BYTE_ORDER_MARK}bc`]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name:
        "trimLeadingSpace strips leading byte-order mark followed by whitespace",
      fn() {
        const input = `${BYTE_ORDER_MARK} abc`;
        const output = [["abc"]];
        assertEquals(parse(input, { trimLeadingSpace: true }), output);
      },
    });
    await t.step({
      // This behavior is due to String#trimStart including U+FEFF in the set of
      // characters to be trimmed
      name:
        "trimLeadingSpace strips leading whitespace followed by byte-order mark",
      fn() {
        const input = ` ${BYTE_ORDER_MARK}abc`;
        const output = [["abc"]];
        assertEquals(parse(input, { trimLeadingSpace: true }), output);
      },
    });
    await t.step({
      name: "leading line breaks",
      fn() {
        const input = "\n\na,b,c";
        const output = [["a", "b", "c"]];
        assertEquals(parse(input), output);
      },
    });
    await t.step({
      name: "throws when skipFirstRow=true with empty data",
      fn() {
        assertThrows(
          () => parse("", { skipFirstRow: true }),
          Error,
          "Cannot parse input: headers must be defined",
        );
      },
    });
  },
});

Deno.test({
  name: "parse() is correctly typed",
  fn() {
    // If no option is passed, defaults to string[][]
    {
      const parsed = parse("a\nb");
      type _ = AssertTrue<IsExact<typeof parsed, string[][]>>;
    }
    {
      const parsed = parse("a\nb");
      type _ = AssertTrue<IsExact<typeof parsed, string[][]>>;
    }
    {
      // `skipFirstRow` may be `true` or `false`.
      // `columns` may be `undefined` or `string[]`.
      // If you don't know exactly what the value of the option is,
      // the return type is string[][] | Record<string, string>[]
      const options: ParseOptions = {};
      const parsed = parse("a\nb", options);
      type _ = AssertTrue<
        IsExact<
          typeof parsed,
          string[][] | Record<string, string>[]
        >
      >;
    }
    {
      const parsed = parse("a\nb", {});
      type _ = AssertTrue<IsExact<typeof parsed, string[][]>>;
    }

    // skipFirstRow option
    {
      const parsed = parse("a\nb", {});
      type _ = AssertTrue<IsExact<typeof parsed, string[][]>>;
    }
    {
      const parsed = parse("a\nb", { skipFirstRow: false });
      type _ = AssertTrue<IsExact<typeof parsed, string[][]>>;
    }
    {
      const parsed = parse("a\nb", { skipFirstRow: true });
      type _ = AssertTrue<
        IsExact<typeof parsed, Record<string, string>[]>
      >;
    }

    // columns option
    {
      const parsed = parse("a\nb", {});
      type _ = AssertTrue<IsExact<typeof parsed, string[][]>>;
    }
    {
      const parsed = parse("a,b\nc,d", { columns: ["aaa", "bbb"] });
      type _ = AssertTrue<
        IsExact<typeof parsed, Record<"aaa" | "bbb", string>[]>
      >;
    }
    {
      const parsed = parse("a\nb", { columns: ["aaa"] as string[] });
      type _ = AssertTrue<
        IsExact<typeof parsed, Record<string, string>[]>
      >;
    }

    // skipFirstRow option + columns option
    {
      const parsed = parse(
        "a\nb",
        { skipFirstRow: false },
      );
      type _ = AssertTrue<IsExact<typeof parsed, string[][]>>;
    }
    {
      const parsed = parse(
        "a\nb",
        { skipFirstRow: true },
      );
      type _ = AssertTrue<
        IsExact<typeof parsed, Record<string, string>[]>
      >;
    }
    {
      const parsed = parse("a\nb", { skipFirstRow: false, columns: ["aaa"] });
      type _ = AssertTrue<
        IsExact<typeof parsed, Record<"aaa", string>[]>
      >;
    }
    {
      const parsed = parse("a\nb", { skipFirstRow: true, columns: ["aaa"] });
      type _ = AssertTrue<
        IsExact<typeof parsed, Record<"aaa", string>[]>
      >;
    }
  },
});
