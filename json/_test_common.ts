// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "../testing/asserts.ts";
import type { ConcatenatedJsonParseStream } from "./concatenated_json_parse_stream.ts";
import type { JsonParseStream } from "./json_parse_stream.ts";
import type { ParseStreamOptions } from "./common.ts";

export async function assertValidParse(
  transform: typeof ConcatenatedJsonParseStream | typeof JsonParseStream,
  chunks: string[],
  expect: unknown[],
  options?: ParseStreamOptions,
) {
  const r = ReadableStream.from(chunks);
  const res = [];
  for await (const data of r.pipeThrough(new transform(options))) {
    res.push(data);
  }
  assertEquals(res, expect);
}

export async function assertInvalidParse(
  transform: typeof ConcatenatedJsonParseStream | typeof JsonParseStream,
  chunks: string[],
  options: ParseStreamOptions,
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes: string | undefined,
) {
  const r = ReadableStream.from(chunks);
  await assertRejects(
    async () => {
      for await (const _ of r.pipeThrough(new transform(options)));
    },
    ErrorClass,
    msgIncludes,
  );
}
