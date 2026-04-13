// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toReadableStream } from "./to_readable_stream.ts";
import { Buffer } from "./buffer.ts";
import { concat } from "@std/bytes/concat";
import { copy } from "@std/bytes/copy";
import type { Closer, Reader } from "./types.ts";

class MockReaderCloser implements Reader, Closer {
  chunks: Uint8Array[] = [];
  closeCall = 0;

  read(p: Uint8Array): Promise<number | null> {
    if (this.closeCall) {
      throw new Error("Already closed");
    }
    if (p.length === 0) {
      return Promise.resolve(0);
    }
    const chunk = this.chunks.shift();
    if (chunk) {
      const copied = copy(chunk, p);
      if (copied < chunk.length) {
        this.chunks.unshift(chunk.subarray(copied));
      }
      return Promise.resolve(copied);
    }
    return Promise.resolve(null);
  }

  close() {
    this.closeCall++;
  }
}

Deno.test("toReadableStream()", async function () {
  const encoder = new TextEncoder();
  const reader = new Buffer(encoder.encode("hello deno land"));
  const stream = toReadableStream(reader);
  const actual = await Array.fromAsync(stream);
  const decoder = new TextDecoder();
  assertEquals(decoder.decode(concat(actual)), "hello deno land");
});

Deno.test("toReadableStream() handles close", async function () {
  const encoder = new TextEncoder();
  const reader = new MockReaderCloser();
  reader.chunks = [
    encoder.encode("hello "),
    encoder.encode("deno "),
    encoder.encode("land"),
  ];
  const stream = toReadableStream(reader);
  const actual = await Array.fromAsync(stream);
  const decoder = new TextDecoder();
  assertEquals(decoder.decode(concat(actual)), "hello deno land");
  assertEquals(reader.closeCall, 1);
});

Deno.test("toReadableStream() doesn't call close with `autoClose` is false", async function () {
  const encoder = new TextEncoder();
  const reader = new MockReaderCloser();
  reader.chunks = [
    encoder.encode("hello "),
    encoder.encode("deno "),
    encoder.encode("land"),
  ];
  const stream = toReadableStream(reader, { autoClose: false });
  const actual = await Array.fromAsync(stream);
  const decoder = new TextDecoder();
  assertEquals(decoder.decode(concat(actual)), "hello deno land");
  assertEquals(reader.closeCall, 0);
});

Deno.test("toReadableStream() handles `chunkSize` option", async function () {
  const encoder = new TextEncoder();
  const reader = new MockReaderCloser();
  reader.chunks = [
    encoder.encode("hello "),
    encoder.encode("deno "),
    encoder.encode("land"),
  ];
  const stream = toReadableStream(reader, { chunkSize: 2 });
  const actual = await Array.fromAsync(stream);
  const decoder = new TextDecoder();
  assertEquals(actual.length, 8);
  assertEquals(decoder.decode(concat(actual)), "hello deno land");
  assertEquals(reader.closeCall, 1);
});
