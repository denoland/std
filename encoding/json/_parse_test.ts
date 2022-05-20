// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../../testing/asserts.ts";
import { readableStreamFromIterable } from "../../streams/conversion.ts";
import {
  ConcatenatedJSONParseStream,
  JSONLinesParseStream,
  ParseStreamOptions,
} from "./_parse.ts";

async function assertValidParse(
  transform: typeof ConcatenatedJSONParseStream | typeof JSONLinesParseStream,
  chunks: string[],
  expect: unknown[],
  options?: ParseStreamOptions,
) {
  const r = readableStreamFromIterable(chunks);
  const res = [];
  for await (const data of r.pipeThrough(new transform(options))) {
    res.push(data);
  }
  assertEquals(res, expect);
}

async function assertInvalidParse(
  transform: typeof ConcatenatedJSONParseStream | typeof JSONLinesParseStream,
  chunks: string[],
  options?: ParseStreamOptions,
  // deno-lint-ignore no-explicit-any
  ErrorClass?: (new (...args: any[]) => Error) | undefined,
  msgIncludes?: string | undefined,
) {
  const r = readableStreamFromIterable(chunks);
  await assertRejects(
    async () => {
      for await (const _ of r.pipeThrough(new transform(options)));
    },
    ErrorClass,
    msgIncludes,
  );
}

Deno.test({
  name: "[encoding/json/stream] parse(concatenated)",
  async fn() {
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"} '],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      [' {"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['[{"foo": "bar"}]'],
      [[{ foo: "bar" }]],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"}{"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"} {"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(concatenated): primitive",
  async fn() {
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["0"],
      [0],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["100"],
      [100],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['100 200"foo"'],
      [100, 200, "foo"],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['100 200{"foo": "bar"}'],
      [100, 200, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['100 200["foo"]'],
      [100, 200, ["foo"]],
    );

    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['"foo"'],
      ["foo"],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['"foo""bar"{"foo": "bar"}'],
      ["foo", "bar", { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['"foo""bar"["foo"]'],
      ["foo", "bar", ["foo"]],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['"foo""bar"0'],
      ["foo", "bar", 0],
    );

    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["null"],
      [null],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['null null{"foo": "bar"}'],
      [null, null, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['null null["foo"]'],
      [null, null, ["foo"]],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["null null 0"],
      [null, null, 0],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['null null"foo"'],
      [null, null, "foo"],
    );

    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["true"],
      [true],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['true true{"foo": "bar"}'],
      [true, true, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['true true["foo"]'],
      [true, true, ["foo"]],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["true true 0"],
      [true, true, 0],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['true true"foo"'],
      [true, true, "foo"],
    );

    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["false"],
      [false],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['false false{"foo": "bar"}'],
      [false, false, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['false false["foo"]'],
      [false, false, ["foo"]],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["false false 0"],
      [false, false, 0],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['false false"foo"'],
      [false, false, "foo"],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(concatenated): chunk",
  async fn() {
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["", '{"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ["{", '"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "b', 'ar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"', "}"],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"}', ""],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"}', '{"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"', '}{"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"}{', '"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(concatenated): surrogate pair",
  async fn() {
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "👪"}{"foo": "👪"}'],
      [{ foo: "👪" }, { foo: "👪" }],
    );
  },
});

Deno.test({
  name:
    "[encoding/json/stream] parse(concatenated): All characters between double quotes are parsed into a string",
  async fn() {
    await assertValidParse(
      ConcatenatedJSONParseStream,
      ['"[], {}"'],
      ["[], {}"],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(concatenated): halfway chunk",
  async fn() {
    await assertInvalidParse(
      ConcatenatedJSONParseStream,
      ['{"foo": "bar"} {"foo": '],
      {},
      SyntaxError,
      `Unexpected end of JSON input (parsing: ' {"foo": ')`,
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(concatenated): truncate error message",
  async fn() {
    await assertInvalidParse(
      ConcatenatedJSONParseStream,
      [`{${"foo".repeat(100)}}`],
      {},
      SyntaxError,
      `Unexpected token f in JSON at position 1 (parsing: '{foofoofoofoofoofoofoofoofoofo...')`,
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(separator)",
  async fn() {
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"}\n'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"}\r\n'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['\n{"foo": "bar"}\n'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ["[0]\n"],
      [[0]],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ["0\n"],
      [0],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(separator): chunk",
  async fn() {
    await assertValidParse(
      JSONLinesParseStream,
      ["{", '"foo": "bar"}\n'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo', '": "bar"}\n'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo":', ' "bar"}\n'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"', "}\n"],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"}', "\n"],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"}\n', ""],
      [{ foo: "bar" }],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(separator): special separator",
  async fn() {
    const separators = ["\x1E", "xxxxx", "😊", "🦕"];
    for (const separator of separators) {
      await assertValidParse(
        JSONLinesParseStream,
        [`${separator}{"foo": "bar"}${separator}{"foo": "bar"}${separator}`],
        [{ foo: "bar" }, { foo: "bar" }],
        { separator },
      );
    }
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(separator): empty line",
  async fn() {
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"} \n {"foo": "bar"} \n'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"} \n\n {"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(separator): surrogate pair",
  async fn() {
    await assertValidParse(
      JSONLinesParseStream,
      ['{"foo": "👪"}\n{"foo": "👪"}\n'],
      [{ foo: "👪" }, { foo: "👪" }],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(separator): invalid line break",
  async fn() {
    await assertInvalidParse(
      JSONLinesParseStream,
      ['{"foo": \n "bar"} \n {"foo": \n "bar"}'],
      {},
      SyntaxError,
      `Unexpected end of JSON input (parsing: '{"foo": ')`,
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse(separator): halfway chunk",
  async fn() {
    await assertInvalidParse(
      JSONLinesParseStream,
      ['{"foo": "bar"} \n {"foo": '],
      {},
      SyntaxError,
      `Unexpected end of JSON input (parsing: ' {"foo": ')`,
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] parse: testdata(jsonl)",
  async fn() {
    // Read the test data file
    const url = "../testdata/json/test.jsonl";
    const { body } = await fetch(new URL(url, import.meta.url).toString());
    const readable = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream());

    const result = [];
    for await (const data of readable) {
      result.push(data);
    }

    assertEquals(result, [
      { "hello": "world" },
      ["👋", "👋", "👋"],
      { "deno": "🦕" },
    ]);
  },
});

Deno.test({
  name: "[encoding/json/stream] parse: testdata(ndjson)",
  async fn() {
    // Read the test data file
    const url = "../testdata/json/test.ndjson";
    const { body } = await fetch(new URL(url, import.meta.url).toString());
    const readable = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream());

    const result = [];
    for await (const data of readable) {
      result.push(data);
    }

    assertEquals(result, [
      { "hello": "world" },
      ["👋", "👋", "👋"],
      { "deno": "🦕" },
    ]);
  },
});

Deno.test({
  name: "[encoding/json/stream] parse: testdata(json-seq)",
  async fn() {
    // Read the test data file
    const recordSeparator = "\x1E";

    const url = "../testdata/json/test.json-seq";
    const { body } = await fetch(new URL(url, import.meta.url).toString());
    const readable = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new JSONLinesParseStream({ separator: recordSeparator }));

    const result = [];
    for await (const data of readable) {
      result.push(data);
    }

    assertEquals(result, [
      { "hello": "world" },
      ["👋", "👋", "👋"],
      { "deno": "🦕" },
    ]);
  },
});

Deno.test({
  // Read the test data file
  name: "[encoding/json/stream] parse: testdata(concatenated-json)",
  async fn() {
    const url = "../testdata/json/test.concatenated-json";
    const { body } = await fetch(new URL(url, import.meta.url).toString());
    const readable = body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new ConcatenatedJSONParseStream());

    const result = [];
    for await (const data of readable) {
      result.push(data);
    }

    assertEquals(result, [
      { "hello": "world" },
      ["👋", "👋", "👋"],
      { "deno": "🦕" },
    ]);
  },
});
