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
 * @param pathname is what you want the file to be called inside the archive.
 * @param iterable is the source of the file in Uint8Array form.
 * @param size is the size of the source in bytes. Providing the wrong size can lead to corrupt data.
 */
export type TarFile = {
  pathname: string;
  iterable: Iterable<Uint8Array> | AsyncIterable<Uint8Array>;
  size: number;
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
 * * Filenames (including path) must be shorter than 256 characters.
 * * Sparse files are not supported.
 * This implementation does support decoding tarballs with files up to 64 GiBs, and can create them
 * via setting `sizeExtension` to true in the `append` method, but doing so may limit its compatibility
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
  #files: {
    prefix: Uint8Array;
    name: Uint8Array;
    iterable: Iterable<Uint8Array> | AsyncIterable<Uint8Array>;
    size: number;
    sizeExtension: boolean;
  }[] = [];
  #readable: ReadableStream<Uint8Array>;
  #finishedAppending: boolean = false;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const gen = (async function* (tar) {
      while (
        (!tar.#finishedAppending || tar.#files.length) &&
        await new Promise<true>((a) => setTimeout(() => a(true), 0))
      ) {
        if (tar.#files.length) {
          const file = tar.#files.shift()!;
          const encoder = new TextEncoder();
          const header = new Uint8Array(512);

          header.set(file.name); // name
          header.set(
            encoder.encode(
              "000644 \0" + // mode
                "000000 \0" + // uid
                "000000 \0" + // gid
                file.size.toString(8).padStart(file.sizeExtension ? 12 : 11) +
                (file.sizeExtension ? "" : " ") + // size
                "00000000000 " + // mtime
                "        " + // checksum | Needs to be updated
                "0" + // typeflag
                "\0".repeat(100) + // linkname
                "ustar\0" + // magic
                "00" + // version
                "\0".repeat(32 + 32 + 8 + 8), // uname, gname, devmajor, devminor
            ),
            100,
          );
          header.set(file.prefix, 345); // prefix

          header.set(
            encoder.encode(
              header.reduce((x, y) => x + y).toString(8).padStart(6, "0") +
                "\0",
            ),
            148,
          );
          yield header;

          for await (const x of file.iterable) {
            yield x;
          }
          yield encoder.encode("\0".repeat(512 - file.size % 512));
        }
      }
      yield new TextEncoder().encode("\0".repeat(1024));
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
   * Append a file to the archive. This method will throw if you provide an incompatible
   * size or pathname, or have already called the `close` method.
   * @param file Details of the TarFile being appended to the archive.
   * @param [sizeExtension=false] Enable up to 64 GiB files in the archive instead of 8 GiBs.
   */
  append(file: TarFile, sizeExtension = false): void {
    if (this.#finishedAppending) {
      throw new Error("This Tar instance has already be closed.");
    }

    // Validate size provided.
    if (file.size < 0 || Math.pow(8, sizeExtension ? 12 : 11) < file.size) {
      throw new Error(
        "Invalid File Size: Up to 8 GiBs allowed or 64 GiBs if `sizeExtension` is enabled.",
      );
    }

    file.pathname = file.pathname.split("/").filter((x) => x).join("/");
    if (file.pathname.startsWith("./")) {
      file.pathname = file.pathname.slice(2);
    }

    // Validating the path provided.
    const pathname = new TextEncoder().encode(file.pathname);
    if (pathname.length > 256) {
      throw new Error("Provided pathname is too long. Max 256 bytes.");
    }

    let i = Math.max(0, pathname.lastIndexOf(47));
    if (pathname.slice(i).length > 100) {
      throw new Error(
        "Filename in pathname is too long. Filename can be at most 100 bytes.",
      );
    }

    if (pathname.length <= 100) {
      i = 0;
    } else {
      for (; i > 0; --i) {
        i = pathname.lastIndexOf(47, i);
        if (pathname.slice(i).length > 100) {
          i = Math.max(0, pathname.indexOf(47, ++i));
          break;
        }
      }
    }

    const prefix = pathname.slice(0, i++);
    if (prefix.length > 155) {
      throw new Error(
        "Provided pathname cannot be split into [155, 100] segments along a forward slash separator.",
      );
    }
    this.#files.push({
      name: prefix.length ? pathname.slice(i) : pathname,
      prefix,
      iterable: file.iterable,
      size: file.size,
      sizeExtension,
    });
  }

  /**
   * Closes the tar archive from accepting more files. Must be called for tar archive to be properly created.
   */
  close(): void {
    this.#finishedAppending = true;
  }

  /**
   * A Readable Stream of the archive.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }
}

/**
 * Like the Tar class, but takes in a ReadableStream<TarFile> and outputs a ReadableStream<Uint8Array>
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
  #writable: WritableStream<TarFile>;
  /**
   * Creates an instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<TarFile, TarFile>();
    const tar = new Tar();
    this.#readable = tar.readable;
    this.#writable = writable;
    (async () => {
      for await (const tarFile of readable) {
        tar.append(tarFile);
      }
      tar.close();
    })();
  }

  /**
   * Returns a ReadableStream of the archive.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * Returns a WritableStream for the files to be archived.
   */
  get writable(): WritableStream<TarFile> {
    return this.#writable;
  }
}
