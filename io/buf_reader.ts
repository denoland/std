// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { copy } from "@std/bytes/copy";
import type { Reader } from "./types.ts";

const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const MAX_CONSECUTIVE_EMPTY_READS = 100;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);

/**
 * Thrown when a write operation is attempted on a full buffer.
 *
 * @example Usage
 * ```ts
 * import { BufWriter, BufferFullError } from "@std/io";
 * import { assert, assertEquals } from "@std/assert/assert";
 *
 * const buf = new Uint8Array(2);
 * const bufWriter = new BufWriter(buf);
 * try {
 *   await bufWriter.write(new Uint8Array([1, 2, 3]));
 * } catch (err) {
 *   assert(err instanceof BufferFullError);
 *   assertEquals(err.partial, new Uint8Array([3]));
 * }
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export class BufferFullError extends Error {
  /**
   * The name
   *
   * @example Usage
   * ```ts
   * import { BufferFullError } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const err = new BufferFullError(new Uint8Array(2));
   * assertEquals(err.name, "BufferFullError");
   * ```
   */
  override name = "BufferFullError";
  /**
   * The partially read bytes
   *
   * @example Usage
   * ```ts
   * import { BufferFullError } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const err = new BufferFullError(new Uint8Array(2));
   * assertEquals(err.partial, new Uint8Array(2));
   * ```
   */
  partial: Uint8Array;

  /**
   * Construct a new instance.
   *
   * @param partial The bytes partially read
   */
  constructor(partial: Uint8Array) {
    super("Buffer full");
    this.partial = partial;
  }
}

/**
 * Thrown when a read from a stream fails to read the
 * requested number of bytes.
 *
 * @example Usage
 * ```ts
 * import { PartialReadError } from "@std/io";
 * import { assertEquals } from "@std/assert/equals";
 *
 * try {
 *   throw new PartialReadError();
 * } catch (err) {
 *   assertEquals(err.name, "PartialReadError");
 * }
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export class PartialReadError extends Error {
  /**
   * The name
   *
   * @example Usage
   * ```ts
   * import { PartialReadError } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * try {
   *   throw new PartialReadError();
   * } catch (err) {
   *   assertEquals(err.name, "PartialReadError");
   * }
   * ```
   */
  override name = "PartialReadError";
  /**
   * he partially read bytes
   *
   * @example Usage
   * ```ts
   * import { PartialReadError } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * try {
   *   throw new PartialReadError();
   * } catch (err) {
   *   assertEquals(err.partial, undefined);
   * }
   * ```
   */
  partial?: Uint8Array;

  /** Construct a new instance. */
  constructor() {
    super("Encountered UnexpectedEof, data only partially read");
  }
}

/**
 * Result type returned by of {@linkcode BufReader.readLine}.
 *
 * @deprecated This will be removed in 1.0.0. Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export interface ReadLineResult {
  /** The line read */
  line: Uint8Array;
  /** `true  if the end of the line has not been reached, `false` otherwise. */
  more: boolean;
}

/**
 * Implements buffering for a {@linkcode Reader} object.
 *
 * @example Usage
 * ```ts
 * import { BufReader } from "@std/io";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const encoder = new TextEncoder();
 * const decoder = new TextDecoder();
 *
 * const reader = new BufReader(new Deno.Buffer(encoder.encode("hello world")));
 * const buf = new Uint8Array(11);
 * await reader.read(buf);
 * assertEquals(decoder.decode(buf), "hello world");
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Use the {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API} instead.
 */
export class BufReader implements Reader {
  #buf!: Uint8Array;
  #rd!: Reader; // Reader provided by caller.
  #r = 0; // buf read position.
  #w = 0; // buf write position.
  #eof = false;

  /**
   * Returns a new {@linkcode BufReader} if `r` is not already one.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assert } from "@std/assert/assert";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = BufReader.create(reader);
   * assert(bufReader instanceof BufReader);
   * ```
   *
   * @param r The reader to read from.
   * @param size The size of the buffer.
   * @returns A new {@linkcode BufReader} if `r` is not already one.
   */
  static create(r: Reader, size: number = DEFAULT_BUF_SIZE): BufReader {
    return r instanceof BufReader ? r : new BufReader(r, size);
  }

  /**
   * Constructs a new {@linkcode BufReader} for the given reader and buffer size.
   *
   * @param rd The reader to read from.
   * @param size The size of the buffer.
   */
  constructor(rd: Reader, size: number = DEFAULT_BUF_SIZE) {
    if (size < MIN_BUF_SIZE) {
      size = MIN_BUF_SIZE;
    }
    this.#reset(new Uint8Array(size), rd);
  }

  /**
   * Returns the size of the underlying buffer in bytes.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   *
   * assertEquals(bufReader.size(), 4096);
   * ```
   *
   * @returns The size of the underlying buffer in bytes.
   */
  size(): number {
    return this.#buf.byteLength;
  }

  /**
   * Returns the number of bytes that can be read from the current buffer.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   * await bufReader.read(new Uint8Array(5));
   * assertEquals(bufReader.buffered(), 6);
   * ```
   *
   * @returns Number of bytes that can be read from the buffer
   */
  buffered(): number {
    return this.#w - this.#r;
  }

  // Reads a new chunk into the buffer.
  #fill = async () => {
    // Slide existing data to beginning.
    if (this.#r > 0) {
      this.#buf.copyWithin(0, this.#r, this.#w);
      this.#w -= this.#r;
      this.#r = 0;
    }

    if (this.#w >= this.#buf.byteLength) {
      throw Error("bufio: tried to fill full buffer");
    }

    // Read new data: try a limited number of times.
    for (let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--) {
      const rr = await this.#rd.read(this.#buf.subarray(this.#w));
      if (rr === null) {
        this.#eof = true;
        return;
      }
      this.#w += rr;
      if (rr > 0) {
        return;
      }
    }

    throw new Error(
      `No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`,
    );
  };

  /**
   * Discards any buffered data, resets all state, and switches
   * the buffered reader to read from `r`.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   * await bufReader.read(new Uint8Array(5));
   * bufReader.reset(reader);
   * assertEquals(bufReader.buffered(), 6);
   * ```
   *
   * @param r The reader to read from.
   */
  reset(r: Reader) {
    this.#reset(this.#buf, r);
  }

  #reset = (buf: Uint8Array, rd: Reader) => {
    this.#buf = buf;
    this.#rd = rd;
    this.#eof = false;
    // this.lastByte = -1;
    // this.lastCharSize = -1;
  };

  /**
   * Reads data into `p`.
   *
   * The bytes are taken from at most one `read()` on the underlying `Reader`,
   * hence n may be less than `len(p)`.
   * To read exactly `len(p)` bytes, use `io.ReadFull(b, p)`.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   * const buf = new Uint8Array(5);
   * await bufReader.read(buf);
   * assertEquals(new TextDecoder().decode(buf), "hello");
   * ```
   *
   * @param p The buffer to read data into.
   * @returns The number of bytes read into `p`.
   */
  async read(p: Uint8Array): Promise<number | null> {
    let rr: number | null = p.byteLength;
    if (p.byteLength === 0) return rr;

    if (this.#r === this.#w) {
      if (p.byteLength >= this.#buf.byteLength) {
        // Large read, empty buffer.
        // Read directly into p to avoid copy.
        const rr = await this.#rd.read(p);
        // if (rr.nread > 0) {
        //   this.lastByte = p[rr.nread - 1];
        //   this.lastCharSize = -1;
        // }
        return rr;
      }

      // One read.
      // Do not use this.fill, which will loop.
      this.#r = 0;
      this.#w = 0;
      rr = await this.#rd.read(this.#buf);
      if (rr === 0 || rr === null) return rr;
      this.#w += rr;
    }

    // copy as much as we can
    const copied = copy(this.#buf.subarray(this.#r, this.#w), p, 0);
    this.#r += copied;
    // this.lastByte = this.buf[this.r - 1];
    // this.lastCharSize = -1;
    return copied;
  }

  /**
   * Reads exactly `p.length` bytes into `p`.
   *
   * If successful, `p` is returned.
   *
   * If the end of the underlying stream has been reached, and there are no more
   * bytes available in the buffer, `readFull()` returns `null` instead.
   *
   * An error is thrown if some bytes could be read, but not enough to fill `p`
   * entirely before the underlying stream reported an error or EOF. Any error
   * thrown will have a `partial` property that indicates the slice of the
   * buffer that has been successfully filled with data.
   *
   * Ported from https://golang.org/pkg/io/#ReadFull
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   * const buf = new Uint8Array(5);
   * await bufReader.readFull(buf);
   * assertEquals(new TextDecoder().decode(buf), "hello");
   * ```
   *
   * @param p The buffer to read data into.
   * @returns The buffer `p` if the read is successful, `null` if the end of the
   * underlying stream has been reached, and there are no more bytes available in the buffer.
   */
  async readFull(p: Uint8Array): Promise<Uint8Array | null> {
    let bytesRead = 0;
    while (bytesRead < p.length) {
      try {
        const rr = await this.read(p.subarray(bytesRead));
        if (rr === null) {
          if (bytesRead === 0) {
            return null;
          } else {
            throw new PartialReadError();
          }
        }
        bytesRead += rr;
      } catch (err) {
        if (err instanceof PartialReadError) {
          err.partial = p.subarray(0, bytesRead);
        }
        throw err;
      }
    }
    return p;
  }

  /**
   * Returns the next byte ([0, 255]) or `null`.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   * const byte = await bufReader.readByte();
   * assertEquals(byte, 104);
   * ```
   *
   * @returns The next byte ([0, 255]) or `null`.
   */
  async readByte(): Promise<number | null> {
    while (this.#r === this.#w) {
      if (this.#eof) return null;
      await this.#fill(); // buffer is empty.
    }
    const c = this.#buf[this.#r]!;
    this.#r++;
    // this.lastByte = c;
    return c;
  }

  /**
   * Reads until the first occurrence of delim in the input,
   * returning a string containing the data up to and including the delimiter.
   * If ReadString encounters an error before finding a delimiter,
   * it returns the data read before the error and the error itself
   * (often `null`).
   * ReadString returns err !== null if and only if the returned data does not end
   * in delim.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   * const str = await bufReader.readString(" ");
   * assertEquals(str, "hello ");
   *
   * const str2 = await bufReader.readString(" ");
   * assertEquals(str2, "world");
   * ```
   *
   * @param delim The delimiter to read until.
   * @returns The string containing the data up to and including the delimiter.
   */
  async readString(delim: string): Promise<string | null> {
    if (delim.length !== 1) {
      throw new Error("Delimiter should be a single character");
    }
    const buffer = await this.readSlice(delim.charCodeAt(0));
    if (buffer === null) return null;
    return new TextDecoder().decode(buffer);
  }

  /**
   * A low-level line-reading primitive. Most callers should use
   * `readString('\n')` instead.
   *
   * `readLine()` tries to return a single line, not including the end-of-line
   * bytes. If the line was too long for the buffer then `more` is set and the
   * beginning of the line is returned. The rest of the line will be returned
   * from future calls. `more` will be false when returning the last fragment
   * of the line. The returned buffer is only valid until the next call to
   * `readLine()`.
   *
   * The text returned from this method does not include the line end ("\r\n" or
   * "\n").
   *
   * When the end of the underlying stream is reached, the final bytes in the
   * stream are returned. No indication or error is given if the input ends
   * without a final line end. When there are no more trailing bytes to read,
   * `readLine()` returns `null`.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello\nworld"));
   * const bufReader = new BufReader(reader);
   * const line1 = await bufReader.readLine();
   * assertEquals(new TextDecoder().decode(line1.line), "hello");
   * const line2 = await bufReader.readLine();
   * assertEquals(new TextDecoder().decode(line2.line), "world");
   * assertEquals(line2.more, false);
   * ```
   *
   * @returns The line read.
   */
  async readLine(): Promise<ReadLineResult | null> {
    let line: Uint8Array | null = null;

    try {
      line = await this.readSlice(LF);
    } catch (err) {
      let partial;
      if (err instanceof PartialReadError) {
        partial = err.partial;
        if (!(partial instanceof Uint8Array)) {
          throw new TypeError(
            "bufio: caught error from `readSlice()` without `partial` property",
          );
        }
      }

      // Don't throw if `readSlice()` failed with `BufferFullError`, instead we
      // just return whatever is available and set the `more` flag.
      if (!(err instanceof BufferFullError)) {
        throw err;
      }

      partial = err.partial;

      // Handle the case where "\r\n" straddles the buffer.
      if (
        !this.#eof && partial &&
        partial.byteLength > 0 &&
        partial[partial.byteLength - 1] === CR
      ) {
        // Put the '\r' back on buf and drop it from line.
        // Let the next call to ReadLine check for "\r\n".
        if (this.#r <= 0) {
          throw new Error("bufio: tried to rewind past start of buffer");
        }
        this.#r--;
        partial = partial.subarray(0, partial.byteLength - 1);
      }

      if (partial) {
        return { line: partial, more: !this.#eof };
      }
    }

    if (line === null) {
      return null;
    }

    if (line.byteLength === 0) {
      return { line, more: false };
    }

    if (line[line.byteLength - 1] === LF) {
      let drop = 1;
      if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
        drop = 2;
      }
      line = line.subarray(0, line.byteLength - drop);
    }
    return { line, more: false };
  }

  /**
   * Reads until the first occurrence of `delim` in the input,
   * returning a slice pointing at the bytes in the buffer. The bytes stop
   * being valid at the next read.
   *
   * If `readSlice()` encounters an error before finding a delimiter, or the
   * buffer fills without finding a delimiter, it throws an error with a
   * `partial` property that contains the entire buffer.
   *
   * If `readSlice()` encounters the end of the underlying stream and there are
   * any bytes left in the buffer, the rest of the buffer is returned. In other
   * words, EOF is always treated as a delimiter. Once the buffer is empty,
   * it returns `null`.
   *
   * Because the data returned from `readSlice()` will be overwritten by the
   * next I/O operation, most clients should use `readString()` instead.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   * const slice = await bufReader.readSlice(0x20);
   * assertEquals(new TextDecoder().decode(slice), "hello ");
   * ```
   *
   * @param delim The delimiter to read until.
   * @returns A slice pointing at the bytes in the buffer.
   */
  async readSlice(delim: number): Promise<Uint8Array | null> {
    let s = 0; // search start index
    let slice: Uint8Array | undefined;

    while (true) {
      // Search buffer.
      let i = this.#buf.subarray(this.#r + s, this.#w).indexOf(delim);
      if (i >= 0) {
        i += s;
        slice = this.#buf.subarray(this.#r, this.#r + i + 1);
        this.#r += i + 1;
        break;
      }

      // EOF?
      if (this.#eof) {
        if (this.#r === this.#w) {
          return null;
        }
        slice = this.#buf.subarray(this.#r, this.#w);
        this.#r = this.#w;
        break;
      }

      // Buffer full?
      if (this.buffered() >= this.#buf.byteLength) {
        this.#r = this.#w;
        // #4521 The internal buffer should not be reused across reads because it causes corruption of data.
        const oldbuf = this.#buf;
        const newbuf = this.#buf.slice(0);
        this.#buf = newbuf;
        throw new BufferFullError(oldbuf);
      }

      s = this.#w - this.#r; // do not rescan area we scanned before

      // Buffer is not full.
      try {
        await this.#fill();
      } catch (err) {
        if (err instanceof PartialReadError) {
          err.partial = slice;
        }
        throw err;
      }
    }

    // Handle last byte, if any.
    // const i = slice.byteLength - 1;
    // if (i >= 0) {
    //   this.lastByte = slice[i];
    //   this.lastCharSize = -1
    // }

    return slice;
  }

  /**
   * Returns the next `n` bytes without advancing the reader. The
   * bytes stop being valid at the next read call.
   *
   * When the end of the underlying stream is reached, but there are unread
   * bytes left in the buffer, those bytes are returned. If there are no bytes
   * left in the buffer, it returns `null`.
   *
   * If an error is encountered before `n` bytes are available, `peek()` throws
   * an error with the `partial` property set to a slice of the buffer that
   * contains the bytes that were available before the error occurred.
   *
   * @example Usage
   * ```ts
   * import { BufReader, Buffer } from "@std/io";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const reader = new Buffer(new TextEncoder().encode("hello world"));
   * const bufReader = new BufReader(reader);
   * const peeked = await bufReader.peek(5);
   * assertEquals(new TextDecoder().decode(peeked), "hello");
   * ```
   *
   * @param n The number of bytes to peek.
   * @returns The next `n` bytes without advancing the reader.
   */
  async peek(n: number): Promise<Uint8Array | null> {
    if (n < 0) {
      throw Error("negative count");
    }

    let avail = this.#w - this.#r;
    while (avail < n && avail < this.#buf.byteLength && !this.#eof) {
      try {
        await this.#fill();
      } catch (err) {
        if (err instanceof PartialReadError) {
          err.partial = this.#buf.subarray(this.#r, this.#w);
        }
        throw err;
      }
      avail = this.#w - this.#r;
    }

    if (avail === 0 && this.#eof) {
      return null;
    } else if (avail < n && this.#eof) {
      return this.#buf.subarray(this.#r, this.#r + avail);
    } else if (avail < n) {
      throw new BufferFullError(this.#buf.subarray(this.#r, this.#w));
    }

    return this.#buf.subarray(this.#r, this.#r + n);
  }
}
