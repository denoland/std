/**
 * Ported and modified from: https://github.com/beatgammit/tar-js and
 * licensed as:
 *
 * (The MIT License)
 *
 * Copyright (c) 2011 T. Jameson Little
 * Copyright (c) 2019 Jun Kato
 * Copyright (c) 2018-2021 the Deno authors
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
import { PartialReadError } from "../io/buffer.ts";
import { assert } from "../_util/assert.ts";
import { readableStreamFromReader } from "../streams/conversion.ts";

const recordSize = 512;
const ustar = "ustar\u000000";

// https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_06
// eight checksum bytes taken to be ascii spaces (decimal value 32)
const initialChecksum = 8 * 32;

async function readBlock(
  readable: ReadableStream<Uint8Array>,
  p: Uint8Array,
): Promise<number | null> {
  let bytesRead = 0;
  const reader = readable.getReader({mode: "byob"});
  while (bytesRead < p.length) {
    const res = await reader.read(p.subarray(bytesRead));
    if (res.done) {
      if (bytesRead === 0) {
        return null;
      } else {
        throw new PartialReadError();
      }
    }
    bytesRead += res.value.byteLength;
  }
  reader.releaseLock();
  return bytesRead;
}

/**
 * Simple file reader
 */
function readFile(path: string): ReadableStream<Uint8Array> {
  const file = Deno.openSync(path, { read: true });
  return readableStreamFromReader(file);
}

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
 * Initialize Uint8Array of the specified length filled with 0
 * @param length
 */
function clean(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  buffer.fill(0, 0, length - 1);
  return buffer;
}

function pad(num: number, bytes: number, base = 8): string {
  const numString = num.toString(base);
  return "000000000000".substr(numString.length + 12 - bytes) + numString;
}

enum FileTypes {
  "file" = 0,
  "link" = 1,
  "symlink" = 2,
  "character-device" = 3,
  "block-device" = 4,
  "directory" = 5,
  "fifo" = 6,
  "contiguous-file" = 7,
}

/*
struct posix_header {           // byte offset
  char name[100];               //   0
  char mode[8];                 // 100
  char uid[8];                  // 108
  char gid[8];                  // 116
  char size[12];                // 124
  char mtime[12];               // 136
  char chksum[8];               // 148
  char typeflag;                // 156
  char linkname[100];           // 157
  char magic[6];                // 257
  char version[2];              // 263
  char uname[32];               // 265
  char gname[32];               // 297
  char devmajor[8];             // 329
  char devminor[8];             // 337
  char prefix[155];             // 345
                                // 500
};
*/

const ustarStructure: Array<{ field: string; length: number }> = [
  {
    field: "fileName",
    length: 100,
  },
  {
    field: "fileMode",
    length: 8,
  },
  {
    field: "uid",
    length: 8,
  },
  {
    field: "gid",
    length: 8,
  },
  {
    field: "fileSize",
    length: 12,
  },
  {
    field: "mtime",
    length: 12,
  },
  {
    field: "checksum",
    length: 8,
  },
  {
    field: "type",
    length: 1,
  },
  {
    field: "linkName",
    length: 100,
  },
  {
    field: "ustar",
    length: 8,
  },
  {
    field: "owner",
    length: 32,
  },
  {
    field: "group",
    length: 32,
  },
  {
    field: "majorNumber",
    length: 8,
  },
  {
    field: "minorNumber",
    length: 8,
  },
  {
    field: "fileNamePrefix",
    length: 155,
  },
  {
    field: "padding",
    length: 12,
  },
];

/**
 * Create header for a file in a tar archive
 */
function formatHeader(data: TarData): Uint8Array {
  const encoder = new TextEncoder(),
    buffer = clean(512);
  let offset = 0;
  ustarStructure.forEach(function (value): void {
    const entry = encoder.encode(data[value.field as keyof TarData] || "");
    buffer.set(entry, offset);
    offset += value.length; // space it out with nulls
  });
  return buffer;
}

/**
 * Parse file header in a tar archive
 * @param buffer
 */
function parseHeader(buffer: Uint8Array): { [key: string]: Uint8Array } {
  const data: { [key: string]: Uint8Array } = {};
  let offset = 0;
  ustarStructure.forEach(function (value): void {
    const arr = buffer.subarray(offset, offset + value.length);
    data[value.field] = arr;
    offset += value.length;
  });
  return data;
}

interface TarHeader {
  [key: string]: Uint8Array;
}

export interface TarData {
  fileName?: string;
  fileNamePrefix?: string;
  fileMode?: string;
  uid?: string;
  gid?: string;
  fileSize?: string;
  mtime?: string;
  checksum?: string;
  type?: string;
  ustar?: string;
  owner?: string;
  group?: string;
}

export interface TarDataWithSource extends TarData {
  /**
   * file to read
   */
  filePath?: string;
  /**
   * buffer to read
   */
  readable?: ReadableStream<Uint8Array>;
}

export interface TarInfo {
  fileMode?: number;
  mtime?: number;
  uid?: number;
  gid?: number;
  owner?: string;
  group?: string;
  type?: string;
}

export interface TarOptions extends TarInfo {
  /**
   * file name
   */
  name: string;

  /**
   * append file
   */
  filePath?: string;

  /**
   * append any arbitrary content
   */
  readable?: ReadableStream<Uint8Array>;

  /**
   * size of the content to be appended
   */
  contentSize?: number;
}

export interface TarMeta extends TarInfo {
  fileName: string;
  fileSize?: number;
}

// deno-lint-ignore no-empty-interface
interface TarEntry extends TarMeta {}

class TarEntry extends ReadableStream<Uint8Array> {
  #header: TarHeader;
  #readable: ReadableStream<Uint8Array>;
  #size: number;
  #read = 0;
  #consumed = false;
  #entrySize: number;

  constructor(
    meta: TarMeta,
    header: TarHeader,
    readable: ReadableStream<Uint8Array>,
  ) {
    super({
      // @ts-ignore incompatible, bad typings
      pull: async (controller: ReadableByteStreamController) => {
        const p = new Uint8Array(controller.byobRequest!.view!.buffer);
        // Bytes left for entry
        const entryBytesLeft = this.#entrySize - this.#read;
        // bufSize can't be greater than p.length nor bytes left in the entry
        const bufSize = Math.min(p.byteLength, entryBytesLeft);

        if (entryBytesLeft <= 0) {
          this.#consumed = true;
          return null;
        }

        const block = new Uint8Array(bufSize);
        const n = await readBlock(this.#readable, block);
        const bytesLeft = this.#size - this.#read;

        this.#read += n || 0;
        if (n === null || bytesLeft <= 0) {
          if (n === null) this.#consumed = true;
          return null;
        }

        // Remove zero filled
        const offset = bytesLeft < n ? bytesLeft : n;
        p.set(block.subarray(0, offset), 0);

        controller.byobRequest!.respond(offset < 0 ? n - Math.abs(offset) : offset);
      },
      // @ts-ignore incompatible, bad typings
      type: "bytes",
    });

    Object.assign(this, meta);
    this.#header = header;
    this.#readable = readable;

    // File Size
    this.#size = this.fileSize || 0;
    // Entry Size
    const blocks = Math.ceil(this.#size / recordSize);
    this.#entrySize = blocks * recordSize;
  }

  get consumed(): boolean {
    return this.#consumed;
  }

  async discard() {
    // Discard current entry
    if (this.#consumed) return;
    this.#consumed = true;

    for await (const _ of this.#readable) {
      //
    }
  }
}

/**
 * A class to create a tar archive
 */
export class TarStream extends TransformStream<TarOptions, Uint8Array> {
  constructor() {
    super({
      transform: async (chunk, controller) => {
        // separate file name into two parts if needed
        let fileNamePrefix: string | undefined;
        let fileName = chunk.name;
        if (fileName.length > 100) {
          let i = fileName.length;
          while (i >= 0) {
            i = fileName.lastIndexOf("/", i);
            if (i <= 155) {
              fileNamePrefix = fileName.substr(0, i);
              fileName = fileName.substr(i + 1);
              break;
            }
            i--;
          }
          const errMsg =
            "ustar format does not allow a long file name (length of [file name" +
            "prefix] + / + [file name] must be shorter than 256 bytes)";
          if (i < 0 || fileName.length > 100) {
            throw new Error(errMsg);
          } else {
            assert(fileNamePrefix != null);
            if (fileNamePrefix.length > 155) {
              throw new Error(errMsg);
            }
          }
        }

        let readable = chunk.readable;
        // set meta data
        let info: Deno.FileInfo | undefined;
        if (chunk.filePath) {
          info = await Deno.stat(chunk.filePath);
          if (info.isDirectory) {
            info.size = 0;
            readable = new ReadableStream();
          }
        }

        const mode = chunk.fileMode || (info && info.mode) || parseInt("777", 8) & 0xfff;
        const mtime = Math.floor(chunk.mtime ?? (info?.mtime ?? new Date()).valueOf() / 1000);
        const uid = chunk.uid || 0;
        const gid = chunk.gid || 0;

        if (typeof chunk.owner === "string" && chunk.owner.length >= 32) {
          throw new Error(
            "ustar format does not allow owner name length >= 32 bytes",
          );
        }
        if (typeof chunk.group === "string" && chunk.group.length >= 32) {
          throw new Error(
            "ustar format does not allow group name length >= 32 bytes",
          );
        }

        const fileSize = info?.size ?? chunk.contentSize;
        assert(fileSize != null, "fileSize must be set");

        const type = chunk.type
          ? FileTypes[chunk.type as keyof typeof FileTypes]
          : (info?.isDirectory ? FileTypes.directory : FileTypes.file);

        const tarData: TarDataWithSource = {
          fileName,
          fileNamePrefix,
          fileMode: pad(mode, 7),
          uid: pad(uid, 7),
          gid: pad(gid, 7),
          fileSize: pad(fileSize, 11),
          mtime: pad(mtime, 11),
          checksum: "        ",
          type: type.toString(),
          ustar,
          owner: chunk.owner || "",
          group: chunk.group || "",
          filePath: chunk.filePath,
          readable,
        };

        // calculate the checksum
        let checksum = 0;
        const encoder = new TextEncoder();
        Object.keys(tarData)
          .filter((key) => !["filePath", "readable"].includes(key))
          .forEach((key) => {
            checksum += encoder
              .encode(tarData[key as keyof TarData])
              .reduce((p, c) => p + c, 0);
          });

        tarData.checksum = pad(checksum, 6) + "\u0000 ";

        const headerBuf = formatHeader(tarData);
        controller.enqueue(headerBuf);
        if (!readable) {
          assert(chunk.filePath != null);
          readable = readFile(chunk.filePath);
        }

        for await (const chunk of readable) {
          controller.enqueue(chunk);
        }

        // to the nearest multiple of recordSize
        assert(tarData.fileSize != null, "fileSize must be set");
        controller.enqueue(clean(recordSize - (parseInt(tarData.fileSize, 8) % recordSize || recordSize)));
      },
      flush(controller) {
        // append 2 empty records
        controller.enqueue(clean(recordSize * 2));
      }
    });
  }
}

/**
 * A class to extract a tar archive
 */
export class UntarStream implements TransformStream<Uint8Array, TarEntry> {
  writable: WritableStream<Uint8Array>;
  readable: ReadableStream<TarEntry>;
  #innerReadable: ReadableStream<Uint8Array>;
  #block = new Uint8Array(recordSize);
  #entry: TarEntry | undefined;

  constructor() {
    const readable = new ReadableStream<TarEntry>({
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
        this.#entry = new TarEntry(meta, header, this.#innerReadable);
        controller.enqueue(this.#entry);
      },
    });
    const innerTransform = new TransformStream<Uint8Array, Uint8Array>();
    this.readable = readable;
    this.writable = innerTransform.writable;
    this.#innerReadable = innerTransform.readable;
  }

  async #getHeader(): Promise<TarHeader | null> {
    await readBlock(this.#innerReadable, this.#block);
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
      meta[key] = decoder.decode(arr);
    }
  }

  meta.fileSize = parseInt(decoder.decode(header.fileSize), 8);
  meta.type = FileTypes[parseInt(meta.type!)] ?? meta.type;

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
