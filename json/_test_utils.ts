// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import type { ConcatenatedJsonParseStream } from "./concatenated_json_parse_stream.ts";
import type { JsonParseStream } from "./parse_stream.ts";

// deno-lint-ignore deno-style-guide/exported-function-args-maximum
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

// deno-lint-ignore deno-style-guide/exported-function-args-maximum
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
