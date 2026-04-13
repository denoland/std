// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toWritableStream } from "./to_writable_stream.ts";
import type { Closer, Writer } from "./types.ts";

class MockWriterCloser implements Writer, Closer {
  chunks: Uint8Array[] = [];
  closeCall = 0;

  write(p: Uint8Array): Promise<number> {
    if (this.closeCall) {
      throw new Error("Already closed");
    }
    if (p.length) {
      this.chunks.push(p);
    }
    return Promise.resolve(p.length);
  }

  close() {
    this.closeCall++;
  }
}

Deno.test("toWritableStream()", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const decoder = new TextDecoder();

  async function write(p: Uint8Array): Promise<number> {
    written.push(decoder.decode(p));
    return await Promise.resolve(p.length);
  }

  const writableStream = toWritableStream({ write });

  const encoder = new TextEncoder();
  const streamWriter = writableStream.getWriter();
  for (const chunk of chunks) {
    await streamWriter.write(encoder.encode(chunk));
  }

  assertEquals(written, chunks);
});

Deno.test("toWritableStream() calls close on close", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const decoder = new TextDecoder();

  const writer = new MockWriterCloser();
  const writableStream = toWritableStream(writer);

  const encoder = new TextEncoder();
  const streamWriter = writableStream.getWriter();
  for (const chunk of chunks) {
    await streamWriter.write(encoder.encode(chunk));
  }
  await streamWriter.close();

  for (const chunk of writer.chunks) {
    written.push(decoder.decode(chunk));
  }

  assertEquals(written, chunks);
  assertEquals(writer.closeCall, 1);
});

Deno.test("toWritableStream() calls close on abort", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const decoder = new TextDecoder();

  const writer = new MockWriterCloser();
  const writableStream = toWritableStream(writer);

  const encoder = new TextEncoder();
  const streamWriter = writableStream.getWriter();
  for (const chunk of chunks) {
    await streamWriter.write(encoder.encode(chunk));
  }
  await streamWriter.abort();

  for (const chunk of writer.chunks) {
    written.push(decoder.decode(chunk));
  }

  assertEquals(written, chunks);
  assertEquals(writer.closeCall, 1);
});

Deno.test("toWritableStream() doesn't call close with autoClose false", async function () {
  const written: string[] = [];
  const chunks: string[] = ["hello", "deno", "land"];
  const decoder = new TextDecoder();

  const writer = new MockWriterCloser();
  const writableStream = toWritableStream(writer, { autoClose: false });

  const encoder = new TextEncoder();
  const streamWriter = writableStream.getWriter();
  for (const chunk of chunks) {
    await streamWriter.write(encoder.encode(chunk));
  }
  await streamWriter.close();

  for (const chunk of writer.chunks) {
    written.push(decoder.decode(chunk));
  }

  assertEquals(written, chunks);
  assertEquals(writer.closeCall, 0);
});
