// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { CSVStream } from "./stream.ts";
import { ERR_QUOTE, ParseError } from "./_io.ts";
import { readableStreamFromIterable } from "../../streams/conversion.ts";
import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "../../testing/asserts.ts";
import { fromFileUrl, join } from "../../path/mod.ts";

const testdataDir = join(fromFileUrl(import.meta.url), "../../testdata");

Deno.test({
  name: "[encoding/csv/stream] CSVStream",
  permissions: {
    read: [testdataDir],
  },
  fn: async () => {
    const file = await Deno.open(join(testdataDir, "simple.csv"));
    const readable = file.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new CSVStream());
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
  name: "[encoding/csv/stream] CSVStream with `comment` option",
  permissions: { read: [testdataDir] },
  fn: async () => {
    const file = await Deno.open(join(testdataDir, "complex.csv"));
    const readable = file.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new CSVStream({
          comment: "#",
        }),
      );
    const records = [] as Array<Array<string>>;
    for await (const record of readable) {
      records.push(record);
    }
    assertEquals(records, [
      ["id", "name", "email"],
      ["1", "deno", "deno@example.com"],
      ["2", "node", "node@example.com"],
      ["3", "", "test@example.com"],
    ]);
  },
});

Deno.test({
  name: "[encoding/csv/stream] CSVStream with `separator` option",
  fn: async () => {
    const encoder = new TextEncoder();
    const readable = readableStreamFromIterable([
      encoder.encode("id\tname\n"),
      encoder.encode("1\tfoo\n"),
      encoder.encode("2\tbar\n"),
      encoder.encode("3\tbaz\n"),
    ])
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new CSVStream({
          separator: "\t",
        }),
      );
    const records = [] as Array<Array<string>>;
    for await (const record of readable) {
      records.push(record);
    }
    assertEquals(records, [
      ["id", "name"],
      ["1", "foo"],
      ["2", "bar"],
      ["3", "baz"],
    ]);
  },
});

Deno.test({
  name: "[encoding/csv/stream] CSVStream with invalid csv",
  fn: async () => {
    const encoder = new TextEncoder();
    const readable = readableStreamFromIterable([
      encoder.encode("id,name\n"),
      encoder.encode("\n"),
      encoder.encode("1,foo\n"),
      encoder.encode('2,"baz\n'),
    ]).pipeThrough(new TextDecoderStream()).pipeThrough(
      new CSVStream(),
    );
    const reader = readable.getReader();
    assertEquals(await reader.read(), { done: false, value: ["id", "name"] });
    assertEquals(await reader.read(), { done: false, value: ["1", "foo"] });
    await assertRejects(() => reader.read(), (error: unknown) => {
      assert(error instanceof ParseError);
      assertEquals(error.startLine, 4);
      assertEquals(error.line, 5);
      assertEquals(error.column, 0);
      assertStringIncludes(error.message, ERR_QUOTE);
    });
  },
});
