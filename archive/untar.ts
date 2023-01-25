// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import {
  FileTypes,
  readBlock,
  recordSize,
  type TarMeta,
  ustarStructure,
} from "./_common.ts";
import { readAll } from "../streams/read_all.ts";
import type { Reader } from "../types.d.ts";

/*!
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

export interface TarHeader {
  [key: string]: Uint8Array;
}

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
 * @param length
 */
function parseHeader(buffer: Uint8Array): { [key: string]: Uint8Array } {
  const data: { [key: string]: Uint8Array } = {};
  let offset = 0;
  ustarStructure.forEach(function (value) {
    const arr = buffer.subarray(offset, offset + value.length);
    data[value.field] = arr;
    offset += value.length;
  });
  return data;
}

// deno-lint-ignore no-empty-interface
export interface TarEntry extends TarMeta {}

export class TarEntry implements Reader {
  #header: TarHeader;
  #reader: Reader | (Reader & Deno.Seeker);
  #size: number;
  #read = 0;
  #consumed = false;
  #entrySize: number;
  constructor(
    meta: TarMeta,
    header: TarHeader,
    reader: Reader | (Reader & Deno.Seeker),
  ) {
    Object.assign(this, meta);
    this.#header = header;
    this.#reader = reader;

    // File Size
    this.#size = this.fileSize || 0;
    // Entry Size
    const blocks = Math.ceil(this.#size / recordSize);
    this.#entrySize = blocks * recordSize;
  }

  get consumed(): boolean {
    return this.#consumed;
  }

  async read(p: Uint8Array): Promise<number | null> {
    // Bytes left for entry
    const entryBytesLeft = this.#entrySize - this.#read;
    const bufSize = Math.min(
      // bufSize can't be greater than p.length nor bytes left in the entry
      p.length,
      entryBytesLeft,
    );

    if (entryBytesLeft <= 0) {
      this.#consumed = true;
      return null;
    }

    const block = new Uint8Array(bufSize);
    const n = await readBlock(this.#reader, block);
    const bytesLeft = this.#size - this.#read;

    this.#read += n || 0;
    if (n === null || bytesLeft <= 0) {
      if (n === null) this.#consumed = true;
      return null;
    }

    // Remove zero filled
    const offset = bytesLeft < n ? bytesLeft : n;
    p.set(block.subarray(0, offset), 0);

    return offset < 0 ? n - Math.abs(offset) : offset;
  }

  async discard() {
    // Discard current entry
    if (this.#consumed) return;
    this.#consumed = true;

    if (typeof (this.#reader as Deno.Seeker).seek === "function") {
      await (this.#reader as Deno.Seeker).seek(
        this.#entrySize - this.#read,
        Deno.SeekMode.Current,
      );
      this.#read = this.#entrySize;
    } else {
      await readAll(this);
    }
  }
}

/**
 * A class to extract a tar archive
 *
 * @example
 * ```ts
 * import { Untar } from "https://deno.land/std@$STD_VERSION/archive/untar.ts";
 * import { ensureFile } from "https://deno.land/std@$STD_VERSION/fs/ensure_file.ts";
 * import { ensureDir } from "https://deno.land/std@$STD_VERSION/fs/ensure_dir.ts";
 * import { copy } from "https://deno.land/std@$STD_VERSION/streams/copy.ts";
 *
 * const reader = await Deno.open("./out.tar", { read: true });
 * const untar = new Untar(reader);
 *
 * for await (const entry of untar) {
 *   console.log(entry); // metadata
 *
 *   if (entry.type === "directory") {
 *     await ensureDir(entry.fileName);
 *     continue;
 *   }
 *
 *   await ensureFile(entry.fileName);
 *   const file = await Deno.open(entry.fileName, { write: true });
 *   // <entry> is a reader.
 *   await copy(entry, file);
 * }
 * reader.close();
 * ```
 */
export class Untar {
  reader: Reader;
  block: Uint8Array;
  #entry: TarEntry | undefined;

  constructor(reader: Reader) {
    this.reader = reader;
    this.block = new Uint8Array(recordSize);
  }

  #checksum(header: Uint8Array): number {
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

  async #getHeader(): Promise<TarHeader | null> {
    await readBlock(this.reader, this.block);
    const header = parseHeader(this.block);

    // calculate the checksum
    const decoder = new TextDecoder();
    const checksum = this.#checksum(this.block);

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

  #getMetadata(header: TarHeader): TarMeta {
    const decoder = new TextDecoder();
    // get meta data
    const meta: TarMeta = {
      fileName: decoder.decode(trim(header.fileName)),
    };
    const fileNamePrefix = trim(header.fileNamePrefix);
    if (fileNamePrefix.byteLength > 0) {
      meta.fileName = decoder.decode(fileNamePrefix) + "/" + meta.fileName;
    }
    (["fileMode", "mtime", "uid", "gid"] as [
      "fileMode",
      "mtime",
      "uid",
      "gid",
    ]).forEach((key) => {
      const arr = trim(header[key]);
      if (arr.byteLength > 0) {
        meta[key] = parseInt(decoder.decode(arr), 8);
      }
    });
    (["owner", "group", "type"] as ["owner", "group", "type"]).forEach(
      (key) => {
        const arr = trim(header[key]);
        if (arr.byteLength > 0) {
          meta[key] = decoder.decode(arr);
        }
      },
    );

    meta.fileSize = parseInt(decoder.decode(header.fileSize), 8);
    meta.type = FileTypes[parseInt(meta.type!)] ?? meta.type;

    return meta;
  }

  async extract(): Promise<TarEntry | null> {
    if (this.#entry && !this.#entry.consumed) {
      // If entry body was not read, discard the body
      // so we can read the next entry.
      await this.#entry.discard();
    }

    const header = await this.#getHeader();
    if (header === null) return null;

    const meta = this.#getMetadata(header);

    this.#entry = new TarEntry(meta, header, this.reader);

    return this.#entry;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<TarEntry> {
    while (true) {
      const entry = await this.extract();

      if (entry === null) return;

      yield entry;
    }
  }
}
