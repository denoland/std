// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { Deque } from "../data_structures/unstable_deque.ts";

/** Internal node for the FIFO sender waiting queue. */
interface SenderNode<T> {
  value: T;
  res: () => void;
  rej: (reason: unknown) => void;
}

/** Internal node for the FIFO receiver waiting queue. */
interface ReceiverNode<T> {
  res: (value: T) => void;
  rej: (reason: unknown) => void;
}

/**
 * Error thrown when operating on a closed channel. When thrown from
 * {@linkcode Channel.send}, the `value` property carries the unsent value
 * for recovery.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { Channel, ChannelClosedError } from "@std/async/unstable-channel";
 * import { assertInstanceOf } from "@std/assert";
 *
 * const ch = new Channel<number>();
 * ch.close();
 * try {
 *   await ch.send(42);
 * } catch (e) {
 *   assertInstanceOf(e, ChannelClosedError);
 * }
 * ```
 */
export class ChannelClosedError extends Error {
  /**
   * The unsent value, present only when the error originates from a send
   * operation.
   *
   * @example Usage
   * ```ts
   * import { Channel, ChannelClosedError } from "@std/async/unstable-channel";
   * import { assertEquals, assertInstanceOf } from "@std/assert";
   *
   * const ch = new Channel<number>();
   * ch.close();
   * try {
   *   await ch.send(42);
   * } catch (e) {
   *   assertInstanceOf(e, ChannelClosedError);
   *   assertEquals(e.value, 42);
   * }
   * ```
   */
  declare readonly value?: unknown;

  /**
   * Constructs a new {@linkcode ChannelClosedError} instance.
   *
   * @param message The error message.
   * @param rest If provided, the first element is attached as the
   *   non-writable {@linkcode ChannelClosedError.value} property.
   */
  constructor(message: string, ...rest: [value: unknown] | []) {
    super(message);
    this.name = "ChannelClosedError";
    if (rest.length > 0) {
      Object.defineProperty(this, "value", {
        value: rest[0],
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }
  }
}

/**
 * An async channel for communicating between concurrent tasks with optional
 * bounded buffering and backpressure.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic producer/consumer
 * ```ts
 * import { Channel } from "@std/async/unstable-channel";
 * import { assertEquals } from "@std/assert";
 *
 * const ch = new Channel<number>(4);
 *
 * await ch.send(1);
 * await ch.send(2);
 * ch.close();
 *
 * const values: number[] = [];
 * for await (const v of ch) {
 *   values.push(v);
 * }
 * assertEquals(values, [1, 2]);
 * ```
 *
 * @example Using `await using` for automatic cleanup
 * ```ts
 * import { Channel } from "@std/async/unstable-channel";
 * import { assert } from "@std/assert";
 *
 * let ref: Channel<string>;
 * {
 *   await using ch = new Channel<string>(8);
 *   ref = ch;
 *   await ch.send("hello");
 * }
 * assert(ref.closed);
 * ```
 *
 * @typeParam T The type of values sent through the channel.
 */
export class Channel<T>
  implements AsyncIterable<T>, Disposable, AsyncDisposable {
  readonly #capacity: number;
  #buffer: Deque<T>;
  #closed = false;
  #closeReason: unknown = undefined;
  #hasCloseReason = false;

  #senders: Deque<SenderNode<T>>;
  #receivers: Deque<ReceiverNode<T>>;

  /**
   * Creates a new channel.
   *
   * @param capacity Buffer size. `0` creates an unbuffered (rendezvous)
   *   channel where `send` blocks until a receiver is waiting. Defaults to `0`.
   */
  constructor(capacity: number = 0) {
    if (!Number.isInteger(capacity) || capacity < 0) {
      throw new RangeError(
        `Cannot create channel: capacity must be a non-negative integer, received ${capacity}`,
      );
    }
    this.#capacity = capacity;
    this.#buffer = new Deque<T>();
    this.#senders = new Deque<SenderNode<T>>();
    this.#receivers = new Deque<ReceiverNode<T>>();
  }

  /**
   * Sends a value into the channel. The returned promise resolves when the
   * value is buffered or handed to a waiting receiver. Suspends if the buffer
   * is full (or if unbuffered, suspends until a receiver calls
   * {@linkcode Channel.receive}).
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assertEquals } from "@std/assert";
   *
   * const ch = new Channel<number>(1);
   * await ch.send(42);
   * assertEquals(ch.size, 1);
   * ch.close();
   * ```
   *
   * @param value The value to send into the channel.
   * @throws {ChannelClosedError} If the channel is closed. The error's
   *   `value` property carries the unsent value for recovery.
   */
  send(value: T): Promise<void> {
    if (this.#closed) {
      return Promise.reject(
        new ChannelClosedError("Cannot send to a closed channel", value),
      );
    }

    if (this.#deliverToReceiver(value)) return Promise.resolve();

    if (this.#buffer.length < this.#capacity) {
      this.#buffer.pushBack(value);
      return Promise.resolve();
    }

    return new Promise<void>((res, rej) => {
      this.#senders.pushBack({ value, res, rej });
    });
  }

  /**
   * Receives a value from the channel. Suspends if the buffer is empty.
   * Multiple concurrent calls are supported; each value is delivered to
   * exactly one receiver in FIFO order.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assertEquals } from "@std/assert";
   *
   * const ch = new Channel<number>(1);
   * await ch.send(42);
   * assertEquals(await ch.receive(), 42);
   * ch.close();
   * ```
   *
   * @returns A promise that resolves with the next value from the channel.
   * @throws {ChannelClosedError} If the channel is closed and empty (no
   *   `value` property). If `close(reason)` was called, rejects with
   *   `reason` instead.
   */
  receive(): Promise<T> {
    if (this.#buffer.length > 0) return Promise.resolve(this.#dequeue());
    if (!this.#senders.isEmpty()) return Promise.resolve(this.#takeSender());
    if (this.#closed) return Promise.reject(this.#receiveError());

    return new Promise<T>((res, rej) => {
      this.#receivers.pushBack({ res, rej });
    });
  }

  /**
   * Non-blocking send. Does not throw.
   *
   * @param value The value to send.
   * @returns `true` if the value was delivered (buffered, or handed directly
   *   to a waiting receiver in the unbuffered case). `false` if the buffer is
   *   full, no receiver is waiting (unbuffered), or the channel is closed.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assert, assertFalse } from "@std/assert";
   *
   * const ch = new Channel<number>(1);
   * assert(ch.trySend(1));
   * assertFalse(ch.trySend(2));
   * ```
   */
  trySend(value: T): boolean {
    if (this.#closed) return false;
    if (this.#deliverToReceiver(value)) return true;
    if (this.#buffer.length >= this.#capacity) return false;

    this.#buffer.pushBack(value);
    return true;
  }

  /**
   * Non-blocking receive. The discriminated union avoids ambiguity when `T`
   * itself can be `undefined`.
   *
   * @returns `{ ok: true, value }` if a value was available, or
   *   `{ ok: false }` if the buffer is empty or the channel is closed. A
   *   close reason passed to {@linkcode Channel.close} is not surfaced here;
   *   use {@linkcode Channel.receive} to observe it.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assertEquals } from "@std/assert";
   *
   * const ch = new Channel<number>(1);
   * await ch.send(42);
   * assertEquals(ch.tryReceive(), { ok: true, value: 42 });
   * assertEquals(ch.tryReceive(), { ok: false });
   * ```
   */
  tryReceive(): { ok: true; value: T } | { ok: false } {
    if (this.#buffer.length > 0) return { ok: true, value: this.#dequeue() };
    if (!this.#senders.isEmpty()) {
      return { ok: true, value: this.#takeSender() };
    }
    return { ok: false };
  }

  /**
   * Closes the channel. Idempotent — calling `close()` on an already-closed
   * channel is a no-op. Pending `send()` calls reject with
   * {@linkcode ChannelClosedError}. Pending `receive()` calls drain remaining
   * buffered values, then reject.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assert } from "@std/assert";
   *
   * const ch = new Channel<number>();
   * ch.close();
   * assert(ch.closed);
   * ```
   *
   * @param args If a reason argument is provided, all pending and future
   *   `receive()` calls reject with that reason (after draining buffered
   *   values). Enables error propagation from producer to consumer.
   */
  close(...args: [reason: unknown] | []): void {
    if (this.#closed) return;
    this.#closed = true;
    if (args.length > 0) {
      this.#closeReason = args[0];
      this.#hasCloseReason = true;
    }

    let sender: SenderNode<T> | undefined;
    while ((sender = this.#senders.popFront()) !== undefined) {
      sender.rej(
        new ChannelClosedError(
          "Cannot send to a closed channel",
          sender.value,
        ),
      );
    }

    let receiver: ReceiverNode<T> | undefined;
    while ((receiver = this.#receivers.popFront()) !== undefined) {
      receiver.rej(this.#receiveError());
    }
  }

  /**
   * Whether the channel has been closed.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assert, assertFalse } from "@std/assert";
   *
   * const ch = new Channel<number>();
   * assertFalse(ch.closed);
   * ch.close();
   * assert(ch.closed);
   * ```
   *
   * @returns `true` if the channel is closed, `false` otherwise.
   */
  get closed(): boolean {
    return this.#closed;
  }

  /**
   * Number of values currently buffered. Informational only — the value is
   * inherently racy and should not be used for send/receive control flow.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assertEquals } from "@std/assert";
   *
   * const ch = new Channel<number>(4);
   * await ch.send(1);
   * await ch.send(2);
   * assertEquals(ch.size, 2);
   * ch.close();
   * ```
   *
   * @returns The number of buffered values.
   */
  get size(): number {
    return this.#buffer.length;
  }

  /**
   * Maximum buffer capacity (`0` for unbuffered).
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assertEquals } from "@std/assert";
   *
   * const ch = new Channel<number>(8);
   * assertEquals(ch.capacity, 8);
   * ch.close();
   * ```
   *
   * @returns The maximum buffer capacity.
   */
  get capacity(): number {
    return this.#capacity;
  }

  /**
   * Async iteration drains the channel until it is closed and empty.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assertEquals } from "@std/assert";
   *
   * const ch = new Channel<number>(4);
   * await ch.send(1);
   * await ch.send(2);
   * ch.close();
   *
   * const values: number[] = [];
   * for await (const v of ch) {
   *   values.push(v);
   * }
   * assertEquals(values, [1, 2]);
   * ```
   *
   * @returns An async iterator that yields values from the channel.
   */
  async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
    while (true) {
      try {
        yield await this.receive();
      } catch (e) {
        if (e instanceof ChannelClosedError && !this.#hasCloseReason) {
          return;
        }
        throw e;
      }
    }
  }

  /**
   * Calls {@linkcode Channel.close}. Enables `using` for automatic cleanup.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assert } from "@std/assert";
   *
   * const ch = new Channel<number>();
   * ch[Symbol.dispose]();
   * assert(ch.closed);
   * ```
   */
  [Symbol.dispose](): void {
    this.close();
  }

  /**
   * Calls {@linkcode Channel.close}. Enables `await using` for automatic
   * cleanup in async contexts.
   *
   * @example Usage
   * ```ts
   * import { Channel } from "@std/async/unstable-channel";
   * import { assert } from "@std/assert";
   *
   * const ch = new Channel<number>();
   * await ch[Symbol.asyncDispose]();
   * assert(ch.closed);
   * ```
   */
  [Symbol.asyncDispose](): Promise<void> {
    this.close();
    return Promise.resolve();
  }

  /** Hands `value` to the next waiting receiver, if any. */
  #deliverToReceiver(value: T): boolean {
    const receiver = this.#receivers.popFront();
    if (!receiver) return false;
    receiver.res(value);
    return true;
  }

  /**
   * Pops the head value from the ring buffer. If a sender is waiting, its
   * value is promoted into the freed slot.
   */
  #dequeue(): T {
    const value = this.#buffer.popFront()!;
    const sender = this.#senders.popFront();
    if (sender) {
      this.#buffer.pushBack(sender.value);
      sender.res();
    }
    return value;
  }

  /** Takes a value directly from the head of the sender queue (unbuffered path). */
  #takeSender(): T {
    const sender = this.#senders.popFront()!;
    sender.res();
    return sender.value;
  }

  #receiveError(): unknown {
    if (this.#hasCloseReason) return this.#closeReason;
    return new ChannelClosedError("Cannot receive from a closed channel");
  }
}
