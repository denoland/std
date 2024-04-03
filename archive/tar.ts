// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/*!
 * Ported and modified from: https://github.com/beatgammit/tar-js and
 * licensed as:
 *
 * (The MIT License)
 *
 * Copyright (c) 2011 T. Jameson Little
 * Copyright (c) 2019 Jun Kato
 * Copyright (c) 2018-2024 the Deno authors
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

/**
 * @param pathname The pathname of of the file or directory inside the archive.
 * @param iterable The source of the file for the archive.
 * @param size The size of the file for the archive.
 * @param [sizeExtension=false] Whether to increase the size limit for this file from the default 8 GiB to 64 GiB.
 * @param options: Optional settings you can specify with the file.
 */
export type TarEntry = {
  pathname: string;
  size: number;
  sizeExtension?: boolean;
  iterable: Iterable<Uint8Array> | AsyncIterable<Uint8Array>;
  options?: Partial<TarOptions>;
} | {
  pathname: string;
  options?: Partial<TarOptions>;
};

/**
 * The Options
 */
export type TarOptions = {
  mode: string;
  uid: string;
  gid: string;
  mtime: number;
  uname: string;
  gname: string;
  devmajor: string;
  devminor: string;
};

/**
 * ### Overview
 * A class to create a tar archive.  Tar archives allow for storing multiple files in a
 * single file (called an archive, or sometimes a tarball).  These archives typically
 * have the '.tar' extension.
 *
 * # Usage
 * The workflow is to create a Tar instance, append files to it, and then write the
 * tar archive to the filesystem (or other output stream).  See the worked example below for details.
 *
 * ### File format and limitations
 * The ustar file format used for creating the archive file.
 * While this format is compatible with most tar readers,
 * the format has several limitations, including:
 * * File sizes can be at most 8 GiBs.
 * * Filenames (including path) must be at most 256 characters.
 * * Sparse files are not supported.
 * This implementation does support decoding tarballs with files up to 64 GiBs, and can create them
 * via setting `sizeExtension` to true in `TarEntry` for the `append` method, but doing so may limit its compatibility
 * with older tar implementations.
 *
 * @example
 * ```ts
 * import { Tar } from '@std/archive'
 *
 * const tar = new Tar();
 * tar.append({
 *   pathname: 'deno.txt',
 *   size: (await Deno.stat('deno.txt')).size,
 *   iterable: (await Deno.open('deno.txt')).readable
 * });
 * tar.append({
 *   pathname: 'filename_in_archive.txt',
 *   size: (await Deno.stat('filename_in_archive.txt')).size,
 *   iterable: (await Deno.open('filename_in_archive.txt')).readable
 * });
 * tar.close();
 *
 * await tar.readable.pipeTo((await Deno.create('./out.tar')).writable);
 * ```
 *
 * ### Compression
 * Tar archives are not compressed by default, but if you want to compress the archive,
 * you may pipe the archive through a compression stream like `gzip` before writing it to disk.
 *
 * @example
 * ```ts
 * import { Tar } from '@std/archive'
 *
 * const tar = new Tar();
 * tar.append({
 *   pathname: 'deno.txt',
 *   size: (await Deno.stat('deno.txt')).size,
 *   iterable: (await Deno.open('deno.txt')).readable
 * });
 * tar.append({
 *   pathname: 'filename_in_archive.txt',
 *   size: (await Deno.stat('filename_in_archive.txt')).size,
 *   iterable: (await Deno.open('filename_in_archive.txt')).readable
 * });
 * tar.close();
 *
 * await tar
 *   .readable
 *   .pipeThrough(new CompressionStream('gzip'))
 *   .pipeTo((await Deno.create('./out.tar.gz')).writable);
 * ```
 */
export class Tar {
  #paths: string[] = [];
  #entries: ({
    prefix: Uint8Array;
    name: Uint8Array;
    typeflag: string;
    options: Partial<TarOptions>;
    iterable: Iterable<Uint8Array> | AsyncIterable<Uint8Array>;
    size: number;
    sizeExtension: boolean;
  } | {
    prefix: Uint8Array;
    name: Uint8Array;
    typeflag: string;
    options: Partial<TarOptions>;
    sizeExtension: boolean;
  })[] = [];
  #readable: ReadableStream<Uint8Array>;
  #finishedAppending = false;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const gen = (async function* (tar) {
      while (
        (
          !tar.#finishedAppending ||
          tar.#entries.length
        ) &&
        await new Promise<true>((a) => setTimeout(() => a(true), 0))
      ) {
        if (!tar.#entries.length) {
          continue;
        }

        const entry = tar.#entries.shift()!;
        const encoder = new TextEncoder();
        const header = new Uint8Array(512);

        header.set(entry.name); // name
        header.set(
          encoder.encode(
            (entry.options.mode ?? (entry.typeflag === "5" ? "755" : "644"))
              .padStart(6, "0") +
              " \0" + // mode
              (entry.options.uid ?? "").padStart(6, "0") + " \0" + // uid
              (entry.options.gid ?? "").padStart(6, "0") + " \0" + // gid
              ("size" in entry ? entry.size.toString(8) : "").padStart(
                entry.sizeExtension ? 12 : 11,
                "0",
              ) + (entry.sizeExtension ? "" : " ") + // size
              (entry.options.mtime?.toString(8) ?? "").padStart(11, "0") +
              " " + // mtime
              " ".repeat(8) + // checksum | Needs to be updated
              entry.typeflag + // typeflag
              "\0".repeat(100) + // linkname
              "ustar\0" + // magic
              "00" + // version
              (entry.options.uname ?? "").padEnd(32, "\0") + // uname
              (entry.options.gname ?? "").padEnd(32, "\0") + // gname
              (entry.options.devmajor ?? "").padEnd(8, "\0") + // devmajor
              (entry.options.devminor ?? "").padEnd(8, "\0"), // devminor
          ),
          100,
        );
        header.set(entry.prefix, 345); // prefix

        header.set(
          encoder.encode(
            header.reduce((x, y) => x + y).toString(8).padStart(6, "0") + "\0",
          ),
          148,
        ); // update checksum
        yield header;

        if ("size" in entry) {
          let size = 0;
          for await (const x of entry.iterable) {
            size += x.length;
            yield x;
          }
          if (entry.size !== size) {
            throw new Error(
              "Invalid Tarball! Provided size did not match bytes read from iterable.",
            );
          }
          yield new Uint8Array(new Array(512 - entry.size % 512).fill(0));
        }
      }
      yield new Uint8Array(new Array(1024).fill(0));
    })(this);
    this.#readable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });
  }

  /**
   * Append a file or directory to the archive.
   */
  append(entry: TarEntry): void {
    if (this.#finishedAppending) {
      throw new Error("This Tar Instance has already been closed.");
    }

    if (
      "size" in entry &&
      (
        entry.size < 0 ||
        Math.pow(8, entry.sizeExtension ? 12 : 11) < entry.size ||
        entry.size.toString() === "NaN"
      )
    ) {
      throw new Error(
        "Invalid Size Provided! Size cannot exceed 8 GiBs by default or 64 GiBs with sizeExtension set to true.",
      );
    }
    entry.pathname = entry.pathname.split("/").filter((x) => x).join("/");
    if (entry.pathname.startsWith("./")) {
      entry.pathname = entry.pathname.slice(2);
    }
    if (!("size" in entry)) {
      entry.pathname += "/";
    }

    const pathname = new TextEncoder().encode(entry.pathname);
    if (pathname.length > 256) {
      throw new Error("Invalid Pathname! Pathname cannot exceed 256 bytes.");
    }

    let i = Math.max(0, pathname.lastIndexOf(47));
    if (pathname.slice(i).length > 100) {
      throw new Error("Invalid Filename! Filename cannot exceed 100 bytes.");
    }

    if (pathname.length <= 100) {
      i = 0;
    } else {
      for (; i > 0; --i) {
        i = pathname.lastIndexOf(47, i);
        if (pathname.slice(i).length > 100) {
          i = Math.max(0, pathname.indexOf(47, i + 1));
          break;
        }
      }
    }

    const prefix = pathname.slice(0, i++);
    if (prefix.length > 155) {
      throw new Error(
        "Invalid Pathname! Pathname needs to be split-able on a forward slash separator into [155, 100] bytes respectively.",
      );
    }
    const name = prefix.length ? pathname.slice(i) : pathname;

    if (this.#paths.includes(entry.pathname)) {
      return;
    }
    this.#paths.push(entry.pathname);

    if ("size" in entry) { // File
      this.#entries.push({
        prefix,
        name,
        typeflag: "0",
        options: entry.options ?? {},
        iterable: entry.iterable,
        size: entry.size,
        sizeExtension: entry.sizeExtension ?? false,
      });
    } // Directory
    else {
      this.#entries.push({
        prefix,
        name,
        typeflag: "5",
        options: entry.options ?? {},
        sizeExtension: false,
      });
    }
  }

  /**
   * Close the archive once you're end appending.
   */
  close(): void {
    this.#finishedAppending = true;
  }

  /**
   * Read the archive via a `ReadableStream<Uint8Array>`.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }
}

/**
 * Like the Tar class, but takes in a ReadableStream<TarEntry> and outputs a ReadableStream<Uint8Array>
 *
 * @example
 * ```ts
 * import { TarStream } from '@std/archive'
 *
 * ReadableStream.from([
 *   {
 *     pathname: 'deno.txt',
 *     size: (await Deno.stat('deno.txt')).size,
 *     iterable: (await Deno.open('deno.txt')).readable
 *   },
 *   {
 *     pathname: 'filename_in_archive.txt',
 *     size: (await Deno.stat('filename_in_archive.txt')).size,
 *     iterable: (await Deno.open('filename_in_archive.txt')).readable
 *   }
 * ])
 *   .pipeThrough(new TarStream())
 *   .pipeThrough(new CompressionStream('gzip'))
 *   .pipeTo((await Deno.create('./out.tar.gz')))
 * ```
 */
export class TarStream {
  #readable: ReadableStream<Uint8Array>;
  #writable: WritableStream<TarEntry>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<TarEntry, TarEntry>();
    const tar = new Tar();
    this.#readable = tar.readable;
    this.#writable = writable;
    readable.pipeTo(
      new WritableStream({
        write(chunk) {
          tar.append(chunk);
        },
        close() {
          tar.close();
        },
        abort() {
          tar.close();
        },
      }),
    );
  }

  /**
   * Read the archive via a ReadableStream<Uint8Array>
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * Write to the archive via a WritableStream<TarEntry>
   */
  get writable(): WritableStream<TarEntry> {
    return this.#writable;
  }
}
