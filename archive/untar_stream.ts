// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { FixedChunkStream } from "@std/streams";

/**
 * The original tar	archive	header format.
 */
export interface OldStyleFormat {
  /**
   * The name of the entry.
   */
  name: string;
  /**
   * The mode of the entry.
   */
  mode: number;
  /**
   * The uid of the entry.
   */
  uid: number;
  /**
   * The gid of the entry.
   */
  gid: number;
  /**
   * The size of the entry.
   */
  size: number;
  /**
   * The mtime of the entry.
   */
  mtime: number;
  /**
   * The typeflag of the entry.
   */
  typeflag: string;
  /**
   * The linkname of the entry.
   */
  linkname: string;
}

/**
 * The POSIX ustar archive header format.
 */
export interface PosixUstarFormat {
  /**
   * The latter half of the name of the entry.
   */
  name: string;
  /**
   * The mode of the entry.
   */
  mode: string;
  /**
   * The uid of the entry.
   */
  uid: string;
  /**
   * The gid of the entry.
   */
  gid: string;
  /**
   * The size of the entry.
   */
  size: number;
  /**
   * The mtime of the entry.
   */
  mtime: number;
  /**
   * The typeflag of the entry.
   */
  typeflag: string;
  /**
   * The linkname of the entry.
   */
  linkname: string;
  /**
   * The magic number of the entry.
   */
  magic: string;
  /**
   * The version number of the entry.
   */
  version: string;
  /**
   * The uname of the entry.
   */
  uname: string;
  /**
   * The gname of the entry.
   */
  gname: string;
  /**
   * The devmajor of the entry.
   */
  devmajor: string;
  /**
   * The devminor of the entry.
   */
  devminor: string;
  /**
   * The former half of the name of the entry.
   */
  prefix: string;
}

/**
 * The header of an entry in the archive.
 */
export interface TarStreamHeader {
  /**
   * The type 'header' indicating the start of a new entry.
   */
  type: "header";
  /**
   * The pathname of the entry.
   */
  pathname: string;
  /**
   * The header of the entry.
   */
  header: OldStyleFormat | PosixUstarFormat;
}

/**
 * The data belonging to the last entry returned.
 */
export interface TarStreamData {
  /**
   * The type 'data' indicating a chunk of content from the last 'header'
   * resolved.
   */
  type: "data";
  /**
   * A chunk of content of from the entry.
   */
  data: Uint8Array;
}

/**
 * The type extracted from the archive.
 */
export type TarStreamChunk = TarStreamHeader | TarStreamData;

/**
 * ### Overview
 * A TransformStream to expand a tar archive.  Tar archives allow for storing
 * multiple files in a single file (called an archive, or sometimes a tarball).
 *   These archives typically have a single '.tar' extension.  This
 * implementation follows the [FreeBSD 15.0](https://man.freebsd.org/cgi/man.cgi?query=tar&sektion=5&apropos=0&manpath=FreeBSD+15.0-CURRENT) spec.
 *
 * ### Supported File Formats
 * Only the ustar file format is supported.  This is the most common format.
 *   Additionally the numeric extension for file size.
 *
 * ### Usage
 * When expanding the archive, as demonstrated in the example, one must decide
 * to either consume the Readable Stream, if present, or cancel it. The next
 * entry won't be resolved until the previous ReadableStream is either consumed
 * or cancelled.
 *
 * ### Understanding Compressed
 * A tar archive may be compressed, often identified by an additional file
 * extension, such as '.tar.gz' for gzip. This TransformStream does not support
 * decompression which must be done before expanding the archive.
 *
 * @example Usage
 * ```ts no-eval
 * import { UnTarStream } from "@std/archive/untar-stream";
 *
 * let fileWriter: WritableStreamDefaultWriter | undefined;
 * for await (
 *   const entry of (await Deno.open('./out.tar.gz'))
 *     .readable
 *     .pipeThrough(new DecompressionStream('gzip'))
 *     .pipeThrough(new UnTarStream())
 * ) {
 *   if (entry.type === "header") {
 *     fileWriter?.close();
 *     fileWriter = (await Deno.create(entry.pathname)).writable.getWriter();
 *   } else await fileWriter!.write(entry.data);
 * }
 * ```
 */
export class UnTarStream
  implements TransformStream<Uint8Array, TarStreamChunk> {
  #readable: ReadableStream<TarStreamChunk>;
  #writable: WritableStream<Uint8Array>;
  #gen: AsyncGenerator<Uint8Array>;
  constructor() {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    this.#readable = ReadableStream.from(this.#untar());
    this.#writable = writable;

    this.#gen = async function* () {
      const buffer: Uint8Array[] = [];
      for await (
        const chunk of readable.pipeThrough(new FixedChunkStream(512))
      ) {
        if (chunk.length !== 512) {
          throw new Error("Tarball has an unexpected number of bytes");
        }

        buffer.push(chunk);
        if (buffer.length > 2) yield buffer.shift()!;
      }
      if (buffer.length < 2) {
        throw new Error("Tarball was too small to be valid");
      }
      if (!buffer.every((value) => value.every((x) => x === 0))) {
        throw new Error("Tarball has invalid ending");
      }
    }();
  }

  async *#untar(): AsyncGenerator<TarStreamChunk> {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await this.#gen.next();
      if (done) break;

      // Validate Checksum
      const checksum = parseInt(
        decoder.decode(value.subarray(148, 156 - 2)),
        8,
      );
      value.fill(32, 148, 156);
      if (value.reduce((x, y) => x + y) !== checksum) {
        throw new SyntaxError("Tarball header failed to pass checksum");
      }

      // Decode Header
      let header: OldStyleFormat | PosixUstarFormat = {
        name: decoder.decode(value.subarray(0, 100)).split("\0")[0]!,
        mode: parseInt(decoder.decode(value.subarray(100, 108 - 2))),
        uid: parseInt(decoder.decode(value.subarray(108, 116 - 2))),
        gid: parseInt(decoder.decode(value.subarray(116, 124 - 2))),
        size: parseInt(decoder.decode(value.subarray(124, 136)).trimEnd(), 8),
        mtime: parseInt(decoder.decode(value.subarray(136, 148 - 1)), 8),
        typeflag: decoder.decode(value.subarray(156, 157)),
        linkname: decoder.decode(value.subarray(157, 257)).split("\0")[0]!,
      };
      if (header.typeflag === "\0") header.typeflag = "0";
      // "ustar\u000000"
      if (
        [117, 115, 116, 97, 114, 0, 48, 48].every((byte, i) =>
          value[i + 257] === byte
        )
      ) {
        header = {
          ...header,
          magic: decoder.decode(value.subarray(257, 263)),
          version: decoder.decode(value.subarray(263, 265)),
          uname: decoder.decode(value.subarray(265, 297)).split("\0")[0]!,
          gname: decoder.decode(value.subarray(297, 329)).split("\0")[0]!,
          devmajor: decoder.decode(value.subarray(329, 337)).replaceAll(
            "\0",
            "",
          ),
          devminor: decoder.decode(value.subarray(337, 345)).replaceAll(
            "\0",
            "",
          ),
          prefix: decoder.decode(value.subarray(345, 500)).split("\0")[0]!,
        };
      }

      yield {
        type: "header",
        pathname: ("prefix" in header && header.prefix.length
          ? header.prefix + "/"
          : "") + header.name,
        header,
      };
      if (!["1", "2", "3", "4", "5", "6"].includes(header.typeflag)) {
        for await (const data of this.#genFile(header.size)) {
          yield { type: "data", data };
        }
      }
    }
  }

  async *#genFile(size: number): AsyncGenerator<Uint8Array> {
    for (let i = Math.ceil(size / 512); i > 0; --i) {
      const { done, value } = await this.#gen.next();
      if (done) throw new Error("Unexpected end of Tarball");
      if (i === 1 && size % 512) yield value.subarray(0, size % 512);
      else yield value;
    }
  }

  /**
   * The ReadableStream
   *
   * @return ReadableStream<TarStreamChunk>
   *
   * @example Usage
   * ```ts no-eval
   * import { UnTarStream } from "@std/archive/untar-stream";
   *
   * let fileWriter: WritableStreamDefaultWriter | undefined;
   * for await (
   *   const entry of (await Deno.open('./out.tar.gz'))
   *     .readable
   *     .pipeThrough(new DecompressionStream('gzip'))
   *     .pipeThrough(new UnTarStream())
   * ) {
   *   if (entry.type === "header") {
   *     fileWriter?.close();
   *     fileWriter = (await Deno.create(entry.pathname)).writable.getWriter();
   *   } else await fileWriter!.write(entry.data);
   * }
   * ```
   */
  get readable(): ReadableStream<TarStreamChunk> {
    return this.#readable;
  }

  /**
   * The WritableStream
   *
   * @return WritableStream<Uint8Array>
   *
   * @example Usage
   * ```ts no-eval
   * import { UnTarStream } from "@std/archive/untar-stream";
   *
   * let fileWriter: WritableStreamDefaultWriter | undefined;
   * for await (
   *   const entry of (await Deno.open('./out.tar.gz'))
   *     .readable
   *     .pipeThrough(new DecompressionStream('gzip'))
   *     .pipeThrough(new UnTarStream())
   * ) {
   *   if (entry.type === "header") {
   *     fileWriter?.close();
   *     fileWriter = (await Deno.create(entry.pathname)).writable.getWriter();
   *   } else await fileWriter!.write(entry.data);
   * }
   * ```
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}
