// Copyright 2018-2026 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { toByteStream } from "@std/streams/unstable-to-byte-stream";

/**
 * The options that can go along with a file or directory.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface TarStreamOptions {
  /**
   * An octal literal.
   * Defaults to 0o755 for directories and 0o644 for files.
   */
  mode?: number;
  /**
   * An octal literal.
   * @default {0o0}
   */
  uid?: number;
  /**
   * An octal literal.
   * @default {0o0}
   */
  gid?: number;
  /**
   * A number of seconds since the start of epoch. Avoid negative values.
   * Defaults to the current time in seconds.
   */
  mtime?: number;
  /**
   * An ASCII string. Should be used in preference of uid.
   * @default {''}
   */
  uname?: string;
  /**
   * An ASCII string. Should be used in preference of gid.
   * @default {''}
   */
  gname?: string;
  /**
   * The major number for character device.
   * @default {''}
   */
  devmajor?: string;
  /**
   * The minor number for block device entry.
   * @default {''}
   */
  devminor?: string;
}

/**
 * The interface required to provide a file.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface TarStreamFile {
  /**
   * The type of the input.
   */
  type: "file";
  /**
   * The path to the file, relative to the archive's root directory.
   */
  path: string;
  /**
   * The size of the file in bytes.
   */
  size: number;
  /**
   * The contents of the file.
   */
  readable: ReadableStream<Uint8Array>;
  /**
   * The metadata of the file.
   */
  options?: TarStreamOptions;
}

/**
 * The interface required to provide a directory.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface TarStreamDir {
  /**
   * The type of the input.
   */
  type: "directory";
  /**
   * The path of the directory, relative to the archive's root directory.
   */
  path: string;
  /**
   * The metadata of the directory.
   */
  options?: TarStreamOptions;
}

/**
 * The interface required to provide a symbolic link.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface TarStreamSymlink {
  /**
   * The type of the input.
   */
  type: "symlink";
  /**
   * The path of the symbolic link, relative to the archive's root directory.
   */
  path: string;
  /**
   * The target path that the symbolic link points to.
   * Must be at most 100 bytes per the ustar format spec.
   */
  linkname: string;
  /**
   * The metadata of the symbolic link.
   */
  options?: TarStreamOptions;
}

/**
 * A union type merging all the TarStream interfaces that can be piped into the
 * TarStream class.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type TarStreamInput = TarStreamFile | TarStreamDir | TarStreamSymlink;

const SLASH_CODE_POINT = "/".charCodeAt(0);

/**
 * ### Overview
 * A TransformStream to create a tar archive. Tar archives allow for storing
 * multiple files in a single file (called an archive, or sometimes a tarball).
 *   These archives typically have a single '.tar' extension.  This
 * implementation follows the [FreeBSD 15.0](https://man.freebsd.org/cgi/man.cgi?query=tar&sektion=5&apropos=0&manpath=FreeBSD+15.0-CURRENT) spec.
 *
 * ### File Format & Limitations
 * The ustar file format is used for creating the tar archive.  While this
 * format is compatible with most tar readers, the format has several
 * limitations, including:
 * - Paths must be at most 256 bytes.
 * - Symlink target paths (linkname) must be at most 100 bytes.
 * - Files must be at most 8 GiBs in size, or 64 GiBs if `sizeExtension` is set
 * to true.
 * - Sparse files are not supported.
 *
 * ### Usage
 * TarStream may throw an error for several reasons. A few of those are:
 * - The path is invalid.
 * - The size provided does not match that of the iterable's length.
 *
 * ### Compression
 * Tar archives are not compressed by default.  If you'd like to compress the
 * archive, you may do so by piping it through a compression stream.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore
 * import { TarStream, type TarStreamInput } from "@std/tar/tar-stream";
 *
 * await ReadableStream.from<TarStreamInput>([
 *   {
 *     type: "directory",
 *     path: 'potato/'
 *   },
 *   {
 *     type: "file",
 *     path: 'deno.json',
 *     size: (await Deno.stat('deno.json')).size,
 *     readable: (await Deno.open('deno.json')).readable
 *   },
 *   {
 *     type: "file",
 *     path: '.vscode/settings.json',
 *     size: (await Deno.stat('.vscode/settings.json')).size,
 *     readable: (await Deno.open('.vscode/settings.json')).readable
 *   }
 * ])
 *   .pipeThrough(new TarStream())
 *   .pipeThrough(new CompressionStream('gzip'))
 *   .pipeTo((await Deno.create('./out.tar.gz')).writable)
 * ```
 */
export class TarStream implements TransformStream<TarStreamInput, Uint8Array_> {
  #encoder = new TextEncoder();
  #readable: ReadableStream<Uint8Array_>;
  #writable: WritableStream<TarStreamInput>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      TarStreamInput,
      TarStreamInput
    >();
    this.#writable = writable;
    const gen = this.#tar(readable);
    this.#readable = new ReadableStream({
      type: "bytes",
      autoAllocateChunkSize: 512,
      async start(_controller) {
        await gen.next(); // Prime the generator
      },
      async pull(controller) {
        const offset = controller.byobRequest!.view!.byteOffset;
        const length = controller.byobRequest!.view!.byteLength;
        const buffer = new Uint8Array(
          controller.byobRequest!.view!.buffer as ArrayBuffer,
          offset,
          length,
        );

        try {
          const { done, value } = await gen.next(buffer);
          if (done) {
            controller.close();
            return controller.byobRequest!.respond(0);
          }

          // Buffer was passed to readable of file contents.
          // deno-lint-ignore no-explicit-any
          if ((buffer.buffer as any).detached) {
            return controller.byobRequest!.respondWithNewView(value);
          }
          // Buffer was filled out in place.
          if (buffer.buffer === value.buffer) {
            return controller.byobRequest!.respond(value.length);
          }
          // New buffer was returned as provided buffer was too small to work with.
          buffer.set(value.subarray(0, length));
          controller.byobRequest!.respond(length);
          controller.enqueue(value.subarray(length));
        } catch (e) {
          controller.error(e);
        }
      },
    }) as unknown as ReadableStream<Uint8Array_>;
  }

  #parsePathInto(path: string, buffer: Uint8Array_): void {
    parsePath(this.#encoder.encodeInto(path, buffer).written, buffer);
  }

  #parseHeaderInto(
    input: TarStreamInput,
    buffer: Uint8Array_,
  ): void {
    input.options ??= {};
    input.options.mode ??= input.type === "file"
      ? 0o644
      : input.type === "symlink"
      ? 0o777
      : 0o755;
    input.options.uid ??= 0o0;
    input.options.gid ??= 0o0;
    input.options.mtime ??= Math.floor(Date.now() / 1000);
    input.options.uname ??= "";
    input.options.gname ??= "";
    input.options.devmajor ??= "";
    input.options.devminor ??= "";
    assertValidTarStreamOptions(input.options);
    if (
      input.type === "file" &&
      (input.size < 0 || 8 ** 12 < input.size || Number.isNaN(input.size))
    ) {
      throw new RangeError(
        "Cannot add to the tar archive: The size cannot exceed 64 Gibs",
      );
    }
    if (input.type === "symlink") {
      assertValidLinkname(input.linkname);
    }

    // name (100) & prefix (155)
    this.#parsePathInto(input.path, buffer);
    // mode (8)
    parseOctalInto(input.options.mode, buffer.subarray(100, 106));
    buffer[106] = 32;
    buffer[107] = 0;
    // uid (8)
    parseOctalInto(input.options.uid, buffer.subarray(108, 114));
    buffer[114] = 32;
    buffer[115] = 0;
    // gid (8)
    parseOctalInto(input.options.gid, buffer.subarray(116, 122));
    buffer[122] = 32;
    buffer[123] = 0;
    // size (12)
    const size = input.type === "file" ? input.size : 0;
    buffer[135] = 32;
    parseOctalInto(size, buffer.subarray(124, 135 + +(8 ** 11 < size)));
    // mtime (12)
    parseOctalInto(input.options.mtime, buffer.subarray(136, 147));
    buffer[147] = 32;
    // checksum (8)
    buffer.fill(32, 148, 156);
    // typeflag (1)
    buffer[156] = input.type === "file"
      ? 48
      : input.type === "symlink"
      ? 50
      : 53;
    // linkname (100)
    if (input.type === "symlink") {
      buffer.subarray(157, 257).fill(0);
      this.#encoder.encodeInto(input.linkname, buffer.subarray(157, 257));
    } else {
      buffer.fill(0, 157, 257);
    }
    // magic (6)
    buffer[257] = 117;
    buffer[258] = 115;
    buffer[259] = 116;
    buffer[260] = 97;
    buffer[261] = 114;
    buffer[262] = 0;
    // version (2)
    buffer.fill(48, 263, 265);
    // uname (32)
    this.#encoder
      .encodeInto(input.options.uname, buffer.subarray(265, 297).fill(0));
    // gname (32)
    this.#encoder
      .encodeInto(input.options.gname, buffer.subarray(297, 329).fill(0));
    // devmajor (8)
    this.#encoder
      .encodeInto(input.options.devmajor, buffer.subarray(329, 337).fill(0));
    // devminor (8)
    this.#encoder
      .encodeInto(input.options.devminor, buffer.subarray(337, 345).fill(0));
    // pad (12)
    buffer.fill(0, 500, 512);
    // Update checksum
    parseOctalInto(
      buffer.subarray(0, 512).reduce((x, y) => x + y),
      buffer.subarray(148, 154),
    );
    buffer[154] = 0;
  }

  async *#tar(
    readable: ReadableStream<TarStreamInput>,
  ): AsyncGenerator<
    Uint8Array_,
    undefined,
    Uint8Array_
  > {
    let buffer = yield new Uint8Array(0); // Prime the generator
    for await (const input of readable) {
      if (buffer.length < 512) buffer = new Uint8Array(512);
      this.#parseHeaderInto(input, buffer);
      buffer = yield buffer.subarray(0, 512);

      if (input.type === "directory") continue;
      if (input.type === "symlink") continue;

      let size = 0;
      const reader = toByteStream(input.readable).getReader({ mode: "byob" });
      while (true) {
        const offset = buffer.byteOffset;
        const length = buffer.byteLength;
        const { done, value } = await reader
          .read(buffer, { min: buffer.length });
        // value can only be "undefined" if we call reader.cancel().
        // All other premature endings will result in .read throwing.
        size += value!.length;
        if (done) {
          // value.length might not be zero when done is true
          buffer = value!.length
            ? yield value!
            : new Uint8Array(value!.buffer, offset, length);
          break;
        }
        buffer = yield value;
      }
      reader.releaseLock();

      if (input.size !== size) {
        throw new RangeError(
          `Cannot add to the tar archive: The provided size (${input.size}) did not match bytes read from provided readable (${size})`,
        );
      }
      if (size % 512) {
        let x = 512 - size % 512;
        while (x > 0) {
          buffer = buffer.subarray(0, x).fill(0);
          x -= buffer.length;
          buffer = yield buffer;
        }
      }
    }
    let x = 1024;
    while (x > 0) {
      buffer = buffer.subarray(0, x).fill(0);
      x -= buffer.length;
      buffer = yield buffer;
    }
  }

  /**
   * The ReadableStream
   *
   * @return ReadableStream<Uint8Array>
   *
   * @example Usage
   * ```ts ignore
   * import { TarStream } from "@std/tar/tar-stream";
   *
   * await ReadableStream.from([
   *   {
   *     type: "directory",
   *     path: 'potato/'
   *   },
   *   {
   *     type: "file",
   *     path: 'deno.json',
   *     size: (await Deno.stat('deno.json')).size,
   *     readable: (await Deno.open('deno.json')).readable
   *   },
   *   {
   *     type: "file",
   *     path: '.vscode/settings.json',
   *     size: (await Deno.stat('.vscode/settings.json')).size,
   *     readable: (await Deno.open('.vscode/settings.json')).readable
   *   }
   * ])
   *   .pipeThrough(new TarStream())
   *   .pipeThrough(new CompressionStream('gzip'))
   *   .pipeTo((await Deno.create('./out.tar.gz')).writable)
   * ```
   */
  get readable(): ReadableStream<Uint8Array_> {
    return this.#readable;
  }

  /**
   * The WritableStream
   *
   * @return WritableStream<TarStreamInput>
   *
   * @example Usage
   * ```ts ignore
   * import { TarStream } from "@std/tar/tar-stream";
   *
   * await ReadableStream.from([
   *   {
   *     type: "directory",
   *     path: 'potato/'
   *   },
   *   {
   *     type: "file",
   *     path: 'deno.json',
   *     size: (await Deno.stat('deno.json')).size,
   *     readable: (await Deno.open('deno.json')).readable
   *   },
   *   {
   *     type: "file",
   *     path: '.vscode/settings.json',
   *     size: (await Deno.stat('.vscode/settings.json')).size,
   *     readable: (await Deno.open('.vscode/settings.json')).readable
   *   }
   * ])
   *   .pipeThrough(new TarStream())
   *   .pipeThrough(new CompressionStream('gzip'))
   *   .pipeTo((await Deno.create('./out.tar.gz')).writable)
   * ```
   */
  get writable(): WritableStream<TarStreamInput> {
    return this.#writable;
  }
}

/**
 * Asserts that the options provided are valid for a {@linkcode TarStream}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param options The TarStreamOptions
 *
 * @example Usage
 * ```ts no-assert ignore
 * import { assertValidTarStreamOptions, TarStream, type TarStreamInput } from "@std/tar";
 *
 *  const paths = (await Array.fromAsync(Deno.readDir('./')))
 *   .filter(entry => entry.isFile)
 *   .map(entry => entry.name);
 *
 * await Deno.mkdir('./out/', { recursive: true })
 * await ReadableStream.from(paths)
 *   .pipeThrough(new TransformStream<string, TarStreamInput>({
 *     async transform(path, controller) {
 *       const stats = await Deno.stat(path);
 *       const options = { mtime: stats.mtime?.getTime()! / 1000 };
 *       try {
 *         // Filter out any paths that would have an invalid options provided.
 *         assertValidTarStreamOptions(options);
 *         controller.enqueue({
 *           type: "file",
 *           path,
 *           size: stats.size,
 *           readable: (await Deno.open(path)).readable,
 *           options,
 *         });
 *       } catch (error) {
 *         console.error(error);
 *       }
 *     },
 *   }))
 *   .pipeThrough(new TarStream())
 *   .pipeThrough(new CompressionStream('gzip'))
 *   .pipeTo((await Deno.create('./out/archive.tar.gz')).writable);
 * ```
 */
export function assertValidTarStreamOptions(options: TarStreamOptions): void {
  if (
    options.mode != undefined &&
    (Number.isNaN(options.mode) ||
      options.mode < 0 ||
      octalLength(options.mode) > 6)
  ) {
    throw new TypeError(
      "Cannot add to the tar archive: Invalid Mode provided",
    );
  }
  if (
    options.uid != undefined &&
    (Number.isNaN(options.uid) ||
      options.uid < 0 ||
      octalLength(options.uid) > 6)
  ) {
    throw new TypeError(
      "Cannot add to the tar archive: Invalid UID provided",
    );
  }
  if (
    options.gid != undefined &&
    (Number.isNaN(options.gid) ||
      options.gid < 0 ||
      octalLength(options.gid) > 6)
  ) {
    throw new TypeError("Cannot add to the tar archive: Invalid GID provided");
  }
  if (
    options.mtime != undefined &&
    (Number.isNaN(options.mtime) ||
      options.mtime < 0 ||
      octalLength(options.mtime) > 11)
  ) {
    throw new TypeError(
      "Cannot add to the tar archive: Invalid MTime provided",
    );
  }
  if (
    options.uname &&
    // deno-lint-ignore no-control-regex
    (options.uname.length > 32 - 1 || !/^[\x00-\x7F]*$/.test(options.uname))
  ) {
    throw new TypeError(
      "Cannot add to the tar archive: Invalid UName provided",
    );
  }
  if (
    options.gname &&
    // deno-lint-ignore no-control-regex
    (options.gname.length > 32 - 1 || !/^[\x00-\x7F]*$/.test(options.gname))
  ) {
    throw new TypeError(
      "Cannot add to the tar archive: Invalid GName provided",
    );
  }
  if (
    options.devmajor &&
    (options.devmajor.length > 8)
  ) {
    throw new TypeError(
      "Cannot add to the tar archive: Invalid DevMajor provided",
    );
  }
  if (
    options.devminor &&
    (options.devminor.length > 8)
  ) {
    throw new TypeError(
      "Cannot add to the tar archive: Invalid DevMinor provided",
    );
  }
}

function parsePath(size: number, buffer: Uint8Array_): void {
  if (size <= 100) return;
  if (size > 256) {
    throw new RangeError(
      `Cannot parse the path as the path length cannot exceed 256 bytes: The path length is ${size}`,
    );
  }

  const sub = buffer.subarray(0, size);
  let slashPos = Math.max(0, sub.lastIndexOf(SLASH_CODE_POINT));
  if (size - slashPos > 100) {
    throw new RangeError(
      `Cannot parse the path as the file cannot exceed 100 bytes: The filename length is ${
        size - slashPos
      }`,
    );
  }

  for (let pos = slashPos; pos > 0; slashPos = pos) {
    pos = sub.lastIndexOf(SLASH_CODE_POINT, slashPos - 1);
    if (size - pos > 100) break;
  }

  const prefix = sub.subarray(0, slashPos);
  if (prefix.length > 155) {
    throw new TypeError(
      "Cannot parse the path as the path needs to be split-able on a forward slash separator into [155, 100] bytes respectively",
    );
  }
  buffer.set(prefix, 345);
  buffer.subarray(345 + prefix.length, 500).fill(0);
  const name = sub.subarray(slashPos + 1);
  buffer.set(name);
  buffer.subarray(name.length, 100).fill(0);
}

/**
 * Asserts that the path provided is valid for a {@linkcode TarStream}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * It provides a means to check that a path is valid before pipping it through
 * the `TarStream`, where if invalid will throw an error. Ruining any progress
 * made when archiving.
 *
 * @param path The path as a string
 *
 * @example Usage
 * ```ts no-assert ignore
 * import { assertValidPath, TarStream, type TarStreamInput } from "@std/tar";
 *
 * const paths = (await Array.fromAsync(Deno.readDir("./")))
 *   .filter(entry => entry.isFile)
 *   .map((entry) => entry.name)
 *   // Filter out any paths that are invalid as they are to be placed inside a Tar.
 *   .filter(path => {
 *     try {
 *       assertValidPath(path);
 *       return true;
 *     } catch (error) {
 *       console.error(error);
 *       return false;
 *     }
 *   });
 *
 * await Deno.mkdir('./out/', { recursive: true })
 * await ReadableStream.from(paths)
 *   .pipeThrough(
 *     new TransformStream<string, TarStreamInput>({
 *       async transform(path, controller) {
 *         controller.enqueue({
 *           type: "file",
 *           path,
 *           size: (await Deno.stat(path)).size,
 *           readable: (await Deno.open(path)).readable,
 *         });
 *       },
 *     }),
 *   )
 *   .pipeThrough(new TarStream())
 *   .pipeThrough(new CompressionStream('gzip'))
 *   .pipeTo((await Deno.create('./out/archive.tar.gz')).writable);
 * ```
 */
export function assertValidPath(path: string): void {
  const buffer = new Uint8Array(512);
  parsePath(new TextEncoder().encodeInto(path, buffer).written, buffer);
}

/**
 * Asserts that the linkname provided is valid for a {@linkcode TarStream}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param linkname The linkname as a string
 *
 * @example Usage
 * ```ts no-assert ignore
 * import { assertValidLinkname, TarStream, type TarStreamInput } from "@std/tar";
 *
 * const linkname = "./target";
 * assertValidLinkname(linkname);
 * await ReadableStream.from<TarStreamInput>([
 *   { type: "symlink", path: "./link", linkname },
 * ])
 *   .pipeThrough(new TarStream())
 *   .pipeTo((await Deno.create('./out.tar')).writable);
 * ```
 */
export function assertValidLinkname(linkname: string): void {
  if (linkname.length === 0) {
    throw new TypeError(
      "Cannot add to the tar archive: Invalid Linkname provided",
    );
  }
  const encoded = new TextEncoder().encode(linkname);
  if (encoded.length > 100) {
    throw new TypeError(
      `Cannot add to the tar archive: Linkname cannot exceed 100 bytes: The linkname length is ${encoded.length}`,
    );
  }
}

function parseOctalInto(x: number, buffer: Uint8Array_): void {
  for (let i = buffer.length - 1; i >= 0; --i) {
    buffer[i] = x % 8 + 48;
    x = Math.floor(x / 8);
  }
}

function octalLength(x: number): number {
  let i = 0;
  while (x) {
    x = Math.floor(x / 8);
    ++i;
  }
  return i;
}
