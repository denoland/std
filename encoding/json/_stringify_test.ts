// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { assertEquals, assertRejects } from "../../testing/asserts.ts";
import {
  ConcatenatedJSONStringifyStream,
  JSONLinesStringifyStream,
  StringifyStreamOptions,
} from "./_stringify.ts";

async function assertValidStringify(
  transform:
    | typeof ConcatenatedJSONStringifyStream
    | typeof JSONLinesStringifyStream,
  chunks: unknown[],
  expect: string[],
  options?: StringifyStreamOptions,
) {
  const r = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  const res = [];
  for await (const data of r.pipeThrough(new transform(options))) {
    res.push(data);
  }
  assertEquals(res, expect);
}

async function assertInvalidStringify(
  transform:
    | typeof ConcatenatedJSONStringifyStream
    | typeof JSONLinesStringifyStream,
  chunks: unknown[],
  options?: StringifyStreamOptions,
  // deno-lint-ignore no-explicit-any
  ErrorClass?: (new (...args: any[]) => Error) | undefined,
  msgIncludes?: string | undefined,
) {
  const r = new ReadableStream<unknown>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  await assertRejects(
    async () => {
      for await (const _ of r.pipeThrough(new transform(options)));
    },
    ErrorClass,
    msgIncludes,
  );
}

Deno.test({
  name: "[encoding/json/stream] stringify(concatenated)",
  async fn() {
    await assertValidStringify(
      ConcatenatedJSONStringifyStream,
      [{ foo: "bar" }, { foo: "bar" }],
      ['{"foo":"bar"}\n', '{"foo":"bar"}\n'],
    );

    const cyclic: Record<string, unknown> = {};
    cyclic.cyclic = cyclic;
    await assertInvalidStringify(
      ConcatenatedJSONStringifyStream,
      [cyclic],
      {},
      TypeError,
      "Converting circular structure to JSON",
    );
  },
});

Deno.test({
  name: "[encoding/json/stream] stringify(separator)",
  async fn() {
    await assertValidStringify(
      JSONLinesStringifyStream,
      [{ foo: "bar" }, { foo: "bar" }],
      ['{"foo":"bar"}aaa\n', '{"foo":"bar"}aaa\n'],
      { separator: "aaa\n" },
    );
    await assertValidStringify(
      JSONLinesStringifyStream,
      [{ foo: "bar" }, { foo: "bar" }],
      ['aaa{"foo":"bar"}\n', 'aaa{"foo":"bar"}\n'],
      { separator: "aaa" },
    );
  },
});
