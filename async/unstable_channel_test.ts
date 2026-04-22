// Copyright 2018-2026 the Deno authors. MIT license.

import {
  assert,
  assertEquals,
  assertFalse,
  assertInstanceOf,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { Channel, ChannelClosedError } from "./unstable_channel.ts";

// -- Constructor --

Deno.test("Channel() defaults to unbuffered (capacity 0)", () => {
  const ch = new Channel<number>();
  assertEquals(ch.capacity, 0);
  assertEquals(ch.size, 0);
});

Deno.test("Channel() accepts valid capacity", () => {
  assertEquals(new Channel<number>(8).capacity, 8);
});

Deno.test("Channel() throws for invalid capacity", () => {
  assertThrows(() => new Channel(-1), RangeError);
  assertThrows(() => new Channel(1.5), RangeError);
  assertThrows(() => new Channel(NaN), RangeError);
  assertThrows(() => new Channel(Infinity), RangeError);
});

// -- Buffered send/receive --

Deno.test("Channel.receive() returns buffered values in FIFO order", async () => {
  const ch = new Channel<number>(4);
  await ch.send(1);
  await ch.send(2);
  await ch.send(3);
  assertEquals(ch.size, 3);
  assertEquals(await ch.receive(), 1);
  assertEquals(await ch.receive(), 2);
  assertEquals(await ch.receive(), 3);
  assertEquals(ch.size, 0);
});

Deno.test("Channel ring buffer wraps around correctly", async () => {
  const ch = new Channel<number>(2);
  await ch.send(1);
  await ch.send(2);
  assertEquals(await ch.receive(), 1);
  await ch.send(3);
  assertEquals(await ch.receive(), 2);
  assertEquals(await ch.receive(), 3);
});

// -- Unbuffered (rendezvous) --

Deno.test("Channel.send() blocks until receive on unbuffered channel", async () => {
  const ch = new Channel<number>();
  let sent = false;
  const sendPromise = ch.send(42).then(() => sent = true);
  await Promise.resolve();
  assertFalse(sent);
  assertEquals(await ch.receive(), 42);
  await sendPromise;
  assert(sent);
});

Deno.test("Channel.receive() blocks until send on unbuffered channel", async () => {
  const ch = new Channel<number>();
  let received = false;
  const recvPromise = ch.receive().then((v) => {
    received = true;
    return v;
  });
  await Promise.resolve();
  assertFalse(received);
  await ch.send(99);
  assertEquals(await recvPromise, 99);
  assert(received);
});

// -- Backpressure --

Deno.test("Channel.send() blocks when buffer is full", async () => {
  const ch = new Channel<number>(1);
  await ch.send(1);
  let sent = false;
  const sendPromise = ch.send(2).then(() => sent = true);
  await Promise.resolve();
  assertFalse(sent);
  assertEquals(await ch.receive(), 1);
  await sendPromise;
  assert(sent);
  assertEquals(await ch.receive(), 2);
});

Deno.test("Channel.receive() unblocks senders in FIFO order", async () => {
  const ch = new Channel<number>(1);
  await ch.send(0);
  const order: number[] = [];
  const p1 = ch.send(1).then(() => order.push(1));
  const p2 = ch.send(2).then(() => order.push(2));
  const p3 = ch.send(3).then(() => order.push(3));

  assertEquals(await ch.receive(), 0);
  await p1;
  assertEquals(await ch.receive(), 1);
  await p2;
  assertEquals(await ch.receive(), 2);
  await p3;
  assertEquals(await ch.receive(), 3);
  assertEquals(order, [1, 2, 3]);
});

// -- Multiple receivers --

Deno.test("Channel.send() delivers to waiting receivers in FIFO order", async () => {
  const ch = new Channel<number>();
  const order: number[] = [];
  const p1 = ch.receive().then((v) => order.push(v));
  const p2 = ch.receive().then((v) => order.push(v));
  const p3 = ch.receive().then((v) => order.push(v));

  await ch.send(10);
  await p1;
  await ch.send(20);
  await p2;
  await ch.send(30);
  await p3;
  assertEquals(order, [10, 20, 30]);
});

// -- Close --

Deno.test("Channel.close() sets closed to true and is idempotent", () => {
  const ch = new Channel<number>();
  assertFalse(ch.closed);
  ch.close();
  assert(ch.closed);
  ch.close();
  assert(ch.closed);
});

Deno.test("Channel.send() rejects on closed channel", async () => {
  const ch = new Channel<number>();
  ch.close();
  const err = await assertRejects(() => ch.send(42), ChannelClosedError);
  assertEquals(err.value, 42);
});

Deno.test("Channel.receive() rejects on closed empty channel", async () => {
  const ch = new Channel<number>();
  ch.close();
  await assertRejects(() => ch.receive(), ChannelClosedError);
});

Deno.test("Channel.receive() reuses a single ChannelClosedError after close()", async () => {
  const ch = new Channel<number>();
  ch.close();
  const e1 = await ch.receive().catch((e: unknown) => e);
  const e2 = await ch.receive().catch((e: unknown) => e);
  assertInstanceOf(e1, ChannelClosedError);
  assert(e1 === e2);
});

Deno.test("Channel.receive() drains buffered values before rejecting", async () => {
  const ch = new Channel<number>(4);
  await ch.send(1);
  await ch.send(2);
  ch.close();
  assertEquals(await ch.receive(), 1);
  assertEquals(await ch.receive(), 2);
  await assertRejects(() => ch.receive(), ChannelClosedError);
});

Deno.test("Channel.close() rejects a pending sender", async () => {
  const ch = new Channel<number>();
  const sendPromise = ch.send(42);
  ch.close();
  const err = await assertRejects(() => sendPromise, ChannelClosedError);
  assertEquals(err.value, 42);
});

Deno.test("Channel.close() rejects multiple pending senders", async () => {
  const ch = new Channel<number>();
  const p1 = ch.send(1);
  const p2 = ch.send(2);
  ch.close();
  const e1 = await assertRejects(() => p1, ChannelClosedError);
  const e2 = await assertRejects(() => p2, ChannelClosedError);
  assertEquals(e1.value, 1);
  assertEquals(e2.value, 2);
});

Deno.test("Channel.close() rejects multiple pending receivers", async () => {
  const ch = new Channel<number>();
  const p1 = ch.receive();
  const p2 = ch.receive();
  ch.close();
  await assertRejects(() => p1, ChannelClosedError);
  await assertRejects(() => p2, ChannelClosedError);
});

// -- Close with reason --

Deno.test("Channel.close(reason) causes future receive to reject with reason", async () => {
  const ch = new Channel<number>();
  const reason = new Error("upstream failure");
  ch.close(reason);
  const err = await assertRejects(() => ch.receive());
  assertEquals(err, reason);
});

Deno.test("Channel.close(reason) drains buffer then rejects with reason", async () => {
  const ch = new Channel<number>(2);
  await ch.send(1);
  ch.close(new Error("done"));
  assertEquals(await ch.receive(), 1);
  await assertRejects(() => ch.receive(), Error, "done");
});

Deno.test("Channel.close(reason) rejects pending receivers with reason", async () => {
  const ch = new Channel<number>();
  const p1 = ch.receive();
  const p2 = ch.receive();
  const reason = new Error("abort");
  ch.close(reason);
  assertEquals(await p1.catch((e: unknown) => e), reason);
  assertEquals(await p2.catch((e: unknown) => e), reason);
});

Deno.test("Channel.close(reason) still rejects pending senders with ChannelClosedError", async () => {
  const ch = new Channel<number>();
  const p = ch.send(7);
  ch.close(new Error("reason"));
  const err = await assertRejects(() => p, ChannelClosedError);
  assertEquals(err.value, 7);
});

Deno.test("Channel.close(undefined) as explicit reason rejects with undefined", async () => {
  const ch = new Channel<number>();
  ch.close(undefined);
  const err: unknown = await ch.receive().catch((e: unknown) => e);
  assertEquals(err, undefined);
});

// -- trySend --

Deno.test("Channel.trySend() buffers when space available", () => {
  const ch = new Channel<number>(2);
  assert(ch.trySend(1));
  assert(ch.trySend(2));
  assertEquals(ch.size, 2);
});

Deno.test("Channel.trySend() returns false when full, closed, or no receiver", () => {
  const full = new Channel<number>(1);
  full.trySend(1);
  assertFalse(full.trySend(2));

  const closed = new Channel<number>(1);
  closed.close();
  assertFalse(closed.trySend(1));

  const unbuffered = new Channel<number>();
  assertFalse(unbuffered.trySend(1));
});

Deno.test("Channel.trySend() delivers to waiting receiver", async () => {
  const ch = new Channel<number>();
  const recvPromise = ch.receive();
  assert(ch.trySend(42));
  assertEquals(await recvPromise, 42);
});

// -- tryReceive --

Deno.test("Channel.tryReceive() returns value when buffered", async () => {
  const ch = new Channel<number>(2);
  await ch.send(1);
  assertEquals(ch.tryReceive(), { state: "ok", value: 1 });
});

Deno.test("Channel.tryReceive() returns empty when no value is available", () => {
  const ch = new Channel<number>(2);
  assertEquals(ch.tryReceive(), { state: "empty" });
});

Deno.test("Channel.tryReceive() returns closed on closed empty channel", () => {
  const ch = new Channel<number>();
  ch.close();
  assertEquals(ch.tryReceive(), { state: "closed" });
});

Deno.test("Channel.tryReceive() drains buffer before reporting closed", async () => {
  const ch = new Channel<number>(2);
  await ch.send(1);
  ch.close();
  assertEquals(ch.tryReceive(), { state: "ok", value: 1 });
  assertEquals(ch.tryReceive(), { state: "closed" });
});

Deno.test("Channel.tryReceive() returns a shared empty result across calls", () => {
  const ch = new Channel<number>(1);
  assert(ch.tryReceive() === ch.tryReceive());
});

Deno.test("Channel.tryReceive() returns a shared closed result across calls", () => {
  const ch = new Channel<number>();
  ch.close();
  assert(ch.tryReceive() === ch.tryReceive());
});

Deno.test("Channel.tryReceive() handles undefined as a valid value", async () => {
  const ch = new Channel<undefined>(1);
  await ch.send(undefined);
  assertEquals(ch.tryReceive(), { state: "ok", value: undefined });
});

Deno.test("Channel.tryReceive() drains from waiting sender on unbuffered channel", async () => {
  const ch = new Channel<number>();
  const sendPromise = ch.send(7);
  assertEquals(ch.tryReceive(), { state: "ok", value: 7 });
  await sendPromise;
});

Deno.test("Channel.tryReceive() promotes blocked sender into buffer", async () => {
  const ch = new Channel<number>(1);
  await ch.send(1);
  const p = ch.send(2);
  assertEquals(ch.tryReceive(), { state: "ok", value: 1 });
  assertEquals(ch.size, 1);
  await p;
  assertEquals(await ch.receive(), 2);
});

// -- AbortSignal --

Deno.test("Channel.send() rejects when signal is already aborted", async () => {
  const ch = new Channel<number>();
  await assertRejects(
    () => ch.send(42, { signal: AbortSignal.abort("stopped") }),
  );
  assertFalse(ch.closed);
});

Deno.test("Channel.send() rejects when signal aborts while waiting", async () => {
  const ch = new Channel<number>();
  const controller = new AbortController();
  const p = ch.send(42, { signal: controller.signal });
  controller.abort(new Error("cancelled"));
  await assertRejects(() => p, Error, "cancelled");
});

Deno.test("Channel.send() ignores signal on immediate delivery", async () => {
  const ch = new Channel<number>(1);
  const controller = new AbortController();
  await ch.send(42, { signal: controller.signal });
  assertEquals(ch.size, 1);
  controller.abort();
});

Deno.test("Channel.send() delivers to receiver even with signal attached", async () => {
  const ch = new Channel<number>();
  const recvP = ch.receive();
  const controller = new AbortController();
  await ch.send(42, { signal: controller.signal });
  assertEquals(await recvP, 42);
});

Deno.test("Channel.receive() rejects when signal is already aborted", async () => {
  const ch = new Channel<number>();
  await assertRejects(
    () => ch.receive({ signal: AbortSignal.abort("stopped") }),
  );
  assertFalse(ch.closed);
});

Deno.test("Channel.receive() rejects when signal aborts while waiting", async () => {
  const ch = new Channel<number>();
  const controller = new AbortController();
  const p = ch.receive({ signal: controller.signal });
  controller.abort(new Error("cancelled"));
  await assertRejects(() => p, Error, "cancelled");
});

Deno.test("Channel.receive() ignores signal on immediate delivery", async () => {
  const ch = new Channel<number>(1);
  await ch.send(42);
  const controller = new AbortController();
  assertEquals(await ch.receive({ signal: controller.signal }), 42);
  controller.abort();
});

Deno.test("Channel.close() rejects signal-attached sender with ChannelClosedError", async () => {
  const ch = new Channel<number>();
  const controller = new AbortController();
  const p = ch.send(7, { signal: controller.signal });
  ch.close();
  const err = await assertRejects(() => p, ChannelClosedError);
  assertEquals(err.value, 7);
});

Deno.test("Channel.close() rejects signal-attached receiver", async () => {
  const ch = new Channel<number>();
  const controller = new AbortController();
  const p = ch.receive({ signal: controller.signal });
  ch.close();
  await assertRejects(() => p, ChannelClosedError);
});

Deno.test("Channel.send() aborted sender is removed so next sender is delivered", async () => {
  const ch = new Channel<number>();
  const c1 = new AbortController();
  const p1 = ch.send(1, { signal: c1.signal });
  const p2 = ch.send(2);
  c1.abort(new Error("abort1"));
  await assertRejects(() => p1, Error, "abort1");
  assertEquals(await ch.receive(), 2);
  await p2;
});

Deno.test("Channel.receive() aborted receiver is removed so next receiver is delivered", async () => {
  const ch = new Channel<number>();
  const c1 = new AbortController();
  const p1 = ch.receive({ signal: c1.signal });
  const p2 = ch.receive();
  c1.abort(new Error("abort1"));
  await assertRejects(() => p1, Error, "abort1");
  await ch.send(42);
  assertEquals(await p2, 42);
});

Deno.test("Channel.send() abort eagerly removes middle sender from deque", async () => {
  const ch = new Channel<number>();
  const p1 = ch.send(1);
  const c2 = new AbortController();
  const p2 = ch.send(2, { signal: c2.signal });
  const p3 = ch.send(3);

  c2.abort(new Error("abort-middle"));
  await assertRejects(() => p2, Error, "abort-middle");

  assertEquals(await ch.receive(), 1);
  await p1;
  assertEquals(await ch.receive(), 3);
  await p3;
});

Deno.test("Channel.receive() abort eagerly removes middle receiver from deque", async () => {
  const ch = new Channel<number>();
  const p1 = ch.receive();
  const c2 = new AbortController();
  const p2 = ch.receive({ signal: c2.signal });
  const p3 = ch.receive();

  c2.abort(new Error("abort-middle"));
  await assertRejects(() => p2, Error, "abort-middle");

  await ch.send(10);
  assertEquals(await p1, 10);
  await ch.send(30);
  assertEquals(await p3, 30);
});

Deno.test("Channel.send() resolves signal-attached sender when receiver arrives", async () => {
  const ch = new Channel<number>();
  const controller = new AbortController();
  const p = ch.send(42, { signal: controller.signal });
  assertEquals(await ch.receive(), 42);
  await p;
  assertFalse(ch.closed);
});

Deno.test("Channel.receive() resolves signal-attached receiver when sender arrives", async () => {
  const ch = new Channel<number>();
  const controller = new AbortController();
  const p = ch.receive({ signal: controller.signal });
  await ch.send(99);
  assertEquals(await p, 99);
  assertFalse(ch.closed);
});

Deno.test("Channel.close() does not see previously aborted sender", async () => {
  const ch = new Channel<number>();
  const c1 = new AbortController();
  const p1 = ch.send(1, { signal: c1.signal });
  const p2 = ch.send(2);
  c1.abort(new Error("abort-before-close"));
  await assertRejects(() => p1, Error, "abort-before-close");
  ch.close();
  const err = await assertRejects(() => p2, ChannelClosedError);
  assertEquals(err.value, 2);
});

Deno.test("Channel.close() does not see previously aborted receiver", async () => {
  const ch = new Channel<number>();
  const c1 = new AbortController();
  const p1 = ch.receive({ signal: c1.signal });
  const p2 = ch.receive();
  c1.abort(new Error("abort-before-close"));
  await assertRejects(() => p1, Error, "abort-before-close");
  ch.close();
  await assertRejects(() => p2, ChannelClosedError);
});

// -- Async iteration --

Deno.test("Channel async iteration drains until closed", async () => {
  const ch = new Channel<number>(4);
  await ch.send(1);
  await ch.send(2);
  await ch.send(3);
  ch.close();

  const values: number[] = [];
  for await (const v of ch) {
    values.push(v);
  }
  assertEquals(values, [1, 2, 3]);
});

Deno.test("Channel async iteration throws on close with reason", async () => {
  const ch = new Channel<number>(2);
  await ch.send(1);
  const reason = new Error("fail");
  ch.close(reason);

  const values: number[] = [];
  let caught: unknown;
  try {
    for await (const v of ch) {
      values.push(v);
    }
  } catch (e) {
    caught = e;
  }
  assertEquals(values, [1]);
  assertEquals(caught, reason);
});

Deno.test("Channel async iteration throws reason immediately when no buffer", async () => {
  const ch = new Channel<number>();
  const reason = new Error("immediate");
  ch.close(reason);

  let caught: unknown;
  try {
    for await (const _v of ch) {
      // should not reach here
    }
  } catch (e) {
    caught = e;
  }
  assertEquals(caught, reason);
});

Deno.test("Channel async iteration works with concurrent producer", async () => {
  const ch = new Channel<number>(2);

  const producer = (async () => {
    for (let i = 0; i < 5; i++) {
      await ch.send(i);
    }
    ch.close();
  })();

  const values: number[] = [];
  for await (const v of ch) {
    values.push(v);
  }
  await producer;
  assertEquals(values, [0, 1, 2, 3, 4]);
});

// -- toReadableStream --

Deno.test("Channel.toReadableStream() yields buffered values then closes", async () => {
  const ch = new Channel<number>(4);
  await ch.send(1);
  await ch.send(2);
  ch.close();
  const values = await Array.fromAsync(ch.toReadableStream());
  assertEquals(values, [1, 2]);
});

Deno.test("Channel.toReadableStream() works with concurrent producer", async () => {
  const ch = new Channel<number>(2);

  (async () => {
    for (let i = 0; i < 5; i++) {
      await ch.send(i);
    }
    ch.close();
  })();

  const values = await Array.fromAsync(ch.toReadableStream());
  assertEquals(values, [0, 1, 2, 3, 4]);
});

Deno.test("Channel.toReadableStream() errors on close with reason", async () => {
  const ch = new Channel<number>(2);
  await ch.send(1);
  const reason = new Error("fail");
  ch.close(reason);

  const values: number[] = [];
  let caught: unknown;
  try {
    for await (const v of ch.toReadableStream()) {
      values.push(v);
    }
  } catch (e) {
    caught = e;
  }
  assertEquals(values, [1]);
  assertInstanceOf(caught, Error);
  assertEquals((caught as Error).message, "fail");
});

Deno.test("Channel.toReadableStream() cancel closes the channel", async () => {
  const ch = new Channel<number>(2);
  const stream = ch.toReadableStream();
  await stream.cancel();
  assert(ch.closed);
});

Deno.test("Channel.toReadableStream() cancel(reason) forwards reason to close", async () => {
  const ch = new Channel<number>(2);
  const stream = ch.toReadableStream();
  const reason = new Error("stream-cancelled");
  await stream.cancel(reason);
  assert(ch.closed);
  const err = await ch.receive().catch((e: unknown) => e);
  assertEquals(err, reason);
});

Deno.test("Channel.toReadableStream() cancel() without reason keeps no-reason close", async () => {
  const ch = new Channel<number>();
  const stream = ch.toReadableStream();
  await stream.cancel();
  await assertRejects(() => ch.receive(), ChannelClosedError);
});

// -- Disposable --

Deno.test("Channel[Symbol.dispose]() closes the channel", () => {
  const ch = new Channel<number>();
  ch[Symbol.dispose]();
  assert(ch.closed);
});

Deno.test("Channel[Symbol.asyncDispose]() closes the channel", async () => {
  const ch = new Channel<number>();
  await ch[Symbol.asyncDispose]();
  assert(ch.closed);
});

// -- ChannelClosedError --

Deno.test("ChannelClosedError is instanceof Error", () => {
  const err = new ChannelClosedError("test");
  assertInstanceOf(err, Error);
  assertInstanceOf(err, ChannelClosedError);
  assertEquals(err.name, "ChannelClosedError");
});

Deno.test("ChannelClosedError.value is present only from send", async () => {
  const ch = new Channel<{ id: number }>();
  ch.close();

  const sendErr = await assertRejects(
    () => ch.send({ id: 1 }),
    ChannelClosedError,
  );
  assertEquals(sendErr.value, { id: 1 });

  const recvErr = await assertRejects(
    () => ch.receive(),
    ChannelClosedError,
  );
  assertFalse("value" in recvErr);
});
