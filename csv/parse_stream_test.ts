// Copyright 2018-2026 the Deno authors. MIT license.
import { CsvParseStream } from "./parse_stream.ts";
import type { CsvParseStreamOptions } from "./parse_stream.ts";
import { assert, assertEquals, assertRejects } from "@std/assert";
import type { AssertTrue, IsExact } from "@std/testing/types";
import { fromFileUrl, join } from "@std/path";
import { delay } from "@std/async/delay";

const testdataDir = join(fromFileUrl(import.meta.url), "../testdata");
const encoder = new TextEncoder();

Deno.test({
  name: "CsvParseStream should work with Deno.FsFile's readable",
  permissions: {
    read: [testdataDir],
  },
  fn: async () => {
    const file = await Deno.open(join(testdataDir, "simple.csv"));
    const readable = file.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new CsvParseStream());
    const records = await Array.fromAsync(readable);
    assertEquals(records, [
      ["id", "name"],
      ["1", "foobar"],
      ["2", "barbaz"],
    ]);
  },
});

Deno.test({
  name: "CsvParseStream throws at invalid csv line",
  fn: async () => {
    const readable = ReadableStream.from([
      encoder.encode("id,name\n"),
      encoder.encode("\n"),
      encoder.encode("1,foo\n"),
      encoder.encode('2,"baz\n'),
    ]).pipeThrough(new TextDecoderStream()).pipeThrough(
      new CsvParseStream(),
    );
    const reader = readable.getReader();
    assertEquals(await reader.read(), { done: false, value: ["id", "name"] });
    assertEquals(await reader.read(), { done: false, value: ["1", "foo"] });
    await assertRejects(
      () => reader.read(),
      SyntaxError,
      `Syntax error on line 4; parse error on line 5, column 1: extraneous or missing " in quoted-field`,
    );
  },
});

Deno.test({
  name: "CsvParseStream handles various inputs",
  permissions: "none",
  fn: async (t) => {
    // These test cases were originally ported from Go:
    // https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/
    // Copyright 2011 The Go Authors. All rights reserved. BSD license.
    // https://github.com/golang/go/blob/master/LICENSE
    const testCases = [
      {
        name: "CRLF",
        input: "a,b\r\nc,d\r\n",
        output: [["a", "b"], ["c", "d"]],
      },
      {
        name: "BareCR",
        input: "a,b\rc,d\r\n",
        output: [["a", "b\rc", "d"]],
      },
      {
        name: "NoEOLTest",
        input: "a,b,c",
        output: [["a", "b", "c"]],
      },
      {
        name: "Semicolon",
        input: "a;b;c\n",
        output: [["a", "b", "c"]],
        separator: ";",
      },
      {
        name: "Separator is undefined",
        input: "a,b,c\n",
        output: [["a", "b", "c"]],
        separator: undefined,
      },
      {
        name: "MultiLine",
        input: `"two
line","one line","three
line
field"`,
        output: [["two\nline", "one line", "three\nline\nfield"]],
      },
      {
        name: "BlankLine",
        input: "a,b,c\n\nd,e,f\n\n",
        output: [
          ["a", "b", "c"],
          ["d", "e", "f"],
        ],
      },
      {
        name: "LeadingSpace",
        input: " a,  b,   c\n",
        output: [[" a", "  b", "   c"]],
      },
      {
        name: "trimLeadingSpace = true",
        input: " a,  b,   c\n",
        output: [["a", "b", "c"]],
        trimLeadingSpace: true,
      },
      {
        name: "Comment",
        input: "#1,2,3\na,b,c\n#comment",
        output: [["a", "b", "c"]],
        comment: "#",
      },
      {
        name: "NoComment",
        input: "#1,2,3\na,b,c",
        output: [
          ["#1", "2", "3"],
          ["a", "b", "c"],
        ],
      },
      {
        name: "fieldsPerRecord - variable number of fields is allowed",
        input: "a,b,c\nd,e",
        output: [
          ["a", "b", "c"],
          ["d", "e"],
        ],
      },
      {
        name: "fieldsPerRecord = -42 - variable number of fields is allowed",
        input: "a,b,c\nd,e",
        output: [
          ["a", "b", "c"],
          ["d", "e"],
        ],
        fieldsPerRecord: -42,
      },
      {
        name:
          "fieldsPerRecord = 0 - the number of fields is inferred from the first row",
        input: "a,b,c\nd,e,f",
        output: [
          ["a", "b", "c"],
          ["d", "e", "f"],
        ],
        fieldsPerRecord: 0,
      },
      {
        name:
          "fieldsPerRecord = 0 - inferred number of fields does not match subsequent rows",
        input: "a,b,c\nd,e",
        fieldsPerRecord: 0,
        error: {
          klass: SyntaxError,
          msg: "Syntax error on line 2: expected 3 fields but got 2",
        },
      },
      {
        name:
          "fieldsPerRecord = 3 - SyntaxError is thrown when the number of fields is not 2",
        input: "a,b,c\nd,e",
        fieldsPerRecord: 3,
        error: {
          klass: SyntaxError,
          msg: "Syntax error on line 2: expected 3 fields but got 2",
        },
      },
      {
        name: "TrailingCommaEOF",
        input: "a,b,c,",
        output: [["a", "b", "c", ""]],
      },
      {
        name: "TrailingCommaEOL",
        input: "a,b,c,\n",
        output: [["a", "b", "c", ""]],
      },
      {
        name: "NotTrailingComma3",
        input: "a,b,c, \n",
        output: [["a", "b", "c", " "]],
      },
      {
        name: "CommaFieldTest",
        input: `x,y,z,w
x,y,z,
x,y,,
x,,,
,,,
"x","y","z","w"
"x","y","z",""
"x","y","",""
"x","","",""
"","","",""
`,
        output: [
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
        ],
      },
      {
        name: "CRLFInQuotedField", // Issue 21201
        input: 'A,"Hello\r\nHi",B\r\n',
        output: [["A", "Hello\nHi", "B"]],
      },
      {
        name: "BinaryBlobField", // Issue 19410
        input: "x09\x41\xb4\x1c,aktau",
        output: [["x09A\xb4\x1c", "aktau"]],
      },
      {
        name: "TrailingCR",
        input: "field1,field2\r",
        output: [["field1", "field2"]],
      },
      {
        name: "QuotedTrailingCR",
        input: '"field"\r',
        output: [["field"]],
      },
      {
        name: "FieldCR",
        input: "field\rfield\r",
        output: [["field\rfield"]],
      },
      {
        name: "FieldCRCR",
        input: "field\r\rfield\r\r",
        output: [["field\r\rfield\r"]],
      },
      {
        name: "FieldCRCRLF",
        input: "field\r\r\nfield\r\r\n",
        output: [["field\r"], ["field\r"]],
      },
      {
        name: "FieldCRCRLFCR",
        input: "field\r\r\n\rfield\r\r\n\r",
        output: [["field\r"], ["\rfield\r"]],
      },
      {
        name: "MultiFieldCRCRLFCRCR",
        input: "field1,field2\r\r\n\r\rfield1,field2\r\r\n\r\r,",
        output: [
          ["field1", "field2\r"],
          ["\r\rfield1", "field2\r"],
          ["\r\r", ""],
        ],
      },
      {
        name: "NonASCIICommaAndCommentWithQuotes",
        input: 'a€"  b,"€ c\nλ comment\n',
        output: [["a", "  b,", " c"]],
        separator: "€",
        comment: "λ",
      },
      {
        // λ and θ start with the same byte.
        // This tests that the parser doesn't confuse such characters.
        name: "NonASCIICommaConfusion",
        input: '"abθcd"λefθgh',
        output: [["abθcd", "efθgh"]],
        separator: "λ",
        comment: "€",
      },
      {
        name: "NonASCIICommentConfusion",
        input: "λ\nλ\nθ\nλ\n",
        output: [["λ"], ["λ"], ["λ"]],
        comment: "θ",
      },
      {
        name: "QuotedFieldMultipleLF",
        input: '"\n\n\n\n"',
        output: [["\n\n\n\n"]],
      },
      {
        name: "MultipleCRLF",
        input: "\r\n\r\n\r\n\r\n",
        output: [],
      },
      {
        name: "DoubleQuoteWithTrailingCRLF",
        input: '"foo""bar"\r\n',
        output: [[`foo"bar`]],
      },
      {
        name: "EvenQuotes",
        input: `""""""""`,
        output: [[`"""`]],
      },
      {
        name: "simple",
        input: "a,b,c",
        output: [["a", "b", "c"]],
        skipFirstRow: false,
      },
      {
        name: "multiline",
        input: "a,b,c\ne,f,g\n",
        output: [
          ["a", "b", "c"],
          ["e", "f", "g"],
        ],
        skipFirstRow: false,
      },
      {
        name: "header mapping boolean",
        input: "a,b,c\ne,f,g\n",
        output: [{ a: "e", b: "f", c: "g" }],
        skipFirstRow: true,
      },
      {
        name: "header mapping array",
        input: "a,b,c\ne,f,g\n",
        output: [
          { this: "a", is: "b", sparta: "c" },
          { this: "e", is: "f", sparta: "g" },
        ],
        columns: ["this", "is", "sparta"],
      },
      {
        name: "provides both opts.skipFirstRow and opts.columns",
        input: "a,b,1\nc,d,2\ne,f,3",
        output: [
          { foo: "c", bar: "d", baz: "2" },
          { foo: "e", bar: "f", baz: "3" },
        ],
        skipFirstRow: true,
        columns: ["foo", "bar", "baz"],
      },
      {
        name: "mismatching number of headers and fields 1",
        input: "a,b,c\nd,e",
        skipFirstRow: true,
        columns: ["foo", "bar", "baz"],
        error: {
          klass: Error,
          msg:
            "Syntax error on line 2: The record has 2 fields, but the header has 3 fields",
        },
      },
      {
        name: "mismatching number of headers and fields 2",
        input: "a,b,c\nd,e,,g",
        skipFirstRow: true,
        columns: ["foo", "bar", "baz"],
        error: {
          klass: Error,
          msg:
            "Syntax error on line 2: The record has 4 fields, but the header has 3 fields",
        },
      },
      {
        name: "bad quote in bare field",
        input: `a "word",1,2,3`,
        error: {
          klass: SyntaxError,
          msg:
            'Syntax error on line 1; parse error on line 1, column 3: bare " in non-quoted-field',
        },
      },
      {
        name: "bad quote in quoted field",
        input: `"wo"rd",1,2,3`,
        error: {
          klass: SyntaxError,
          msg:
            'Syntax error on line 1; parse error on line 1, column 4: extraneous or missing " in quoted-field',
        },
      },
      {
        name: "bad quote at line 1 in quoted field with newline",
        input: `"w\n\no"rd",1,2,3`,
        error: {
          klass: SyntaxError,
          msg:
            'Syntax error on line 1; parse error on line 3, column 2: extraneous or missing " in quoted-field',
        },
      },
      {
        name: "bad quote at line 2 in quoted field with newline",
        input: `a,b,c,d\n"w\n\no"rd",1,2,3`,
        error: {
          klass: SyntaxError,
          msg:
            'Syntax error on line 2; parse error on line 4, column 2: extraneous or missing " in quoted-field',
        },
      },
      {
        name: "lazy quote",
        input: `a "word","1"2",a","b`,
        output: [[`a "word"`, `1"2`, `a"`, `b`]],
        lazyQuotes: true,
      },
    ];
    for (const testCase of testCases) {
      await t.step(testCase.name, async () => {
        const options: CsvParseStreamOptions = {};
        if ("separator" in testCase) {
          // @ts-expect-error: explicitly giving undefined
          options.separator = testCase.separator;
        }
        if ("comment" in testCase) {
          options.comment = testCase.comment;
        }
        if ("trimLeadingSpace" in testCase) {
          options.trimLeadingSpace = testCase.trimLeadingSpace;
        }
        if ("lazyQuotes" in testCase) {
          options.lazyQuotes = testCase.lazyQuotes;
        }
        if ("fieldsPerRecord" in testCase) {
          options.fieldsPerRecord = testCase.fieldsPerRecord;
        }
        if ("skipFirstRow" in testCase) {
          options.skipFirstRow = testCase.skipFirstRow;
        }
        if ("columns" in testCase) {
          options.columns = testCase.columns;
        }

        const readable = ReadableStream.from([testCase.input])
          .pipeThrough(new CsvParseStream(options));

        if (testCase.output) {
          const actual = await Array.fromAsync(readable);
          assertEquals(actual, testCase.output);
        } else {
          assert(testCase.error);
          await assertRejects(
            async () => {
              for await (const _ of readable);
            },
            testCase.error.klass,
            testCase.error.msg,
          );
        }
      });
    }
  },
});

Deno.test({
  name:
    "CsvParseStream.cancel() does not leak file when called in the middle of iteration",
  permissions: { read: [testdataDir] },
  fn: async () => {
    const file = await Deno.open(join(testdataDir, "large.csv"));
    const readable = file.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new CsvParseStream());
    for await (const _record of readable) {
      break;
    }
    // FIXME(kt3k): Remove this delay.
    await delay(100);
  },
});

Deno.test({
  name: "CsvParseStream is correctly typed",
  fn() {
    // If no option is passed, defaults to ReadableStream<string[]>.
    {
      const { readable } = new CsvParseStream();
      type _ = AssertTrue<IsExact<typeof readable, ReadableStream<string[]>>>;
    }
    {
      const { readable } = new CsvParseStream(undefined);
      type _ = AssertTrue<IsExact<typeof readable, ReadableStream<string[]>>>;
    }
    {
      // `skipFirstRow` may be `true` or `false`.
      // `columns` may be `undefined` or `string[]`.
      // If you don't know exactly what the value of the option is,
      // the return type is ReadableStream<string[] | Record<string, string>>
      const options: CsvParseStreamOptions = {};
      const { readable } = new CsvParseStream(options);
      type _ = AssertTrue<
        IsExact<
          typeof readable,
          ReadableStream<string[] | Record<string, string>>
        >
      >;
    }
    {
      const { readable } = new CsvParseStream({});
      type _ = AssertTrue<IsExact<typeof readable, ReadableStream<string[]>>>;
    }

    // skipFirstRow option
    {
      const { readable } = new CsvParseStream({});
      type _ = AssertTrue<IsExact<typeof readable, ReadableStream<string[]>>>;
    }
    {
      const { readable } = new CsvParseStream({ skipFirstRow: false });
      type _ = AssertTrue<IsExact<typeof readable, ReadableStream<string[]>>>;
    }
    {
      const { readable } = new CsvParseStream({ skipFirstRow: true });
      type _ = AssertTrue<
        IsExact<
          typeof readable,
          ReadableStream<Record<string, string>>
        >
      >;
    }

    // columns option
    {
      const { readable } = new CsvParseStream({});
      type _ = AssertTrue<IsExact<typeof readable, ReadableStream<string[]>>>;
    }
    {
      const { readable } = new CsvParseStream({ columns: ["aaa", "bbb"] });
      type _ = AssertTrue<
        IsExact<typeof readable, ReadableStream<Record<"aaa" | "bbb", string>>>
      >;
    }
    {
      const { readable } = new CsvParseStream({ columns: ["aaa"] as string[] });
      type _ = AssertTrue<
        IsExact<
          typeof readable,
          ReadableStream<Record<string, string>>
        >
      >;
    }

    // skipFirstRow option + columns option
    {
      const { readable } = new CsvParseStream({ skipFirstRow: false });
      type _ = AssertTrue<IsExact<typeof readable, ReadableStream<string[]>>>;
    }
    {
      const { readable } = new CsvParseStream({ skipFirstRow: true });
      type _ = AssertTrue<
        IsExact<
          typeof readable,
          ReadableStream<Record<string, string>>
        >
      >;
    }
    {
      const { readable } = new CsvParseStream({
        skipFirstRow: false,
        columns: ["aaa"],
      });
      type _ = AssertTrue<
        IsExact<typeof readable, ReadableStream<Record<"aaa", string>>>
      >;
    }
    {
      const { readable } = new CsvParseStream({
        skipFirstRow: true,
        columns: ["aaa"],
      });
      type _ = AssertTrue<
        IsExact<typeof readable, ReadableStream<Record<"aaa", string>>>
      >;
    }
  },
});
