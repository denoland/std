/**
 * Ported and modified from: https://github.com/beatgammit/tar-js and
 * licensed as:
 *
 * (The MIT License)
 *
 * Copyright (c) 2011 T. Jameson Little
 * Copyright (c) 2019 Jun Kato
 * Copyright (c) 2018-2022 the Deno authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import { Buffer } from "../streams/buffer.ts";
import { TarInfo, FileTypes, ustarStructure, recordSize } from "./_stream_common.ts";
import { assert } from "../assert/assert.ts";

// https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_06
// eight checksum bytes taken to be ascii spaces (decimal value 32)
const initialChecksum = 8 * 32;

/**
 * Remove the trailing null codes
 * @param buffer
 */
function trim(buffer: Uint8Array): Uint8Array {
  const index = buffer.findIndex((v): boolean => v === 0);
  if (index < 0) return buffer;
  return buffer.subarray(0, index);
}


/**
 * Parse file header in a tar archive
 * @param buffer
 */
function parseHeader(buffer: Uint8Array): TarHeader {
  const data: Record<string, Uint8Array> = {};
  let offset = 0;
  for (const value of ustarStructure) {
    data[value.field] = buffer.subarray(offset, offset + value.length);
    offset += value.length;
  }
  return data as TarHeader;
}

type TarHeader = Record<(typeof ustarStructure)[number]["field"], Uint8Array>;


export interface TarMeta extends TarInfo {
  fileName: string;
  fileSize?: number;
}

// deno-lint-ignore no-empty-interface
interface TarEntry extends TarMeta {}

class TarEntry {
  #header: TarHeader;
  #readableInner: ReadableStream<Uint8Array>;
  #readable: ReadableStream<Uint8Array>;
  #fileSize: number;
  #read = 0;
  #consumed = false;
  #entrySize: number;

  constructor(
    meta: TarMeta,
    header: TarHeader,
    readable: ReadableStream<Uint8Array>,
  ) {
    Object.assign(this, meta);
    this.#header = header;
    this.#readableInner = readable;
    this.#readable = new ReadableStream({
      pull: async (controller) => {
        const p = new Uint8Array(controller.byobRequest!.view!.buffer);
        // Bytes left for entry
        const entryBytesLeft = this.#entrySize - this.#read;
        // bufSize can't be greater than p.length nor bytes left in the entry
        const bufSize = Math.min(p.byteLength, entryBytesLeft);

        if (entryBytesLeft <= 0) {
          this.#consumed = true;
          controller.close();
          return;
        }

        const reader = this.#readableInner.getReader({ mode: "byob" });
        const res = await reader.read(new Uint8Array(bufSize), { min: bufSize });
        reader.releaseLock();

        const bytesLeft = this.#fileSize - this.#read;
        this.#read += bufSize;
        if (res.done || bytesLeft <= 0) {
          if (res.done) this.#consumed = true;
          controller.close();
          return;
        }
        p.set(res.value, 0);
        controller.byobRequest!.respond(bufSize);
      },
      autoAllocateChunkSize: 512,
      type: "bytes",
    }, { highWaterMark: 0 });

    // File Size
    this.#fileSize = this.fileSize || 0;
    // Entry Size
    const blocks = Math.ceil(this.#fileSize / recordSize);
    this.#entrySize = blocks * recordSize;
  }

  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  get consumed(): boolean {
    return this.#consumed;
  }

  async discard() {
    // Discard current entry
    if (this.#consumed) return;
    this.#consumed = true;

    for await (const _ of this.#readableInner) {
      //
    }
  }
}

/** A class to extract a tar archive */
export class UntarStream implements TransformStream<Uint8Array, TarEntry> {
  readable: ReadableStream<TarEntry>;
  #buffer: Buffer;
  #block = new Uint8Array(recordSize);
  #entry: TarEntry | undefined;

  constructor() {
    this.#buffer = new Buffer();
    this.readable = new ReadableStream<TarEntry>({
      pull: async (controller) => {
        if (this.#entry && !this.#entry.consumed) {
          // If entry body was not read, discard the body
          // so we can read the next entry.
          await this.#entry.discard();
        }

        const header = await this.#getHeader();
        if (header === null) {
          controller.close();
          return;
        }

        const meta = getMetadata(header);
        this.#entry = new TarEntry(meta, header, this.#buffer.readable);
        controller.enqueue(this.#entry);
      },
    }, { highWaterMark: 0 });
  }

  get writable() {
    return this.#buffer.writable;
  }

  async #getHeader(): Promise<TarHeader | null> {
    const reader = this.#buffer.readable.getReader({ mode: "byob" });
    const res = await reader.read(this.#block, { min: this.#block.byteLength });
    reader.releaseLock();
    assert(!res.done);
    this.#block = res.value;
    const header = parseHeader(this.#block);

    // calculate the checksum
    const decoder = new TextDecoder();
    const checksum = getChecksum(this.#block);

    if (parseInt(decoder.decode(header.checksum), 8) !== checksum) {
      if (checksum === initialChecksum) {
        // EOF
        return null;
      }
      throw new Error("checksum error");
    }

    const magic = decoder.decode(header.ustar);

    if (magic.indexOf("ustar")) {
      throw new Error(`unsupported archive format: ${magic}`);
    }

    return header;
  }
}

function getMetadata(header: TarHeader): TarMeta {
  const decoder = new TextDecoder();
  // get meta data
  const meta: TarMeta = {
    fileName: decoder.decode(trim(header.fileName)),
  };
  const fileNamePrefix = trim(header.fileNamePrefix);
  if (fileNamePrefix.byteLength > 0) {
    meta.fileName = decoder.decode(fileNamePrefix) + "/" + meta.fileName;
  }

  for (const key of ["fileMode", "mtime", "uid", "gid"] as const) {
    const arr = trim(header[key]);
    if (arr.byteLength > 0) {
      meta[key] = parseInt(decoder.decode(arr), 8);
    }
  }

  for (const key of ["owner", "group", "type"] as const) {
    const arr = trim(header[key]);
    if (arr.byteLength > 0) {
      meta[key] = decoder.decode(arr) as any;
    }
  }

  meta.fileSize = parseInt(decoder.decode(header.fileSize), 8);
  meta.type =
    (FileTypes[parseInt(meta.type!)] ?? meta.type) as keyof typeof FileTypes;

  return meta;
}

function getChecksum(header: Uint8Array): number {
  let sum = initialChecksum;
  for (let i = 0; i < 512; i++) {
    if (i >= 148 && i < 156) {
      // Ignore checksum header
      continue;
    }
    sum += header[i];
  }
  return sum;
}
