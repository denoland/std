// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { BatchStream } from "./unstable_batch_stream.ts";

Deno.test("BatchStream() emits at the configured size", async () => {
  const batches = await Array.fromAsync(
    ReadableStream.from([1, 2, 3, 4, 5, 6])
      .pipeThrough(new BatchStream(2)),
  );
  assertEquals(batches, [[1, 2], [3, 4], [5, 6]]);
});

Deno.test("BatchStream() flushes a final partial batch on close", async () => {
  const batches = await Array.fromAsync(
    ReadableStream.from([1, 2, 3, 4, 5])
      .pipeThrough(new BatchStream(2)),
  );
  assertEquals(batches, [[1, 2], [3, 4], [5]]);
});

Deno.test("BatchStream() does not emit an empty batch when input is empty", async () => {
  const batches = await Array.fromAsync(
    ReadableStream.from<number>([])
      .pipeThrough(new BatchStream(3)),
  );
  assertEquals(batches, []);
});

Deno.test("BatchStream() does not emit an empty batch when input length is a multiple of size", async () => {
  const batches = await Array.fromAsync(
    ReadableStream.from([1, 2, 3, 4])
      .pipeThrough(new BatchStream(2)),
  );
  assertEquals(batches, [[1, 2], [3, 4]]);
});

Deno.test("BatchStream() with size 1 emits single-record batches", async () => {
  const batches = await Array.fromAsync(
    ReadableStream.from(["a", "b", "c"])
      .pipeThrough(new BatchStream(1)),
  );
  assertEquals(batches, [["a"], ["b"], ["c"]]);
});

Deno.test("BatchStream() preserves input order", async () => {
  const input = Array.from({ length: 100 }, (_, i) => i);
  const batches = await Array.fromAsync(
    ReadableStream.from(input).pipeThrough(new BatchStream(7)),
  );
  assertEquals(batches.flat(), input);
});

Deno.test("BatchStream() throws RangeError on non-positive size", () => {
  assertThrows(
    () => new BatchStream(0),
    RangeError,
    "Cannot construct BatchStream as size must be a positive integer: current value is 0",
  );
  assertThrows(
    () => new BatchStream(-1),
    RangeError,
    "Cannot construct BatchStream as size must be a positive integer: current value is -1",
  );
});

Deno.test("BatchStream() throws RangeError on non-integer size", () => {
  assertThrows(
    () => new BatchStream(1.5),
    RangeError,
    "Cannot construct BatchStream as size must be a positive integer: current value is 1.5",
  );
  assertThrows(
    () => new BatchStream(Number.NaN),
    RangeError,
    "Cannot construct BatchStream as size must be a positive integer: current value is NaN",
  );
  assertThrows(
    () => new BatchStream(Number.POSITIVE_INFINITY),
    RangeError,
    "Cannot construct BatchStream as size must be a positive integer: current value is Infinity",
  );
});

Deno.test("BatchStream() respects downstream backpressure", async () => {
  const input = Array.from({ length: 10 }, (_, i) => i);
  const seen: number[][] = [];
  await ReadableStream.from(input)
    .pipeThrough(new BatchStream(2))
    .pipeTo(
      new WritableStream({
        async write(batch) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          seen.push(batch);
        },
      }),
    );
  assertEquals(seen, [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]);
});

Deno.test("BatchStream() propagates downstream cancellation upstream", async () => {
  let upstreamCancelled = false;
  const upstream = new ReadableStream<number>({
    pull(controller) {
      controller.enqueue(1);
    },
    cancel() {
      upstreamCancelled = true;
    },
  });

  const batched = upstream.pipeThrough(new BatchStream(1));
  const reader = batched.getReader();
  await reader.read();
  await reader.cancel();

  assertEquals(upstreamCancelled, true);
});

Deno.test("BatchStream<T> infers T from the surrounding pipeThrough", async () => {
  interface Record {
    id: number;
  }
  const records: ReadableStream<Record> = ReadableStream.from([
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ]);

  const batched: ReadableStream<Record[]> = records.pipeThrough(
    new BatchStream(2),
  );

  assertEquals(await Array.fromAsync(batched), [
    [{ id: 1 }, { id: 2 }],
    [{ id: 3 }],
  ]);
});

// The remaining checks below are compile-time only. They live inside a
// never-called function so `deno test` type-checks them without executing the
// resulting stream pipelines (which would leak timers across tests).
function _typeChecks(): void {
  const numbers: ReadableStream<number> = ReadableStream.from([1, 2, 3]);
  // @ts-expect-error - BatchStream<string> cannot consume a ReadableStream<number>
  numbers.pipeThrough(new BatchStream<string>(2));

  const batched: ReadableStream<number[]> = ReadableStream.from([1, 2])
    .pipeThrough(new BatchStream(2));
  const elementSink = new WritableStream<number>();
  // @ts-expect-error - cannot pipe ReadableStream<number[]> into WritableStream<number>
  batched.pipeTo(elementSink);
}
