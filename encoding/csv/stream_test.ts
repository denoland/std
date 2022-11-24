// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { CsvStream } from "./stream.ts";
import type { CsvStreamOptions } from "./stream.ts";
import { ERR_QUOTE, ParseError } from "./_io.ts";
import {
  readableStreamFromIterable,
  readableStreamFromReader,
} from "../../streams/conversion.ts";
import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "../../testing/asserts.ts";
import { fromFileUrl, join } from "../../path/mod.ts";
import { StringReader } from "../../io/string_reader.ts";

const testdataDir = join(fromFileUrl(import.meta.url), "../../testdata");
const encoder = new TextEncoder();

Deno.test({
  name: "[encoding/csv/stream] CsvStream should work with Deno.File",
  permissions: {
    read: [testdataDir],
  },
  fn: async () => {
    const file = await Deno.open(join(testdataDir, "simple.csv"));
    const readable = file.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new CsvStream());
    const records = [] as Array<Array<string>>;
    for await (const record of readable) {
      records.push(record);
    }
    assertEquals(records, [
      ["id", "name"],
      ["1", "foobar"],
      ["2", "barbaz"],
    ]);
  },
});

Deno.test({
  name: "[encoding/csv/stream] CsvStream with invalid csv",
  fn: async () => {
    const readable = readableStreamFromIterable([
      encoder.encode("id,name\n"),
      encoder.encode("\n"),
      encoder.encode("1,foo\n"),
      encoder.encode('2,"baz\n'),
    ]).pipeThrough(new TextDecoderStream()).pipeThrough(
      new CsvStream(),
    );
    const reader = readable.getReader();
    assertEquals(await reader.read(), { done: false, value: ["id", "name"] });
    assertEquals(await reader.read(), { done: false, value: ["1", "foo"] });
    const error = await assertRejects(() => reader.read());
    assert(error instanceof ParseError);
    assertEquals(error.startLine, 4);
    assertEquals(error.line, 5);
    assertEquals(error.column, 0);
    assertStringIncludes(error.message, ERR_QUOTE);
  },
});

Deno.test({
  name: "[encoding/csv/stream] CsvStream with various inputs",
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
        name: "FieldCount",
        input: "a,b,c\nd,e",
        output: [
          ["a", "b", "c"],
          ["d", "e"],
        ],
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
    ];
    for (const testCase of testCases) {
      await t.step(testCase.name, async () => {
        const options: CsvStreamOptions = {};
        if (testCase.separator) {
          options.separator = testCase.separator;
        }
        if (testCase.comment) {
          options.comment = testCase.comment;
        }
        const readable = createReadableStreamFromString(testCase.input)
          .pipeThrough(new CsvStream(options));
        const actual = [] as Array<Array<string>>;
        for await (const record of readable) {
          actual.push(record);
        }
        assertEquals(actual, testCase.output);
      });
    }
  },
});

function createReadableStreamFromString(s: string): ReadableStream<string> {
  return readableStreamFromReader(new StringReader(s)).pipeThrough(
    new TextDecoderStream(),
  );
}

// Work around resource leak error with TextDecoderStream:
//   https://github.com/denoland/deno/issues/13142
export const MyTextDecoderStream = () => {
  const textDecoder = new TextDecoder();
  return new TransformStream({
    transform(chunk: Uint8Array, controller: TransformStreamDefaultController) {
      controller.enqueue(textDecoder.decode(chunk));
    },
    flush(controller: TransformStreamDefaultController) {
      controller.enqueue(textDecoder.decode());
    },
  });
};

Deno.test({
  name:
    "[encoding/csv/stream] cancel CsvStream during iteration does not leak file",
  permissions: { read: [testdataDir] },
  fn: async () => {
    const file = await Deno.open(join(testdataDir, "large.csv"));
    const readable = file.readable.pipeThrough(MyTextDecoderStream())
      .pipeThrough(new CsvStream());
    for await (const _record of readable) {
      break;
    }
  },
});
