// Test ported from Golang
// https://github.com/golang/go/blob/2cc15b1/src/encoding/csv/reader_test.go
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../testing/asserts.ts";
import {
  Column,
  DataItem,
  ERR_BARE_QUOTE,
  ERR_FIELD_COUNT,
  ERR_INVALID_DELIM,
  ERR_QUOTE,
  NEWLINE,
  parse,
  ParseError,
  readMatrix,
  stringify,
  StringifyError,
  StringifyOptions,
} from "./csv.ts";
import { StringReader } from "../io/readers.ts";
import { BufReader } from "../io/buffer.ts";

// Test cases for `readMatrix()`
const testCases = [
  {
    Name: "Simple",
    Input: "a,b,c\n",
    Output: [["a", "b", "c"]],
  },
  {
    Name: "CRLF",
    Input: "a,b\r\nc,d\r\n",
    Output: [
      ["a", "b"],
      ["c", "d"],
    ],
  },
  {
    Name: "BareCR",
    Input: "a,b\rc,d\r\n",
    Output: [["a", "b\rc", "d"]],
  },
  {
    Name: "RFC4180test",
    Input: `#field1,field2,field3
"aaa","bbb","ccc"
"a,a","bbb","ccc"
zzz,yyy,xxx`,
    UseFieldsPerRecord: true,
    FieldsPerRecord: 0,
    Output: [
      ["#field1", "field2", "field3"],
      ["aaa", "bbb", "ccc"],
      ["a,a", `bbb`, "ccc"],
      ["zzz", "yyy", "xxx"],
    ],
  },
  {
    Name: "NoEOLTest",
    Input: "a,b,c",
    Output: [["a", "b", "c"]],
  },
  {
    Name: "Semicolon",
    Input: "a;b;c\n",
    Output: [["a", "b", "c"]],
    Separator: ";",
  },
  {
    Name: "MultiLine",
    Input: `"two
line","one line","three
line
field"`,
    Output: [["two\nline", "one line", "three\nline\nfield"]],
  },
  {
    Name: "BlankLine",
    Input: "a,b,c\n\nd,e,f\n\n",
    Output: [
      ["a", "b", "c"],
      ["d", "e", "f"],
    ],
  },
  {
    Name: "BlankLineFieldCount",
    Input: "a,b,c\n\nd,e,f\n\n",
    Output: [
      ["a", "b", "c"],
      ["d", "e", "f"],
    ],
    UseFieldsPerRecord: true,
    FieldsPerRecord: 0,
  },
  {
    Name: "TrimSpace",
    Input: " a,  b,   c\n",
    Output: [["a", "b", "c"]],
    TrimLeadingSpace: true,
  },
  {
    Name: "LeadingSpace",
    Input: " a,  b,   c\n",
    Output: [[" a", "  b", "   c"]],
  },
  {
    Name: "Comment",
    Input: "#1,2,3\na,b,c\n#comment",
    Output: [["a", "b", "c"]],
    Comment: "#",
  },
  {
    Name: "NoComment",
    Input: "#1,2,3\na,b,c",
    Output: [
      ["#1", "2", "3"],
      ["a", "b", "c"],
    ],
  },
  {
    Name: "LazyQuotes",
    Input: `a "word","1"2",a","b`,
    Output: [[`a "word"`, `1"2`, `a"`, `b`]],
    LazyQuotes: true,
  },
  {
    Name: "BareQuotes",
    Input: `a "word","1"2",a"`,
    Output: [[`a "word"`, `1"2`, `a"`]],
    LazyQuotes: true,
  },
  {
    Name: "BareDoubleQuotes",
    Input: `a""b,c`,
    Output: [[`a""b`, `c`]],
    LazyQuotes: true,
  },
  {
    Name: "BadDoubleQuotes",
    Input: `a""b,c`,
    Error: new ParseError(1, 1, 1, ERR_BARE_QUOTE),
  },
  {
    Name: "TrimQuote",
    Input: ` "a"," b",c`,
    Output: [["a", " b", "c"]],
    TrimLeadingSpace: true,
  },
  {
    Name: "BadBareQuote",
    Input: `a "word","b"`,
    Error: new ParseError(1, 1, 2, ERR_BARE_QUOTE),
  },
  {
    Name: "BadTrailingQuote",
    Input: `"a word",b"`,
    Error: new ParseError(1, 1, 10, ERR_BARE_QUOTE),
  },
  {
    Name: "ExtraneousQuote",
    Input: `"a "word","b"`,
    Error: new ParseError(1, 1, 3, ERR_QUOTE),
  },
  {
    Name: "BadFieldCount",
    Input: "a,b,c\nd,e",
    Error: new ParseError(2, 2, null, ERR_FIELD_COUNT),
    UseFieldsPerRecord: true,
    FieldsPerRecord: 0,
  },
  {
    Name: "BadFieldCount1",
    Input: `a,b,c`,
    UseFieldsPerRecord: true,
    FieldsPerRecord: 2,
    Error: new ParseError(1, 1, null, ERR_FIELD_COUNT),
  },
  {
    Name: "FieldCount",
    Input: "a,b,c\nd,e",
    Output: [
      ["a", "b", "c"],
      ["d", "e"],
    ],
  },
  {
    Name: "TrailingCommaEOF",
    Input: "a,b,c,",
    Output: [["a", "b", "c", ""]],
  },
  {
    Name: "TrailingCommaEOL",
    Input: "a,b,c,\n",
    Output: [["a", "b", "c", ""]],
  },
  {
    Name: "TrailingCommaSpaceEOF",
    Input: "a,b,c, ",
    Output: [["a", "b", "c", ""]],
    TrimLeadingSpace: true,
  },
  {
    Name: "TrailingCommaSpaceEOL",
    Input: "a,b,c, \n",
    Output: [["a", "b", "c", ""]],
    TrimLeadingSpace: true,
  },
  {
    Name: "TrailingCommaLine3",
    Input: "a,b,c\nd,e,f\ng,hi,",
    Output: [
      ["a", "b", "c"],
      ["d", "e", "f"],
      ["g", "hi", ""],
    ],
    TrimLeadingSpace: true,
  },
  {
    Name: "NotTrailingComma3",
    Input: "a,b,c, \n",
    Output: [["a", "b", "c", " "]],
  },
  {
    Name: "CommaFieldTest",
    Input: `x,y,z,w
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
    Output: [
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
    Name: "TrailingCommaIneffective1",
    Input: "a,b,\nc,d,e",
    Output: [
      ["a", "b", ""],
      ["c", "d", "e"],
    ],
    TrimLeadingSpace: true,
  },
  {
    Name: "ReadAllReuseRecord",
    Input: "a,b\nc,d",
    Output: [
      ["a", "b"],
      ["c", "d"],
    ],
    ReuseRecord: true,
  },
  {
    Name: "StartLine1", // Issue 19019
    Input: 'a,"b\nc"d,e',
    Error: new ParseError(1, 2, 1, ERR_QUOTE),
  },
  {
    Name: "StartLine2",
    Input: 'a,b\n"d\n\n,e',
    Error: new ParseError(2, 5, 0, ERR_QUOTE),
  },
  {
    Name: "CRLFInQuotedField", // Issue 21201
    Input: 'A,"Hello\r\nHi",B\r\n',
    Output: [["A", "Hello\nHi", "B"]],
  },
  {
    Name: "BinaryBlobField", // Issue 19410
    Input: "x09\x41\xb4\x1c,aktau",
    Output: [["x09A\xb4\x1c", "aktau"]],
  },
  {
    Name: "TrailingCR",
    Input: "field1,field2\r",
    Output: [["field1", "field2"]],
  },
  {
    Name: "QuotedTrailingCR",
    Input: '"field"\r',
    Output: [["field"]],
  },
  {
    Name: "QuotedTrailingCRCR",
    Input: '"field"\r\r',
    Error: new ParseError(1, 1, 6, ERR_QUOTE),
  },
  {
    Name: "FieldCR",
    Input: "field\rfield\r",
    Output: [["field\rfield"]],
  },
  {
    Name: "FieldCRCR",
    Input: "field\r\rfield\r\r",
    Output: [["field\r\rfield\r"]],
  },
  {
    Name: "FieldCRCRLF",
    Input: "field\r\r\nfield\r\r\n",
    Output: [["field\r"], ["field\r"]],
  },
  {
    Name: "FieldCRCRLFCR",
    Input: "field\r\r\n\rfield\r\r\n\r",
    Output: [["field\r"], ["\rfield\r"]],
  },
  {
    Name: "FieldCRCRLFCRCR",
    Input: "field\r\r\n\r\rfield\r\r\n\r\r",
    Output: [["field\r"], ["\r\rfield\r"], ["\r"]],
  },
  {
    Name: "MultiFieldCRCRLFCRCR",
    Input: "field1,field2\r\r\n\r\rfield1,field2\r\r\n\r\r,",
    Output: [
      ["field1", "field2\r"],
      ["\r\rfield1", "field2\r"],
      ["\r\r", ""],
    ],
  },
  {
    Name: "NonASCIICommaAndComment",
    Input: "a£b,c£ \td,e\n€ comment\n",
    Output: [["a", "b,c", "d,e"]],
    TrimLeadingSpace: true,
    Separator: "£",
    Comment: "€",
  },
  {
    Name: "NonASCIICommaAndCommentWithQuotes",
    Input: 'a€"  b,"€ c\nλ comment\n',
    Output: [["a", "  b,", " c"]],
    Separator: "€",
    Comment: "λ",
  },
  {
    // λ and θ start with the same byte.
    // This tests that the parser doesn't confuse such characters.
    Name: "NonASCIICommaConfusion",
    Input: '"abθcd"λefθgh',
    Output: [["abθcd", "efθgh"]],
    Separator: "λ",
    Comment: "€",
  },
  {
    Name: "NonASCIICommentConfusion",
    Input: "λ\nλ\nθ\nλ\n",
    Output: [["λ"], ["λ"], ["λ"]],
    Comment: "θ",
  },
  {
    Name: "QuotedFieldMultipleLF",
    Input: '"\n\n\n\n"',
    Output: [["\n\n\n\n"]],
  },
  {
    Name: "MultipleCRLF",
    Input: "\r\n\r\n\r\n\r\n",
    Output: [],
  },
  /**
   * The implementation may read each line in several chunks if
   * it doesn't fit entirely.
   * in the read buffer, so we should test the code to handle that condition.
   */
  /* TODO(kt3k): Enable this test case
  {
    Name: "HugeLines",
    Input: "#ignore\n".repeat(10000) + "@".repeat(5000) + "," +
      "*".repeat(5000),
    Output: [["@".repeat(5000), "*".repeat(5000)]],
    Comment: "#",
  },
  */
  {
    Name: "QuoteWithTrailingCRLF",
    Input: '"foo"bar"\r\n',
    Error: new ParseError(1, 1, 4, ERR_QUOTE),
  },
  {
    Name: "LazyQuoteWithTrailingCRLF",
    Input: '"foo"bar"\r\n',
    Output: [[`foo"bar`]],
    LazyQuotes: true,
  },
  {
    Name: "DoubleQuoteWithTrailingCRLF",
    Input: '"foo""bar"\r\n',
    Output: [[`foo"bar`]],
  },
  {
    Name: "EvenQuotes",
    Input: `""""""""`,
    Output: [[`"""`]],
  },
  {
    Name: "OddQuotes",
    Input: `"""""""`,
    Error: new ParseError(1, 1, 7, ERR_QUOTE),
  },
  {
    Name: "LazyOddQuotes",
    Input: `"""""""`,
    Output: [[`"""`]],
    LazyQuotes: true,
  },
  {
    Name: "BadComma1",
    Separator: "\n",
    Error: new Error(ERR_INVALID_DELIM),
  },
  {
    Name: "BadComma2",
    Separator: "\r",
    Error: new Error(ERR_INVALID_DELIM),
  },
  {
    Name: "BadComma3",
    Separator: '"',
    Error: new Error(ERR_INVALID_DELIM),
  },
  {
    Name: "BadComment1",
    Comment: "\n",
    Error: new Error(ERR_INVALID_DELIM),
  },
  {
    Name: "BadComment2",
    Comment: "\r",
    Error: new Error(ERR_INVALID_DELIM),
  },
  {
    Name: "BadCommaComment",
    Separator: "X",
    Comment: "X",
    Error: new Error(ERR_INVALID_DELIM),
  },
];
for (const t of testCases) {
  Deno.test({
    name: `[CSV] ${t.Name}`,
    async fn() {
      let separator = ",";
      let comment: string | undefined;
      let fieldsPerRec: number | undefined;
      let trim = false;
      let lazyquote = false;
      if (t.Separator) {
        separator = t.Separator;
      }
      if (t.Comment) {
        comment = t.Comment;
      }
      if (t.TrimLeadingSpace) {
        trim = true;
      }
      if (t.UseFieldsPerRecord) {
        fieldsPerRec = t.FieldsPerRecord;
      }
      if (t.LazyQuotes) {
        lazyquote = t.LazyQuotes;
      }
      let actual;
      if (t.Error) {
        await assertRejects(async () => {
          await readMatrix(new BufReader(new StringReader(t.Input ?? "")), {
            separator,
            comment: comment,
            trimLeadingSpace: trim,
            fieldsPerRecord: fieldsPerRec,
            lazyQuotes: lazyquote,
          });
        }, (error: Error) => {
          assertEquals(error, t.Error);
        });
      } else {
        actual = await readMatrix(
          new BufReader(new StringReader(t.Input ?? "")),
          {
            separator,
            comment: comment,
            trimLeadingSpace: trim,
            fieldsPerRecord: fieldsPerRec,
            lazyQuotes: lazyquote,
          },
        );
        const expected = t.Output;
        assertEquals(actual, expected);
      }
    },
  });
}

const parseTestCases = [
  {
    name: "simple",
    in: "a,b,c",
    skipFirstRow: false,
    result: [["a", "b", "c"]],
  },
  {
    name: "simple Bufreader",
    in: new BufReader(new StringReader("a,b,c")),
    skipFirstRow: false,
    result: [["a", "b", "c"]],
  },
  {
    name: "multiline",
    in: "a,b,c\ne,f,g\n",
    skipFirstRow: false,
    result: [
      ["a", "b", "c"],
      ["e", "f", "g"],
    ],
  },
  {
    name: "header mapping boolean",
    in: "a,b,c\ne,f,g\n",
    skipFirstRow: true,
    result: [{ a: "e", b: "f", c: "g" }],
  },
  {
    name: "header mapping array",
    in: "a,b,c\ne,f,g\n",
    columns: ["this", "is", "sparta"],
    result: [
      { this: "a", is: "b", sparta: "c" },
      { this: "e", is: "f", sparta: "g" },
    ],
  },
  {
    name: "header mapping object",
    in: "a,b,c\ne,f,g\n",
    columns: [{ name: "this" }, { name: "is" }, { name: "sparta" }],
    result: [
      { this: "a", is: "b", sparta: "c" },
      { this: "e", is: "f", sparta: "g" },
    ],
  },
  {
    name: "provides both opts.skipFirstRow and opts.columns",
    in: "a,b,1\nc,d,2\ne,f,3",
    skipFirstRow: true,
    columns: [
      { name: "foo" },
      { name: "bar" },
      { name: "baz" },
    ],
    result: [
      { foo: "c", bar: "d", baz: "2" },
      { foo: "e", bar: "f", baz: "3" },
    ],
  },
  {
    name: "mismatching number of headers and fields",
    in: "a,b,c\nd,e",
    columns: [{ name: "a" }, { name: "b" }, { name: "c" }],
    error: new Error(
      `Error number of fields line: 1\nNumber of fields found: 3\nExpected number of fields: 2`,
    ),
  },
];

for (const testCase of parseTestCases) {
  Deno.test({
    name: `[CSV] Parse ${testCase.name}`,
    async fn() {
      if (testCase.error) {
        await assertRejects(async () => {
          await parse(testCase.in, {
            skipFirstRow: testCase.skipFirstRow,
            columns: testCase.columns,
          });
        }, (error: Error) => {
          assertEquals(error.message, testCase.error.message);
        });
      } else {
        const r = await parse(testCase.in, {
          skipFirstRow: testCase.skipFirstRow,
          columns: testCase.columns,
        });
        assertEquals(r, testCase.result);
      }
    },
  });
}

Deno.test({
  name: "[CSV] ParseError.message",
  fn(): void {
    assertEquals(
      new ParseError(2, 2, null, ERR_FIELD_COUNT).message,
      `record on line 2: ${ERR_FIELD_COUNT}`,
    );

    assertEquals(
      new ParseError(1, 2, 1, ERR_QUOTE).message,
      `record on line 1; parse error on line 2, column 1: ${ERR_QUOTE}`,
    );

    assertEquals(
      new ParseError(1, 1, 7, ERR_QUOTE).message,
      `parse error on line 1, column 7: ${ERR_QUOTE}`,
    );
  },
});

type StringifyTestCaseBase = {
  columns: Column[];
  data: DataItem[];
  name: string;
  options?: StringifyOptions;
};

type StringifyTestCaseError = StringifyTestCaseBase & {
  errorMessage?: string;
  // deno-lint-ignore no-explicit-any
  throwsError: new (...args: any[]) => Error;
};

type StringifyTestCase = StringifyTestCaseBase & { expected: string };

const stringifyTestCases: (StringifyTestCase | StringifyTestCaseError)[] = [
  {
    columns: ["a"],
    data: [["foo"], ["bar"]],
    errorMessage: 'Property accessor is not of type "number"',
    name: "[CSV_stringify] Access array index using string",
    throwsError: StringifyError,
  },
  {
    columns: [0],
    data: [["foo"], ["bar"]],
    errorMessage: [
      "Separator cannot include the following strings:",
      '  - U+0022: Quotation mark (")',
      "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
    ].join("\n"),
    name: "[CSV_stringify] Double quote in separator",
    options: { separator: '"' },
    throwsError: StringifyError,
  },
  {
    columns: [0],
    data: [["foo"], ["bar"]],
    errorMessage: [
      "Separator cannot include the following strings:",
      '  - U+0022: Quotation mark (")',
      "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
    ].join("\n"),
    name: "[CSV_stringify] CRLF in separator",
    options: { separator: "\r\n" },
    throwsError: StringifyError,
  },
  {
    columns: [
      {
        fn: (obj) => obj.toUpperCase(),
        prop: "msg",
      },
    ],
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    name: "[CSV_stringify] Transform function",
    throwsError: TypeError,
  },
  {
    columns: [],
    data: [],
    expected: NEWLINE,
    name: "[CSV_stringify] No data, no columns",
  },
  {
    columns: [],
    data: [],
    expected: ``,
    name: "[CSV_stringify] No data, no columns, no headers",
    options: { headers: false },
  },
  {
    columns: ["a"],
    data: [],
    expected: `a${NEWLINE}`,
    name: "[CSV_stringify] No data, columns",
  },
  {
    columns: ["a"],
    data: [],
    expected: ``,
    name: "[CSV_stringify] No data, columns, no headers",
    options: { headers: false },
  },
  {
    columns: [],
    data: [{ a: 1 }, { a: 2 }],
    expected: `${NEWLINE}${NEWLINE}${NEWLINE}`,
    name: "[CSV_stringify] Data, no columns",
  },
  {
    columns: [0, 1],
    data: [["foo", "bar"], ["baz", "qux"]],
    expected: `0\r1${NEWLINE}foo\rbar${NEWLINE}baz\rqux${NEWLINE}`,
    name: "[CSV_stringify] Separator: CR",
    options: { separator: "\r" },
  },
  {
    columns: [0, 1],
    data: [["foo", "bar"], ["baz", "qux"]],
    expected: `0\n1${NEWLINE}foo\nbar${NEWLINE}baz\nqux${NEWLINE}`,
    name: "[CSV_stringify] Separator: LF",
    options: { separator: "\n" },
  },
  {
    columns: [1],
    data: [{ 1: 1 }, { 1: 2 }],
    expected: `1${NEWLINE}1${NEWLINE}2${NEWLINE}`,
    name: "[CSV_stringify] Column: number accessor, Data: object",
  },
  {
    columns: [{ header: "Value", prop: "value" }],
    data: [{ value: "foo" }, { value: "bar" }],
    expected: `foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Explicit header value, no headers",
    options: { headers: false },
  },
  {
    columns: [1],
    data: [["key", "foo"], ["key", "bar"]],
    expected: `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: number accessor, Data: array",
  },
  {
    columns: [[1]],
    data: [{ 1: 1 }, { 1: 2 }],
    expected: `1${NEWLINE}1${NEWLINE}2${NEWLINE}`,
    name: "[CSV_stringify] Column: array number accessor, Data: object",
  },
  {
    columns: [[1]],
    data: [["key", "foo"], ["key", "bar"]],
    expected: `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: array number accessor, Data: array",
  },
  {
    columns: [[1, 1]],
    data: [["key", ["key", "foo"]], ["key", ["key", "bar"]]],
    expected: `1${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: array number accessor, Data: array",
  },
  {
    columns: ["value"],
    data: [{ value: "foo" }, { value: "bar" }],
    expected: `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: string accessor, Data: object",
  },
  {
    columns: [["value"]],
    data: [{ value: "foo" }, { value: "bar" }],
    expected: `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: array string accessor, Data: object",
  },
  {
    columns: [["msg", "value"]],
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    expected: `value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Column: array string accessor, Data: object",
  },
  {
    columns: [
      {
        header: "Value",
        prop: ["msg", "value"],
      },
    ],
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    expected: `Value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Explicit header",
  },
  {
    columns: [
      {
        fn: (str: string) => str.toUpperCase(),
        prop: ["msg", "value"],
      },
    ],
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    expected: `value${NEWLINE}FOO${NEWLINE}BAR${NEWLINE}`,
    name: "[CSV_stringify] Transform function 1",
  },
  {
    columns: [
      {
        fn: (str: string) => Promise.resolve(str.toUpperCase()),
        prop: ["msg", "value"],
      },
    ],
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    expected: `value${NEWLINE}FOO${NEWLINE}BAR${NEWLINE}`,
    name: "[CSV_stringify] Transform function 1 async",
  },
  {
    columns: [
      {
        fn: (obj: { value: string }) => obj.value,
        prop: "msg",
      },
    ],
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    expected: `msg${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Transform function 2",
  },
  {
    columns: [
      {
        fn: (obj: { value: string }) => obj.value,
        header: "Value",
        prop: "msg",
      },
    ],
    data: [{ msg: { value: "foo" } }, { msg: { value: "bar" } }],
    expected: `Value${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Transform function 2, explicit header",
  },
  {
    columns: [0],
    data: [[{ value: "foo" }], [{ value: "bar" }]],
    expected:
      `0${NEWLINE}"{""value"":""foo""}"${NEWLINE}"{""value"":""bar""}"${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: object",
  },
  {
    columns: [0],
    data: [
      [[{ value: "foo" }, { value: "bar" }]],
      [[{ value: "baz" }, { value: "qux" }]],
    ],
    expected:
      `0${NEWLINE}"[{""value"":""foo""},{""value"":""bar""}]"${NEWLINE}"[{""value"":""baz""},{""value"":""qux""}]"${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: arary of objects",
  },
  {
    columns: [0],
    data: [[["foo", "bar"]], [["baz", "qux"]]],
    expected:
      `0${NEWLINE}"[""foo"",""bar""]"${NEWLINE}"[""baz"",""qux""]"${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: array",
  },
  {
    columns: [0],
    data: [[["foo", "bar"]], [["baz", "qux"]]],
    expected:
      `0${NEWLINE}"[""foo"",""bar""]"${NEWLINE}"[""baz"",""qux""]"${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: array, separator: tab",
    options: { separator: "\t" },
  },
  {
    columns: [0],
    data: [[], []],
    expected: `0${NEWLINE}${NEWLINE}${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: undefined",
  },
  {
    columns: [0],
    data: [[null], [null]],
    expected: `0${NEWLINE}${NEWLINE}${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: null",
  },
  {
    columns: [0],
    data: [[0xa], [0xb]],
    expected: `0${NEWLINE}10${NEWLINE}11${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: hex number",
  },
  {
    columns: [0],
    data: [[BigInt("1")], [BigInt("2")]],
    expected: `0${NEWLINE}1${NEWLINE}2${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: BigInt",
  },
  {
    columns: [0],
    data: [[true], [false]],
    expected: `0${NEWLINE}true${NEWLINE}false${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: boolean",
  },
  {
    columns: [0],
    data: [["foo"], ["bar"]],
    expected: `0${NEWLINE}foo${NEWLINE}bar${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: string",
  },
  {
    columns: [0],
    data: [[Symbol("foo")], [Symbol("bar")]],
    expected: `0${NEWLINE}Symbol(foo)${NEWLINE}Symbol(bar)${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: symbol",
  },
  {
    columns: [0],
    data: [[(n: number) => n]],
    expected: `0${NEWLINE}(n) => n${NEWLINE}`,
    name: "[CSV_stringify] Targeted value: function",
  },
  {
    columns: [0],
    data: [['foo"']],
    expected: `0${NEWLINE}"foo"""${NEWLINE}`,
    name: "[CSV_stringify] Value with double quote",
  },
  {
    columns: [0],
    data: [["foo\r\n"]],
    expected: `0${NEWLINE}"foo\r\n"${NEWLINE}`,
    name: "[CSV_stringify] Value with CRLF",
  },
  {
    columns: [0],
    data: [["foo\r"]],
    expected: `0${NEWLINE}foo\r${NEWLINE}`,
    name: "[CSV_stringify] Value with CR",
  },
  {
    columns: [0],
    data: [["foo\n"]],
    expected: `0${NEWLINE}foo\n${NEWLINE}`,
    name: "[CSV_stringify] Value with LF",
  },
  {
    columns: [0],
    data: [["foo,"]],
    expected: `0${NEWLINE}"foo,"${NEWLINE}`,
    name: "[CSV_stringify] Value with comma",
  },
  {
    columns: [0],
    data: [["foo,"]],
    expected: `0${NEWLINE}foo,${NEWLINE}`,
    name: "[CSV_stringify] Value with comma, tab separator",
    options: { separator: "\t" },
  },
];

for (const tc of stringifyTestCases) {
  if ((tc as StringifyTestCaseError).throwsError) {
    const t = tc as StringifyTestCaseError;
    Deno.test({
      async fn() {
        await assertRejects(
          async () => {
            await stringify(t.data, t.columns, t.options);
          },
          t.throwsError,
          t.errorMessage,
        );
      },
      name: t.name,
    });
  } else {
    const t = tc as StringifyTestCase;
    Deno.test({
      async fn() {
        const actual = await stringify(t.data, t.columns, t.options);
        assertEquals(actual, t.expected);
      },
      name: t.name,
    });
  }
}
