/**
 * Tar implementation ported and modified from https://github.com/beatgammit/tar-js
 * under The MIT License
 *
 * Copyright (c) 2011 T. Jameson Little
 * Copyright (c) 2019 Jun Kato
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
import { MultiReader } from "../io/readers.ts";

const recordSize = 512;

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

const structure: { field: string; length: number }[] = [
  {
    field: "fileName",
    length: 100
  },
  {
    field: "fileMode",
    length: 8
  },
  {
    field: "uid",
    length: 8
  },
  {
    field: "gid",
    length: 8
  },
  {
    field: "fileSize",
    length: 12
  },
  {
    field: "mtime",
    length: 12
  },
  {
    field: "checksum",
    length: 8
  },
  {
    field: "type",
    length: 1
  },
  {
    field: "linkName",
    length: 100
  },
  {
    field: "ustar",
    length: 8
  },
  {
    field: "owner",
    length: 32
  },
  {
    field: "group",
    length: 32
  },
  {
    field: "majorNumber",
    length: 8
  },
  {
    field: "minorNumber",
    length: 8
  },
  {
    field: "filenamePrefix",
    length: 155
  },
  {
    field: "padding",
    length: 12
  }
];

export interface TarData {
  fileName: string;
  fileMode: string;
  uid: string;
  gid: string;
  fileSize: string;
  mtime: string;
  checksum: string;
  type: string;
  ustar: string;
  owner: string;
  group: string;

  /**
   * file to read
   */
  filePath: string;
  /**
   * buffer to read
   */
  reader: Deno.Reader;
}

export interface TarOptions {
  /**
   * append file
   */
  filePath?: string;

  /**
   * append any arbitrary content
   */
  reader?: Deno.Reader;

  /**
   * size of the content to be appended
   */
  contentSize?: number;

  mode?: number;
  mtime?: number;
  uid?: number;
  gid?: number;
  owner?: string;
  group?: string;
}

/**
 * A class that represents a tar archive
 */
export class Tar {
  data: TarData[];
  written: number;
  out: Uint8Array;
  private blockSize: number;

  constructor(recordsPerBlock?: number) {
    this.data = [];
    this.written = 0;
    this.blockSize = (recordsPerBlock || 20) * recordSize;
    this.out = clean(this.blockSize);
  }

  /**
   * Append a file to this tar archive
   * @param fileName file name (e.g., test.txt; use slash for directory separators)
   * @param opts options
   */
  async append(fileName: string, opts: TarOptions) {
    opts = opts || {};

    const info = opts.filePath && (await Deno.stat(opts.filePath));

    let mode = opts.mode || (info && info.mode) || parseInt("777", 8) & 0xfff,
      mtime =
        opts.mtime ||
        (info && info.modified) ||
        Math.floor(new Date().getTime() / 1000),
      uid = opts.uid || 0,
      gid = opts.gid || 0;

    const tarData = {
      fileName,
      fileMode: pad(mode, 7),
      uid: pad(uid, 7),
      gid: pad(gid, 7),
      fileSize: pad(info ? info.len : opts.contentSize, 11),
      mtime: pad(mtime, 11),
      checksum: "        ",
      type: "0", // just a file
      ustar: "ustar\u000000\u0000",
      owner: opts.owner || "",
      group: opts.group || "",
      filePath: opts.filePath,
      reader: opts.reader
    } as TarData;

    // calculate the checksum
    let checksum = 0;
    const encoder = new TextEncoder();
    Object.keys(tarData)
      .filter(key => ["filePath", "reader"].indexOf(key) < 0)
      .forEach(function(key) {
        checksum += encoder.encode(tarData[key]).reduce((p, c) => p + c, 0);
      });

    tarData.checksum = pad(checksum, 6) + "\u0000 ";
    this.data.push(tarData);
  }

  /**
   * Get a Reader instance for this tar data
   */
  getReader() {
    const readers: Deno.Reader[] = [];
    this.data.forEach(tarData => {
      let { filePath, reader } = tarData,
        headerArr = format(tarData);
      readers.push(new Deno.Buffer(headerArr));
      if (!reader) {
        reader = new FileReader(filePath);
      }
      readers.push(reader);

      // to the nearest multiple of recordSize
      readers.push(
        new Deno.Buffer(
          clean(
            recordSize -
              (parseInt(tarData.fileSize, 8) % recordSize || recordSize)
          )
        )
      );
    });

    // append 2 empty records
    readers.push(new Deno.Buffer(clean(recordSize * 2)));
    return new MultiReader(...readers);
  }
}

/**
 * Simple file reader
 */
export class FileReader implements Deno.Reader {
  private file: Deno.File;
  constructor(private filePath: string, private mode: Deno.OpenMode = "r") {
  }
  public async read(p: Uint8Array) {
    if (!this.file) {
      this.file = await Deno.open(this.filePath, this.mode);
    }
    const res = await Deno.read(this.file.rid, p);
    if (res.eof) {
      await Deno.close(this.file.rid);
      this.file = null;
    }
    return res;
  }
}

/**
 * Simple file writer (call FileWriter.dispose() after use)
 */
export class FileWriter implements Deno.Writer {
  private file: Deno.File;
  constructor(private filePath: string, private mode: Deno.OpenMode = "w") {
  }
  public async write(p: Uint8Array) {
    if (!this.file) {
      this.file = await Deno.open(this.filePath, this.mode);
    }
    return Deno.write(this.file.rid, p);
  }
  public async dispose() {
    if (!this.file) return;
    Deno.close(this.file.rid);
    this.file = null;
  }
}

/**
 * Create header for a file in a tar archive
 */
function format(data: TarData) {
  const encoder = new TextEncoder(),
    buffer = clean(512);
  let offset = 0;
  structure.forEach(function(value) {
    const entry = encoder.encode(data[value.field] || "");
    buffer.set(entry, offset);
    offset += value.length; // space it out with nulls
  });
  return buffer;
}

/**
 * Initialize Uint8Array of the specified length filled with 0
 * @param length
 */
function clean(length: number) {
  const buffer = new Uint8Array(length);
  buffer.fill(0, 0, length - 1);
  return buffer;
}

function pad(num: number, bytes: number, base?: number) {
  var numString = num.toString(base || 8);
  return "000000000000".substr(numString.length + 12 - bytes) + numString;
}
