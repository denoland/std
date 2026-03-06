// Copyright 2018-2026 the Deno authors. MIT license.
import { CsvStringifyStream } from "./stringify_stream.ts";
import { assertEquals, assertRejects } from "@std/assert";

Deno.test({
  name: "CsvStringifyStream handles various inputs",
  permissions: "none",
  fn: async (t) => {
    await t.step("with arrays", async () => {
      const readable = ReadableStream.from([
        ["id", "name"],
        [1, "foo"],
        [2, "bar"],
      ]).pipeThrough(new CsvStringifyStream());
      const output = await Array.fromAsync(readable);
      assertEquals(output, [
        "id,name\r\n",
        "1,foo\r\n",
        "2,bar\r\n",
      ]);
    });

    await t.step("with arrays, columns", async () => {
      const readable = ReadableStream.from([
        [1, "foo"],
        [2, "bar"],
        // @ts-expect-error `columns` option is not allowed
      ]).pipeThrough(new CsvStringifyStream({ columns: ["id", "name"] }));
      await assertRejects(
        async () => await Array.fromAsync(readable),
        TypeError,
      );
    });

    await t.step("with `separator`", async () => {
      const readable = ReadableStream.from([
        [1, "one"],
        [2, "two"],
        [3, "three"],
      ]).pipeThrough(new CsvStringifyStream({ separator: "\t" }));
      const output = await Array.fromAsync(readable);
      assertEquals(output, [
        "1\tone\r\n",
        "2\ttwo\r\n",
        "3\tthree\r\n",
      ]);
    });

    await t.step("with invalid `separator`", async () => {
      const readable = ReadableStream.from([
        ["one", "two", "three"],
      ]).pipeThrough(new CsvStringifyStream({ separator: "\r\n" }));
      await assertRejects(
        async () => await Array.fromAsync(readable),
        TypeError,
      );
    });

    await t.step("with invalid `columns`", async () => {
      const readable = ReadableStream.from([
        ["one", "two", "three"],
        // deno-lint-ignore no-explicit-any
      ]).pipeThrough(new CsvStringifyStream({ columns: { length: 1 } as any }));
      await assertRejects(
        async () => await Array.fromAsync(readable),
        TypeError,
        "No property accessor function was provided for object",
      );
    });

    await t.step("with objects", async () => {
      const readable = ReadableStream.from([
        { id: 1, name: "foo" },
        { id: 2, name: "bar" },
        { id: 3, name: "baz" },
      ]).pipeThrough(new CsvStringifyStream({ columns: ["id", "name"] }));
      const output = await Array.fromAsync(readable);
      assertEquals(output, [
        "id,name\r\n",
        "1,foo\r\n",
        "2,bar\r\n",
        "3,baz\r\n",
      ]);
    });

    await t.step("with objects, no columns", async () => {
      const readable = ReadableStream.from([
        { id: 1, name: "foo" },
        { id: 2, name: "bar" },
        { id: 3, name: "baz" },
        // @ts-expect-error `columns` option is required
      ]).pipeThrough(new CsvStringifyStream());
      await assertRejects(
        async () => await Array.fromAsync(readable),
        TypeError,
      );
    });
  },
});
