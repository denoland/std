// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import {
  JsonStringifyStream,
  type StringifyStreamOptions,
} from "./stringify_stream.ts";

async function assertValidStringify(
  transformer: typeof JsonStringifyStream,
  chunks: unknown[],
  expect: string[],
  options?: StringifyStreamOptions,
) {
  const r = ReadableStream.from(chunks)
    .pipeThrough(new transformer(options));
  const res = await Array.fromAsync(r);
  assertEquals(res, expect);
}

async function assertInvalidStringify(
  transformer: typeof JsonStringifyStream,
  chunks: unknown[],
  options: StringifyStreamOptions,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes: string | undefined,
) {
  const r = ReadableStream.from(chunks)
    .pipeThrough(new transformer(options));
  await assertRejects(
    async () => await Array.fromAsync(r),
    ErrorClass,
    msgIncludes,
  );
}

Deno.test({
  name: "JsonStringifyStream",
  async fn() {
    await assertValidStringify(
      JsonStringifyStream,
      [{ foo: "bar" }, { foo: "bar" }],
      ['{"foo":"bar"}\n', '{"foo":"bar"}\n'],
    );
  },
});

Deno.test({
  name: "JsonStringifyStream throws on error",
  async fn() {
    const cyclic: Record<string, unknown> = {};
    cyclic.cyclic = cyclic;
    await assertInvalidStringify(
      JsonStringifyStream,
      [cyclic],
      {},
      TypeError,
      "Converting circular structure to JSON",
    );
  },
});

Deno.test({
  name: "JsonStringifyStream handles prefix and suffix",
  async fn() {
    await assertValidStringify(
      JsonStringifyStream,
      [{ foo: "bar" }, { foo: "bar" }],
      [
        '[[prefix]]{"foo":"bar"}[[suffix]]',
        '[[prefix]]{"foo":"bar"}[[suffix]]',
      ],
      { prefix: "[[prefix]]", suffix: "[[suffix]]" },
    );
  },
});
