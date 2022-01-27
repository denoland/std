import { Buffer, PartialReadError } from "../io/buffer.ts";
import { assert } from "../_util/assert.ts";
import { iterateReader, readAll } from "../streams/conversion.ts";
import { Deferred, deferred } from "../async/deferred.ts";

type Reader = Deno.Reader;

const RECORD_SIZE = 512;
const USTAR = "ustar\u000000";

// https://pubs.opengroup.org/onlinepubs/9699919799/utilities/pax.html#tag_20_92_13_06
// eight checksum bytes taken to be ascii spaces (decimal value 32)
const initialChecksum = 8 * 32;

async function readBlock(
  reader: Deno.Reader,
  p: Uint8Array,
): Promise<number | null> {
  let bytesRead = 0;
  while (bytesRead < p.length) {
    const rr = await reader.read(p.subarray(bytesRead));
    if (rr === null) {
      if (bytesRead === 0) {
        return null;
      } else {
        throw new PartialReadError();
      }
    }
    bytesRead += rr;
  }
  return bytesRead;
}

/**
 * Simple file reader
 */
class FileReader implements Reader {
  private file?: Deno.File;

  constructor(private filePath: string) {}

  public async read(p: Uint8Array): Promise<number | null> {
    if (!this.file) {
      this.file = await Deno.open(this.filePath, { read: true });
    }
    const res = await Deno.read(this.file.rid, p);
    if (res === null) {
      Deno.close(this.file.rid);
      this.file = undefined;
    }
    return res;
  }
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
 * @param length
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
  reader?: Reader;
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
   * file name inside a tar file
   */
  fileName: string;
  /**
   * append file
   */
  filePath?: string;

  /**
   * append any arbitrary content
   */
  reader?: Reader;

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

async function tarData(opts: TarOptions) {
  let { fileName } = opts;
  if (typeof fileName !== "string") {
    throw new Error("file name not specified");
  }
  // separate file name into two parts if needed
  let fileNamePrefix: string | undefined;
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

  // set meta data
  let info: Deno.FileInfo | undefined;
  if (opts.filePath) {
    info = await Deno.stat(opts.filePath);
    if (info.isDirectory) {
      info.size = 0;
      opts.reader = new Buffer();
    }
  }

  const mode = opts.fileMode || (info && info.mode) ||
      parseInt("777", 8) & 0xfff,
    mtime = Math.floor(
      opts.mtime ?? (info?.mtime ?? new Date()).valueOf() / 1000,
    ),
    uid = opts.uid || 0,
    gid = opts.gid || 0;
  if (typeof opts.owner === "string" && opts.owner.length >= 32) {
    throw new Error(
      "ustar format does not allow owner name length >= 32 bytes",
    );
  }
  if (typeof opts.group === "string" && opts.group.length >= 32) {
    throw new Error(
      "ustar format does not allow group name length >= 32 bytes",
    );
  }

  const fileSize = info?.size ?? opts.contentSize;
  assert(fileSize != null, "fileSize must be set");

  const type = opts.type
    ? FileTypes[opts.type as keyof typeof FileTypes]
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
    ustar: USTAR,
    owner: opts.owner || "",
    group: opts.group || "",
    filePath: opts.filePath,
    reader: opts.reader,
  };

  // calculate the checksum
  let checksum = 0;
  const encoder = new TextEncoder();
  Object.keys(tarData)
    .filter((key): boolean => ["filePath", "reader"].indexOf(key) < 0)
    .forEach(function (key): void {
      checksum += encoder
        .encode(tarData[key as keyof TarData])
        .reduce((p, c): number => p + c, 0);
    });

  tarData.checksum = pad(checksum, 6) + "\u0000 ";
  return tarData;
}

export class TarEncoderStream {
  static create() {
    return new TransformStream(new TarEncoderStream());
  }

  async transform(
    chunk: TarOptions,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    const td = await tarData(chunk);
    const headerArr = formatHeader(td);
    controller.enqueue(headerArr);
    let { reader, filePath } = td;
    if (!reader) {
      assert(filePath != null);
      reader = new FileReader(filePath);
    }

    for await (const d of iterateReader(reader)) {
      controller.enqueue(d);
    }

    // to the nearest multiple of RECORD_SIZE
    assert(td.fileSize != null, "fileSize must be set");
    controller.enqueue(
      clean(
        RECORD_SIZE -
          (parseInt(td.fileSize, 8) % RECORD_SIZE || RECORD_SIZE),
      ),
    );
  }

  flush(controller: TransformStreamDefaultController) {
    // append 2 empty records
    controller.enqueue(clean(RECORD_SIZE * 2));
  }
}

class TarEntryReader {
  constructor(private bytesTotal: number) {}
  bytesReceived = 0;
  queue: Deferred<Uint8Array>[] = [deferred()];

  async read(p: Uint8Array): Promise<number | null> {
    const chunk = await this.queue[0];
    if (!chunk) return null;
    const len = Math.min(p.byteLength, chunk.byteLength);
    p.set(chunk.subarray(0, len));
    if (len >= chunk.byteLength) {
      this.queue.shift();
    } else {
      // partial read on a chunk
      const dfd = deferred<Uint8Array>();
      dfd.resolve(chunk.subarray(len));
      this.queue[0] = dfd;
    }
    return len;
  }

  enqueue(chunk: Uint8Array): number {
    const n = Math.min(chunk.byteLength, this.bytesTotal - this.bytesReceived);
    const last = this.queue[this.queue.length - 1];
    last.resolve(chunk.subarray(0, n));
    this.bytesReceived += n;
    this.queue.push(deferred());
    return n;
  }

  done() {
    this.queue[this.queue.length - 1].resolve(undefined);
  }
}

export class TarDecoderStream {
  #block: Uint8Array;
  #reader: TarEntryReader | undefined;

  static create() {
    return new TransformStream(
      new TarDecoderStream(),
      undefined,
      {
        highWaterMark: Infinity,
      },
    );
  }

  constructor() {
    this.#block = new Uint8Array(RECORD_SIZE);
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

  #readHeader(chunk: Uint8Array): [TarHeader | null, number] {
    // write n bytes into #block
    const n = Math.min(this.#block.byteLength, chunk.byteLength);
    this.#block.set(chunk.subarray(0, n));
    this.#block = this.#block.subarray(n);
    if (this.#block.byteLength != 0) {
      return [null, n];
    }
    this.#block = new Uint8Array(this.#block.buffer);
    const header = parseHeader(this.#block);

    // calculate the checksum
    const decoder = new TextDecoder();
    const checksum = this.#checksum(this.#block);

    if (parseInt(decoder.decode(header.checksum), 8) !== checksum) {
      if (checksum === initialChecksum) {
        // EOF
        return [null, n];
      }
      throw new Error("checksum error");
    }

    const magic = decoder.decode(header.ustar);

    if (magic.indexOf("ustar")) {
      throw new Error(`unsupported archive format: ${magic}`);
    }

    return [header, n];
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
    ]).forEach((key): void => {
      const arr = trim(header[key]);
      if (arr.byteLength > 0) {
        meta[key] = parseInt(decoder.decode(arr), 8);
      }
    });
    (["owner", "group", "type"] as ["owner", "group", "type"]).forEach(
      (key): void => {
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

  transform(chunk: Uint8Array, controller: TransformStreamDefaultController) {
    let remain = chunk.byteLength;
    while (remain != 0) {
      // If reader exist, read into reader for TarEntry consumption
      if (this.#reader) {
        const n = this.#reader.enqueue(
          chunk.subarray(chunk.byteLength - remain),
        );
        remain -= n;
        if (n == 0) {
          this.#reader.done();
          this.#reader = undefined;
        }
      }
      if (remain) {
        // Read into header block
        const [header, n] = this.#readHeader(
          chunk.subarray(chunk.byteLength - remain),
        );
        if (header) {
          const meta = this.#getMetadata(header);
          const size = meta.fileSize || 0;
          const blocks = Math.ceil(size / RECORD_SIZE);
          this.#reader = new TarEntryReader(blocks * RECORD_SIZE);
          controller.enqueue(new TarEntry(meta, header, this.#reader));
        }
        remain -= n;
      }
    }
  }
}

class TarEntry {
  #header: TarHeader;
  #reader: TarEntryReader;
  #size: number;
  #read = 0;
  #consumed = false;
  #entrySize: number;

  constructor(
    meta: TarMeta,
    header: TarHeader,
    reader: TarEntryReader,
  ) {
    Object.assign(this, meta);
    this.#header = header;
    this.#reader = reader;

    // File Size
    this.#size = this.fileSize || 0;
    // Entry Size
    const blocks = Math.ceil(this.#size / RECORD_SIZE);
    this.#entrySize = blocks * RECORD_SIZE;
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

    await readAll(this);
  }
}
