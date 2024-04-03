// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

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

/**
 * @param pathname is what the file is called.
 * @param header is the header of the file.
 * @param readable is the contents of the file.
 */
export type TarEntry = {
  pathname: string;
  header: TarHeader;
  readable: ReadableStream<Uint8Array>;
};

/**
 * The header of a file decoded into an object, where `pad` is the remaining bytes of the header.
 * The `pad` will be larger if the optional properties are missing.
 */
export type TarHeader = {
  name: string;
  mode: string;
  uid: string;
  gid: string;
  size: number;
  mtime: string;
  checksum: string;
  typeflag: string;
  linkname: string;
  magic?: string;
  version?: string;
  uname?: string;
  gname?: string;
  devmajor?: number;
  devminor?: number;
  prefix?: string;
  pad: Uint8Array;
};

/**
 * ### Overview
 * A class to extract from a tar archive.  Tar archives allow for storing multiple
 * files in a single file (called an archive, or sometimes a tarball).  These
 * archives typically have the '.tar' extension.
 *
 * ### Supported file formats
 * Only the ustar file format is supported.  This is the most common format.
 * The numeric extension feature of the size to allow up to 64 GiBs is also supported.
 *
 * ### Usage
 * The workflow is to create a UnTar instance passing in a ReadableStream of the archive.
 * You can then iterate over the instance to pull out the entries one by one and decide
 * if you want to read it or skip over it.  Each entry's readable stream must either be
 * consumed or the `cancel` method must be called on it. The next entry won't resolve until
 * either action is done on the ReadableStream.
 *
 * @example
 * ```ts
 * import { UnTar } from '@std/archive'
 *
 * for await (
 *   const entry of new UnTar((await Deno.open('./out.tar.gz')).readable)
 * ) {
 *   console.log(entry.pathname);
 *   entry.readable.pipeTo((await Deno.create(file.pathname)).writable);
 * }
 * ```
 *
 * ### Decompression
 * UnTar does not handle decompression itself. One must first run it through the required
 * decompression stream before passing the ReadableStream to UnTar.
 *
 * @example
 * ```ts
 * import { UnTar } from '@std/archive'
 *
 * for await (
 *   const entry of new UnTar(
 *     (await Deno.open('./out.tar.gz'))
 *       .readable
 *       .pipeThrough(new DecompressionStream('gzip'))
 *   )
 * ) {
 *   console.log(entry.pathname);
 *   entry.readable.pipeTo((await Deno.create(file.pathname)).writable);
 * }
 * ```
 */
export class UnTar extends ReadableStream<TarEntry> {
  /**
   * Constructs a new instance.
   */
  constructor(readable: ReadableStream<Uint8Array>) {
    const reader = readable.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>(
        {
          push: new Uint8Array(0),
          transform(chunk, controller) {
            const x = new Uint8Array(this.push.length + chunk.length);
            x.set(this.push);
            x.set(chunk, this.push.length);
            for (let i = 512; i <= x.length; i += 512) {
              controller.enqueue(x.slice(i - 512, i));
            }
            this.push = x.length % 512
              ? x.slice(-x.length % 512)
              : new Uint8Array(0);
          },
          flush(controller) {
            if (this.push.length) { // This should always be zero!
              controller.enqueue(this.push);
            }
          },
        } as Transformer<Uint8Array, Uint8Array> & { push: Uint8Array },
      ),
    ).getReader();

    let header: TarHeader | undefined;
    super(
      {
        cancelled: false,
        async pull(controller) {
          while (header !== undefined) {
            await new Promise((a) => setTimeout(a, 0));
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done || value.reduce((x, y) => x + y) === 0) {
              return controller.close();
            }

            const decoder = new TextDecoder();
            header = {
              name: decoder.decode(value.slice(0, 100)).replaceAll("\0", ""),
              mode: decoder.decode(value.slice(100, 108 - 2)),
              uid: decoder.decode(value.slice(108, 116 - 2)),
              gid: decoder.decode(value.slice(116, 124 - 2)),
              size: parseInt(
                decoder.decode(value.slice(124, 136)).trimEnd(),
                8,
              ), // Support tarballs with files up to 64 GiBs.
              mtime: decoder.decode(value.slice(136, 148 - 1)),
              checksum: decoder.decode(value.slice(148, 156 - 2)),
              typeflag: decoder.decode(value.slice(156, 157)),
              linkname: decoder.decode(value.slice(157, 257)).replaceAll(
                "\0",
                "",
              ),
              pad: value.slice(257),
            };
            if (
              [117, 115, 116, 97, 114, 0, 48, 48].every((byte, i) =>
                value[i + 257] === byte
              )
            ) {
              header = {
                ...header,
                magic: decoder.decode(value.slice(257, 263)),
                version: decoder.decode(value.slice(263, 265)),
                uname: decoder.decode(value.slice(265, 297)).replaceAll(
                  "\0",
                  "",
                ),
                gname: decoder.decode(value.slice(297, 329)).replaceAll(
                  "\0",
                  "",
                ),
                devmajor: value.slice(329, 337).reduce((x, y) => x + y),
                devminor: value.slice(337, 345).reduce((x, y) => x + y),
                prefix: decoder.decode(value.slice(345, 500)).replaceAll(
                  "\0",
                  "",
                ),
                pad: value.slice(500),
              };
            }
            if (header.typeflag !== "0" && header.typeflag !== "\0") {
              continue;
            }

            const size = header.size;
            let i = Math.ceil(size / 512);
            const isCancelled = () => this.cancelled;

            controller.enqueue({
              pathname: (header.prefix ? header.prefix + "/" : "") +
                header.name,
              header,
              readable: new ReadableStream<Uint8Array>({
                async pull(controller) {
                  if (i > 0) {
                    const { done, value } = await reader.read();
                    if (done) {
                      header = undefined;
                      return controller.close();
                    }
                    controller.enqueue(
                      i-- === 1 ? value.slice(0, size % 512) : value,
                    );
                  } else {
                    header = undefined;
                    if (isCancelled()) {
                      reader.cancel();
                    }
                    controller.close();
                  }
                },
                async cancel() {
                  if (i !== 1) {
                    while (i-- > 0) {
                      const { done } = await reader.read();
                      if (done) {
                        break;
                      }
                    }
                  }
                  header = undefined;
                },
              }),
            });
            break;
          }
        },
        cancel() {
          this.cancelled = true;
        },
      } as UnderlyingSource & { cancelled: boolean },
    );
  }
}

/**
 * Like the UnTar class, taking in a ReadableStream<Uint8Array> and outputs a ReadableStream<Uint8Array>
 *
 * @example
 * ```ts
 * import { UnTarStream } from '@std/archive'
 *
 * await Deno.mkdir('out/')
 * for await (
 *   const entry of (await Deno.open('./out.tar.gz'))
 *     .readable
 *     .pipeThrough(new DecompressionStream('gzip'))
 *     .pipeThrough(new UnTarStream())
 * ) {
 *   await entry.readable.pipeTo((await Deno.create('out/' + entry.pathname)).writable);
 * }
 * ```
 */
export class UnTarStream {
  #readable: ReadableStream<TarEntry>;
  #writable: WritableStream<Uint8Array>;
  /**
   * Creates an instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    const unTar = new UnTar(readable);
    this.#readable = unTar;
    this.#writable = writable;
  }

  /**
   * Returns a ReadableStream of the files in the archive.
   */
  get readable(): ReadableStream<TarEntry> {
    return this.#readable;
  }

  /**
   * Returns a WritableStream for the archive to be expanded.
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}
