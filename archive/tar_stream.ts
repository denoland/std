// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * The interface required to provide a file.
 */
export interface TarStreamFile {
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
 */
export interface TarStreamDir {
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
 * A union type merging all the TarStream interfaces that can be piped into the
 * TarStream class.
 */
export type TarStreamInput = TarStreamFile | TarStreamDir;
type TarStreamInputInternal =
  & (Omit<TarStreamFile, "path"> | Omit<TarStreamDir, "path">)
  & { path: [Uint8Array, Uint8Array] };

/**
 * The options that can go along with a file or directory.
 */
export interface TarStreamOptions {
  /**
   * An octal literal.
   * Defaults to 755 for directories and 644 for files.
   */
  mode?: number;
  /**
   * An octal literal.
   * @default {0}
   */
  uid?: number;
  /**
   * An octal literal.
   * @default {0}
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

const SLASH_CODE_POINT = "/".charCodeAt(0);

/**
 * ### Overview
 * A TransformStream to create a tar archive.  Tar archives allow for storing
 * multiple files in a single file (called an archive, or sometimes a tarball).
 *   These archives typically have a single '.tar' extension.  This
 * implementation follows the [FreeBSD 15.0](https://man.freebsd.org/cgi/man.cgi?query=tar&sektion=5&apropos=0&manpath=FreeBSD+15.0-CURRENT) spec.
 *
 * ### File Format & Limitations
 * The ustar file format is used for creating the tar archive.  While this
 * format is compatible with most tar readers, the format has several
 * limitations, including:
 * - Paths must be at most 256 characters.
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
 * @example Usage
 * ```ts no-eval
 * import { TarStream, type TarStreamInput } from "@std/archive/tar-stream";
 *
 * await ReadableStream.from<TarStreamInput>([
 *   {
 *     path: 'potato/'
 *   },
 *   {
 *     path: 'deno.json',
 *     size: (await Deno.stat('deno.json')).size,
 *     readable: (await Deno.open('deno.json')).readable
 *   },
 *   {
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

export class TarStream implements TransformStream<TarStreamInput, Uint8Array> {
  #readable: ReadableStream<Uint8Array>;
  #writable: WritableStream<TarStreamInput>;
  constructor() {
    const { readable, writable } = new TransformStream<
      TarStreamInput,
      TarStreamInputInternal
    >({
      transform(chunk, controller) {
        if (chunk.options) {
          try {
            assertValidTarStreamOptions(chunk.options);
          } catch (e) {
            return controller.error(e);
          }
        }

        if (
          "size" in chunk &&
          (chunk.size < 0 || 8 ** 12 < chunk.size ||
            chunk.size.toString() === "NaN")
        ) {
          return controller.error(new RangeError("Size cannot exceed 64 Gibs"));
        }

        const path = parsePath(chunk.path);

        controller.enqueue({ ...chunk, path });
      },
    });
    this.#writable = writable;
    const gen = async function* () {
      const encoder = new TextEncoder();
      for await (const chunk of readable) {
        const [prefix, name] = chunk.path;
        const typeflag = "size" in chunk ? "0" : "5";
        const header = new Uint8Array(512);
        const size = "size" in chunk ? chunk.size : 0;
        const options: Required<TarStreamOptions> = {
          mode: typeflag === "5" ? 755 : 644,
          uid: 0,
          gid: 0,
          mtime: Math.floor(Date.now() / 1000),
          uname: "",
          gname: "",
          devmajor: "",
          devminor: "",
          ...chunk.options,
        };

        header.set(name); // name
        header.set(
          encoder.encode(
            options.mode.toString().padStart(6, "0") + " \0" + // mode
              options.uid.toString().padStart(6, "0") + " \0" + //uid
              options.gid.toString().padStart(6, "0") + " \0" + // gid
              size.toString(8).padStart(size < 8 ** 11 ? 11 : 12, "0") +
              (size < 8 ** 11 ? " " : "") + // size
              options.mtime.toString(8).padStart(11, "0") + " " + // mtime
              " ".repeat(8) + // checksum | To be updated later
              typeflag + // typeflag
              "\0".repeat(100) + // linkname
              "ustar\0" + // magic
              "00" + // version
              options.uname.padEnd(32, "\0") + // uname
              options.gname.padEnd(32, "\0") + // gname
              options.devmajor.padStart(8, "\0") + // devmajor
              options.devminor.padStart(8, "\0"), // devminor
          ),
          100,
        );
        header.set(prefix, 345); // prefix
        // Update Checksum
        header.set(
          encoder.encode(
            header.reduce((x, y) => x + y).toString(8).padStart(6, "0") + "\0",
          ),
          148,
        );
        yield header;

        if ("size" in chunk) {
          let size = 0;
          for await (const value of chunk.readable) {
            size += value.length;
            yield value;
          }
          if (chunk.size !== size) {
            throw new RangeError(
              "Provided size did not match bytes read from provided readable",
            );
          }
          if (chunk.size % 512) {
            yield new Uint8Array(512 - size % 512);
          }
        }
      }
      yield new Uint8Array(1024);
    }();
    this.#readable = new ReadableStream({
      type: "bytes",
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) {
          controller.close();
          return controller.byobRequest?.respond(0);
        }
        if (controller.byobRequest?.view) {
          const buffer = new Uint8Array(controller.byobRequest.view.buffer);

          const size = buffer.length;
          if (size < value.length) {
            buffer.set(value.slice(0, size));
            controller.byobRequest.respond(size);
            controller.enqueue(value.slice(size));
          } else {
            buffer.set(value);
            controller.byobRequest.respond(value.length);
          }
        } else {
          controller.enqueue(value);
        }
      },
    });
  }

  /**
   * The ReadableStream
   *
   * @return ReadableStream<Uint8Array>
   *
   * @example Usage
   * ```ts no-eval
   * import { TarStream } from "@std/archive/tar-stream";
   *
   * await ReadableStream.from([
   *   {
   *     path: 'potato/'
   *   },
   *   {
   *     path: 'deno.json',
   *     size: (await Deno.stat('deno.json')).size,
   *     iterable: (await Deno.open('deno.json')).readable
   *   },
   *   {
   *     path: '.vscode/settings.json',
   *     size: (await Deno.stat('.vscode/settings.json')).size,
   *     iterable: (await Deno.open('.vscode/settings.json')).readable
   *   }
   * ])
   *   .pipeThrough(new TarStream())
   *   .pipeThrough(new CompressionStream('gzip'))
   *   .pipeTo((await Deno.create('./out.tar.gz')).writable)
   * ```
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The WritableStream
   *
   * @return WritableStream<TarStreamInput>
   *
   * @example Usage
   * ```ts no-eval
   * import { TarStream } from "@std/archive/tar-stream";
   *
   * await ReadableStream.from([
   *   {
   *     path: 'potato/'
   *   },
   *   {
   *     path: 'deno.json',
   *     size: (await Deno.stat('deno.json')).size,
   *     iterable: (await Deno.open('deno.json')).readable
   *   },
   *   {
   *     path: '.vscode/settings.json',
   *     size: (await Deno.stat('.vscode/settings.json')).size,
   *     iterable: (await Deno.open('.vscode/settings.json')).readable
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

function parsePath(
  path: string,
): [Uint8Array, Uint8Array] {
  const name = new TextEncoder().encode(path);
  if (name.length <= 100) {
    return [new Uint8Array(0), name];
  }

  if (name.length > 256) {
    throw new RangeError("Path cannot exceed 256 bytes");
  }

  // If length of last part is > 100, then there's no possible answer to split the path
  let suitableSlashPos = Math.max(0, name.lastIndexOf(SLASH_CODE_POINT)); // always holds position of '/'
  if (name.length - suitableSlashPos > 100) {
    throw new RangeError("Filename cannot exceed 100 bytes");
  }

  for (
    let nextPos = suitableSlashPos;
    nextPos > 0;
    suitableSlashPos = nextPos
  ) {
    // disclaimer: '/' won't appear at pos 0, so nextPos always be > 0 or = -1
    nextPos = name.lastIndexOf(SLASH_CODE_POINT, suitableSlashPos - 1);
    // disclaimer: since name.length > 100 in this case, if nextPos = -1, name.length - nextPos will also > 100
    if (name.length - nextPos > 100) {
      break;
    }
  }

  const prefix = name.slice(0, suitableSlashPos);
  if (prefix.length > 155) {
    throw new TypeError(
      "Path needs to be split-able on a forward slash separator into [155, 100] bytes respectively",
    );
  }
  return [prefix, name.slice(suitableSlashPos + 1)];
}

/**
 * Asserts that the path provided is valid for a {@linkcode TarStream}.
 *
 * It provides a means to check that a path is valid before pipping it through
 * the `TarStream`, where if invalid will throw an error. Ruining any progress
 * made when archiving.
 *
 * @param path The path as a string
 *
 * @example Usage
 * ```ts no-assert
 * import { assertValidPath } from "@std/archive";
 *
 * assertValidPath('MyFile.txt');
 * ```
 */
export function assertValidPath(path: string) {
  parsePath(path);
}

/**
 * Asserts that the options provided are valid for a {@linkcode TarStream}.
 *
 * @param options The TarStreamOptions
 *
 * @example Usage
 * ```ts no-assert
 * import { assertValidTarStreamOptions } from "@std/archive";
 *
 * assertValidTarStreamOptions({ mode: 755 })
 * ```
 */
export function assertValidTarStreamOptions(options: TarStreamOptions) {
  if (
    options.mode &&
    (options.mode.toString().length > 6 ||
      !/^[0-7]*$/.test(options.mode.toString()))
  ) throw new TypeError("Invalid Mode Provided");
  if (
    options.uid &&
    (options.uid.toString().length > 6 ||
      !/^[0-7]*$/.test(options.uid.toString()))
  ) throw new TypeError("Invalid UID Provided");
  if (
    options.gid &&
    (options.gid.toString().length > 6 ||
      !/^[0-7]*$/.test(options.gid.toString()))
  ) throw new TypeError("Invalid GID Provided");
  if (
    options.mtime != undefined &&
    (options.mtime.toString(8).length > 11 ||
      options.mtime.toString() === "NaN")
  ) throw new TypeError("Invalid MTime Provided");
  if (
    options.uname &&
    // deno-lint-ignore no-control-regex
    (options.uname.length > 32 - 1 || !/^[\x00-\x7F]*$/.test(options.uname))
  ) throw new TypeError("Invalid UName Provided");
  if (
    options.gname &&
    // deno-lint-ignore no-control-regex
    (options.gname.length > 32 - 1 || !/^[\x00-\x7F]*$/.test(options.gname))
  ) throw new TypeError("Invalid GName Provided");
  if (
    options.devmajor &&
    (options.devmajor.length > 8)
  ) throw new TypeError("Invalid DevMajor Provided");
  if (
    options.devminor &&
    (options.devminor.length > 8)
  ) throw new TypeError("Invalid DevMinor Provided");
}
