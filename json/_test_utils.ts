// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import type { ConcatenatedJsonParseStream } from "./concatenated_json_parse_stream.ts";
import type { JsonParseStream } from "./parse_stream.ts";

export async function assertValidParse(
  transform: typeof ConcatenatedJsonParseStream | typeof JsonParseStream,
  chunks: string[],
  expect: unknown[],
) {
  const r = ReadableStream.from(chunks)
    .pipeThrough(new transform());
  const res = await Array.fromAsync(r);
  assertEquals(res, expect);
}

export async function assertInvalidParse(
  transform: typeof ConcatenatedJsonParseStream | typeof JsonParseStream,
  chunks: string[],
  // deno-lint-ignore no-explicit-any
  ErrorClass: new (...args: any[]) => Error,
  msgIncludes: string | undefined,
) {
  const r = ReadableStream.from(chunks)
    .pipeThrough(new transform());
  await assertRejects(
    async () => await Array.fromAsync(r),
    ErrorClass,
    msgIncludes,
  );
}
