// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * The interface required to provide a file.
 */
export interface TarStreamFile {
  pathname: string | [Uint8Array, Uint8Array];
  size: number;
  sizeExtension?: boolean;
  iterable: Iterable<Uint8Array> | AsyncIterable<Uint8Array>;
  options?: Partial<TarStreamOptions>;
}

/**
 * The interface required to provide a directory.
 */
export interface TarStreamDir {
  pathname: string | [Uint8Array, Uint8Array];
  options?: Partial<TarStreamOptions>;
}

/**
 * The options that can go along with a file or directory.
 * @param mode An octal number in ASCII.
 * @param uid An octal number in ASCII.
 * @param gid An octal number in ASCII.
 * @param mtime A number of seconds since the start of epoch. Avoid negative
 * values.
 * @param uname An ASCII string. Should be used in preference of uid.
 * @param gname An ASCII string. Should be used in preference of gid.
 * @param devmajor The major number for character device.
 * @param devminor The minor number for block device entry.
 */
export interface TarStreamOptions {
  mode: string;
  uid: string;
  gid: string;
  mtime: number;
  uname: string;
  gname: string;
  devmajor: string;
  devminor: string;
}

/**
 * ### Overview
 * A TransformStream to create a tar archive.  Tar archives allow for storing
 * multiple files in a single file (called an archive, or sometimes a tarball).
 *   These archives typically have a singe '.tar' extension.
 *
 * ### File Format & Limitations
 * The ustar file format is used for creating the tar archive.  While this
 * format is compatible with most tar readers, the format has several
 * limitations, including:
 * - Pathnames must be at most 256 characters.
 * - Files must be at most 8 GiBs in size, or 64 GiBs if `sizeExtension` is set
 * to true.
 * - Sparse files are not supported.
 *
 * ### Usage
 * TarStream may throw an error for several reasons. A few of those are:
 * - The pathname is invalid.
 * - The size provided does not match that of the iterable's length.
 *
 * ### Compression
 * Tar archives are not compressed by default.  If you'd like to compress the
 * archive, you may do so by piping it through a compression stream.
 *
 * @example
 * ```ts
 * import { TarStream } from 'https://deno.land/std@$STD_VERSION/archive/tar_stream.ts'
 *
 * await ReadableStream.from([
 *   {
 *     pathname: 'potato/'
 *   },
 *   {
 *     pathname: 'deno.json',
 *     size: (await Deno.stat('deno.json')).size,
 *     iterable: (await Deno.open('deno.json')).readable
 *   },
 *   {
 *     pathname: 'deno.lock',
 *     size: (await Deno.stat('deno.lock')).size,
 *     iterable: (await Deno.open('deno.lock')).readable
 *   }
 * ])
 *   .pipeThrough(new TarStream())
 *   .pipeThrough(new CompressionStream('gzip'))
 *   .pipeTo((await Deno.create('./out.tar.gz')).writable)
 * ```
 */
export class TarStream {
  #readable: ReadableStream<Uint8Array>;
  #writable: WritableStream<TarStreamFile | TarStreamDir>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      TarStreamFile | TarStreamDir,
      TarStreamFile | TarStreamDir
    >();
    const gen = (async function* () {
      const paths: string[] = [];
      for await (const chunk of readable) {
        if (
          "size" in chunk &&
          (
            chunk.size < 0 ||
            Math.pow(8, chunk.sizeExtension ? 12 : 11) < chunk.size ||
            chunk.size.toString() === "NaN"
          )
        ) {
          throw new Error(
            "Invalid Size Provided! Size cannot exceed 8 GiBs by default or 64 GiBs with sizeExtension set to true.",
          );
        }

        const [prefix, name] = typeof chunk.pathname === "string"
          ? parsePathname(chunk.pathname, !("size" in chunk))
          : function () {
            if ("size" in chunk === (chunk.pathname[1].slice(-1)[0] === 47)) {
              throw new Error(
                `Pre-parsed pathname for ${
                  "size" in chunk ? "directory" : "file"
                } is not suffixed correctly. Directories should end in a forward slash, while files shouldn't.`,
              );
            }
            return chunk.pathname;
          }();
        {
          const decoder = new TextDecoder();
          const pathname = prefix.length
            ? decoder.decode(prefix) + "/" + decoder.decode(name)
            : decoder.decode(name);
          if (paths.includes(pathname)) {
            continue;
          }
          paths.push(pathname);
        }
        const typeflag = "size" in chunk ? "0" : "5";
        const sizeExtension = "size" in chunk && chunk.sizeExtension || false;
        const encoder = new TextEncoder();
        const header = new Uint8Array(512);

        header.set(name); // name
        header.set(
          encoder.encode(
            (chunk.options?.mode ?? (typeflag === "5" ? "755" : "644"))
              .padStart(6, "0") +
              " \0" + // mode
              (chunk.options?.uid ?? "").padStart(6, "0") + " \0" + // uid
              (chunk.options?.gid ?? "").padStart(6, "0") + " \0" + // gid
              ("size" in chunk ? chunk.size.toString(8) : "").padStart(
                sizeExtension ? 12 : 11,
                "0",
              ) + (sizeExtension ? "" : " ") + // size
              (chunk.options?.mtime?.toString(8) ??
                Math.floor(new Date().getTime() / 1000).toString(8)).padStart(
                  11,
                  "0",
                ) +
              " " + // mtime
              " ".repeat(8) + // checksum | Needs to be updated
              typeflag + // typeflag
              "\0".repeat(100) + // linkname
              "ustar\0" + // magic
              "00" + // version
              (chunk.options?.uname ?? "").padEnd(32, "\0") + // uname
              (chunk.options?.gname ?? "").padEnd(32, "\0") + // gname
              (chunk.options?.devmajor ?? "").padEnd(8, "\0") + // devmajor
              (chunk.options?.devminor ?? "").padEnd(8, "\0"), // devminor
          ),
          100,
        );
        header.set(prefix, 345); // prefix

        header.set(
          encoder.encode(
            header.reduce((x, y) => x + y).toString(8).padStart(6, "0") + "\0",
          ),
          148,
        ); // update checksum
        yield header;

        if ("size" in chunk) {
          let size = 0;
          for await (const x of chunk.iterable) {
            size += x.length;
            yield x;
          }
          if (chunk.size !== size) {
            throw new Error(
              "Invalid Tarball! Provided size did not match bytes read from iterable.",
            );
          }
          if (chunk.size % 512) {
            yield new Uint8Array(new Array(512 - chunk.size % 512).fill(0));
          }
        }
      }
      yield new Uint8Array(new Array(1024).fill(0));
    })();

    this.#readable = new ReadableStream({
      type: "bytes",
      async pull(controller) {
        // If Byte Stream
        if (controller.byobRequest?.view) {
          const buffer = new Uint8Array(
            controller.byobRequest.view.buffer,
            controller.byobRequest.view.byteOffset, // Will this ever be anything but zero?
            controller.byobRequest.view.byteLength,
          );
          let offset = 0;
          while (offset < buffer.length) {
            const { done, value } = await gen.next();
            if (done) {
              if (offset) {
                controller.byobRequest.respond(offset);
                return controller.close();
              }
              controller.close();
              return controller.byobRequest.respond(0);
            }
            if (value.length > buffer.length - offset) {
              buffer.set(value.slice(0, buffer.length - offset), offset);
              offset = buffer.length - offset;
              controller.byobRequest.respond(buffer.length);
              return controller.enqueue(value.slice(offset));
            }
            buffer.set(value, offset);
            offset += value.length;
          }
          return controller.byobRequest.respond(buffer.length);
        }
        // Else Default Stream
        const { done, value } = await gen.next();
        if (done) {
          return controller.close();
        }
        controller.enqueue(value);
      },
    });
    this.#writable = writable;
  }

  /**
   * The ReadableStream
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The WritableStream
   */
  get writable(): WritableStream<TarStreamFile | TarStreamDir> {
    return this.#writable;
  }
}

/**
 * parsePathname is a function that validates the correctness of the pathname
 * being provided.
 * Function will throw if invalid pathname is provided.
 * The result can be provided instead of the string version to TarStream,
 * or can just be used to check in advance of creating the Tar archive.
 */
export function parsePathname(
  pathname: string,
  isDirectory = false,
): [Uint8Array, Uint8Array] {
  pathname = pathname.split("/").filter((x) => x).join("/");
  if (pathname.startsWith("./")) {
    pathname = pathname.slice(2);
  }
  if (isDirectory) {
    pathname += "/";
  }

  const name = new TextEncoder().encode(pathname);
  if (name.length <= 100) {
    return [new Uint8Array(0), name];
  }

  if (name.length > 256) {
    throw new Error("Invalid Pathname! Pathname cannot exceed 256 bytes.");
  }

  let i = Math.max(0, name.lastIndexOf(47));
  if (pathname.slice(i + 1).length > 100) {
    throw new Error("Invalid Filename! Filename cannot exceed 100 bytes.");
  }

  for (; i > 0; --i) {
    i = name.lastIndexOf(47, i) + 1;
    if (name.slice(i + 1).length > 100) {
      i = Math.max(0, name.indexOf(47, i + 1));
      break;
    }
  }

  const prefix = name.slice(0, i);
  if (prefix.length > 155) {
    throw new Error(
      "Invalid Pathname! Pathname needs to be split-able on a forward slash separator into [155, 100] bytes respectively.",
    );
  }
  return [prefix, name.slice(i + 1)];
}
