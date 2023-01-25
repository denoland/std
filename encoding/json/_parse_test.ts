// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../../testing/asserts.ts";
import { readableStreamFromIterable } from "../../streams/readable_stream_from_iterable.ts";
import { TextDelimiterStream } from "../../streams/text_delimiter_stream.ts";
import { TextLineStream } from "../../streams/text_line_stream.ts";
import {
  ConcatenatedJsonParseStream,
  JsonParseStream,
  ParseStreamOptions,
} from "./_parse.ts";

async function assertValidParse(
  transform: typeof ConcatenatedJsonParseStream | typeof JsonParseStream,
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
  transform: typeof ConcatenatedJsonParseStream | typeof JsonParseStream,
  chunks: string[],
  options: ParseStreamOptions,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes: string | undefined,
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
  name: "[encoding/json/stream] ConcatenatedJsonParseStream",
  async fn() {
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"} '],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      [' {"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['[{"foo": "bar"}]'],
      [[{ foo: "bar" }]],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"}{"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"} {"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] ConcatenatedJsonParseStream: primitive",
  async fn() {
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["0"],
      [0],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["100"],
      [100],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['100 200"foo"'],
      [100, 200, "foo"],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['100 200{"foo": "bar"}'],
      [100, 200, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['100 200["foo"]'],
      [100, 200, ["foo"]],
    );

    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['"foo"'],
      ["foo"],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['"foo""bar"{"foo": "bar"}'],
      ["foo", "bar", { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['"foo""bar"["foo"]'],
      ["foo", "bar", ["foo"]],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['"foo""bar"0'],
      ["foo", "bar", 0],
    );

    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["null"],
      [null],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['null null{"foo": "bar"}'],
      [null, null, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['null null["foo"]'],
      [null, null, ["foo"]],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["null null 0"],
      [null, null, 0],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['null null"foo"'],
      [null, null, "foo"],
    );

    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["true"],
      [true],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['true true{"foo": "bar"}'],
      [true, true, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['true true["foo"]'],
      [true, true, ["foo"]],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["true true 0"],
      [true, true, 0],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['true true"foo"'],
      [true, true, "foo"],
    );

    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["false"],
      [false],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['false false{"foo": "bar"}'],
      [false, false, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['false false["foo"]'],
      [false, false, ["foo"]],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["false false 0"],
      [false, false, 0],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['false false"foo"'],
      [false, false, "foo"],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] ConcatenatedJsonParseStream: chunk",
  async fn() {
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["", '{"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ["{", '"foo": "bar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "b', 'ar"}'],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"', "}"],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"}', ""],
      [{ foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"}', '{"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"', '}{"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"}{', '"foo": "bar"}'],
      [{ foo: "bar" }, { foo: "bar" }],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] ConcatenatedJsonParseStream: surrogate pair",
  async fn() {
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "👪"}{"foo": "👪"}'],
      [{ foo: "👪" }, { foo: "👪" }],
    );
  },
});

Deno.test({
  name:
    "[encoding/json/stream] ConcatenatedJsonParseStream: symbol between double quotes",
  async fn() {
    await assertValidParse(
      ConcatenatedJsonParseStream,
      ['"[], {}"'],
      ["[], {}"],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] ConcatenatedJsonParseStream: halfway chunk",
  async fn() {
    await assertInvalidParse(
      ConcatenatedJsonParseStream,
      ['{"foo": "bar"} {"foo": '],
      {},
      SyntaxError,
      `Unexpected end of JSON input (parsing: ' {"foo": ')`,
    );
  },
});

Deno.test({
  name:
    "[encoding/json/stream] ConcatenatedJsonParseStream: truncate error message",
  async fn() {
    await assertInvalidParse(
      ConcatenatedJsonParseStream,
      [`{${"foo".repeat(100)}}`],
      {},
      SyntaxError,
      `Expected property name or '}' in JSON at position 1 (parsing: '{foofoofoofoofoofoofoofoofoofo...')`,
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] JsonParseStream",
  async fn() {
    await assertValidParse(
      JsonParseStream,
      ['{"foo": "bar"}', '["foo"]', '"foo"', "0", "null", "true", "false"],
      [{ foo: "bar" }, ["foo"], "foo", 0, null, true, false],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] JsonParseStream: empty line",
  async fn() {
    await assertValidParse(
      JsonParseStream,
      [" \t\r\n", ""],
      [],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] JsonParseStream: special character",
  async fn() {
    await assertValidParse(
      JsonParseStream,
      ['"👪"', '"🦕"', '"\u3053\u3093\u306b\u3061\u306f"'],
      ["👪", "🦕", "\u3053\u3093\u306b\u3061\u306f"],
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] JsonParseStream: expect error",
  async fn() {
    await assertInvalidParse(
      JsonParseStream,
      ['{"foo": "bar"}', '{"foo": '],
      {},
      SyntaxError,
      `Unexpected end of JSON input (parsing: '{"foo": ')`,
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
      .pipeThrough(new TextLineStream())
      .pipeThrough(new JsonParseStream());

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
      .pipeThrough(new TextLineStream())
      .pipeThrough(new JsonParseStream());

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
      .pipeThrough(new TextDelimiterStream(recordSeparator))
      .pipeThrough(new JsonParseStream());

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
      .pipeThrough(new ConcatenatedJsonParseStream());

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
