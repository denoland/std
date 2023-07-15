// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { CsvStringifyStream } from "./csv_stringify_stream.ts";
import { StringifyError } from "./stringify.ts";
import { readableStreamFromIterable } from "../streams/readable_stream_from_iterable.ts";
import { assertEquals, assertRejects } from "../assert/mod.ts";

Deno.test({
  name: "[csv/csv_stringify_stream] CsvStringifyStream",
  permissions: "none",
  fn: async (t) => {
    await t.step("with arrays", async () => {
      const readable = readableStreamFromIterable([
        ["id", "name"],
        [1, "foo"],
        [2, "bar"],
      ]);
      const output: Array<string> = [];
      for await (const r of readable.pipeThrough(new CsvStringifyStream())) {
        output.push(r);
      }
      assertEquals(output, [
        "id,name\r\n",
        "1,foo\r\n",
        "2,bar\r\n",
      ]);
    });

    await t.step("with arrays, columns", async () => {
      const readable = readableStreamFromIterable([
        [1, "foo"],
        [2, "bar"],
      ]);
      await assertRejects(async () => {
        for await (
          const _ of readable.pipeThrough(
            // @ts-expect-error `columns` option is not allowed
            new CsvStringifyStream({ columns: ["id", "name"] }),
          )
        );
      }, StringifyError);
    });

    await t.step("with `separator`", async () => {
      const readable = readableStreamFromIterable([
        [1, "one"],
        [2, "two"],
        [3, "three"],
      ]);
      const output: Array<string> = [];
      for await (
        const r of readable.pipeThrough(
          new CsvStringifyStream({ separator: "\t" }),
        )
      ) {
        output.push(r);
      }
      assertEquals(output, [
        "1\tone\r\n",
        "2\ttwo\r\n",
        "3\tthree\r\n",
      ]);
    });

    await t.step("with invalid `separator`", async () => {
      const readable = readableStreamFromIterable([
        ["one", "two", "three"],
      ]);
      await assertRejects(async () => {
        for await (
          const _ of readable.pipeThrough(
            new CsvStringifyStream({ separator: "\r\n" }),
          )
        );
      }, StringifyError);
    });

    await t.step("with objects", async () => {
      const readable = readableStreamFromIterable([
        { id: 1, name: "foo" },
        { id: 2, name: "bar" },
        { id: 3, name: "baz" },
      ]);
      const output: Array<string> = [];
      for await (
        const r of readable.pipeThrough(
          new CsvStringifyStream({ columns: ["id", "name"] }),
        )
      ) {
        output.push(r);
      }
      assertEquals(output, [
        "id,name\r\n",
        "1,foo\r\n",
        "2,bar\r\n",
        "3,baz\r\n",
      ]);
    });

    await t.step("with objects, no columns", async () => {
      const readable = readableStreamFromIterable([
        { id: 1, name: "foo" },
        { id: 2, name: "bar" },
        { id: 3, name: "baz" },
      ]);
      await assertRejects(async () => {
        for await (
          const _ of readable.pipeThrough(
            // @ts-expect-error `columns` option is required
            new CsvStringifyStream(),
          )
        );
      }, StringifyError);
    });
  },
});
