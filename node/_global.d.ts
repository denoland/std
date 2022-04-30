// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { EventEmitter } from "./_events.d.ts";
import { Buffer } from "./buffer.ts";

/** One of:
 * | "ascii"
 * | "utf8"
 * | "utf-8"
 * | "utf16le"
 * | "ucs2"
 * | "ucs-2"
 * | "base64"
 * | "base64url"
 * | "latin1"
 * | "binary"
 * | "hex";
 */
export type BufferEncoding = string;

export interface Buffered {
  chunk: Buffer;
  encoding: string;
  callback: (err?: Error | null) => void;
}

export interface ErrnoException extends Error {
  errno?: number | undefined;
  code?: string | undefined;
  path?: string | undefined;
  syscall?: string | undefined;
}

// https://nodejs.org/api/stream.html#class-streamreadable
export type ReadableStreamListenerMap = {
  close: () => void;
  // (Node docs are explicitly listing any as possible chunk type)
  // deno-lint-ignore no-explicit-any
  data: (chunk?: Buffer | string | any) => void;
  end: () => void;
  error: (error: Error) => void;
  pause: () => void;
  readable: () => void;
  resume: () => void;
};
export interface ReadableStreamI {
  readable: boolean;
  read(size?: number): string | Buffer;
  setEncoding(encoding: BufferEncoding): this;
  pause(): this;
  resume(): this;
  isPaused(): boolean;
  pipe<T extends WritableStream>(
    destination: T,
    options?: { end?: boolean | undefined },
  ): T;
  unpipe(destination?: WritableStream): this;
  unshift(chunk: string | Uint8Array, encoding?: BufferEncoding): void;
  wrap(oldStream: ReadableStream): this;
  [Symbol.asyncIterator](): AsyncIterableIterator<string | Buffer>;
}
export interface ReadableStream
  extends ReadableStreamI, EventEmitter<ReadableStreamListenerMap> {}

// https://nodejs.org/api/stream.html#class-streamwritable
export type WritableStreamListenerMap = {
  close: () => void;
  drain: () => void;
  error: (error: Error) => void; // Not sure if error exists when calling destroy without parameter
  finish: () => void;
  pipe: (src: ReadableStream) => void;
  unpipe: (src: ReadableStream) => void;
};
export interface WritableStreamI {
  writable: boolean;
  write(
    buffer: Uint8Array | string,
    cb?: (err?: Error | null) => void,
  ): boolean;
  write(
    str: string,
    encoding?: BufferEncoding,
    cb?: (err?: Error | null) => void,
  ): boolean;
  end(cb?: () => void): void;
  end(data: string | Uint8Array, cb?: () => void): void;
  end(str: string, encoding?: BufferEncoding, cb?: () => void): void;
}
export interface WritableStream
  extends WritableStreamI, EventEmitter<WritableStreamListenerMap> {}

export interface ReadWriteStream
  extends
    ReadableStreamI,
    WritableStreamI,
    EventEmitter<WritableStreamListenerMap & ReadableStreamListenerMap> {}
