/**
 * The type extracted from the archive.
 */
export type TarEntry = {
  pathname: string;
  header: TarHeader;
  readable?: ReadableStream<Uint8Array>;
};

/**
 * The header of an entry in the archive.
 */
export type TarHeader = {
  name: string;
  mode: string;
  uid: string;
  gid: string;
  size: number;
  mtime: number;
  checksum: string;
  typeflag: string;
  linkname: string;
  pad: Uint8Array;
} | {
  name: string;
  mode: string;
  uid: string;
  gid: string;
  size: number;
  mtime: number;
  checksum: string;
  typeflag: string;
  linkname: string;
  magic: string;
  version: string;
  uname: string;
  gname: string;
  devmajor: string;
  devminor: string;
  prefix: string;
  pad: Uint8Array;
};

/**
 * ### Overview
 * A TransformStream to expand a tar archive.  Tar archives allow for storing
 * multiple files in a single file (called an archive, or sometimes a tarball).
 *   These archives typically have a single '.tar' extension.
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
 * @example
 * ```ts
 * import { UnTarStream } from 'https://deno.land/std@$STD_VERSION/archive/untar_stream.ts'
 *
 * for await (
 *   const entry of (await Deno.open('./out.tar'))
 *     .readable
 *     .pipeThrough(new UnTarStream())
 * ) {
 *   console.log(entry.pathname)
 *   await entry
 *     .readable
 *     ?.pipeTo((await Deno.create(entry.pathname)).writable)
 * }
 * ```
 *
 * ### Understanding Compressed
 * A tar archive may be compressed, often identified by an additional file
 * extension, such as '.tar.gz' for gzip. This TransformStream does not support
 * decompression which must be done before expanding the archive.
 *
 * @example
 * ```ts
 * import { UnTarStream } from 'https://deno.land/std@$STD_VERSION/archive/untar_stream.ts'
 *
 * for await (
 *   const entry of (await Deno.open('./out.tar.gz'))
 *     .readable
 *     .pipeThrough(new DecompressionStream('gzip'))
 *     .pipeThrough(new UnTarStream())
 * ) {
 *   console.log(entry.pathname)
 *   entry
 *     .readable
 *     ?.pipeTo((await Deno.create(entry.pathname)).writable)
 * }
 * ```
 */
export class UnTarStream {
  #readable: ReadableStream<TarEntry>;
  #writable: WritableStream<Uint8Array>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    const reader = readable
      .pipeThrough(
        new TransformStream(
          { // Slices ReadableStream's Uint8Array into 512 byte chunks.
            x: new Uint8Array(0),
            transform(chunk, controller) {
              const y = new Uint8Array(this.x.length + chunk.length);
              y.set(this.x);
              y.set(chunk, this.x.length);

              for (let i = 512; i <= y.length; i += 512) {
                controller.enqueue(y.slice(i - 512, i));
              }
              this.x = y.length % 512
                ? y.slice(-y.length % 512)
                : new Uint8Array(0);
            },
            flush(controller) {
              if (this.x.length) {
                controller.error(
                  "Tarball has an unexpected number of bytes.!!",
                );
              }
            },
          } as Transformer<Uint8Array, Uint8Array> & { x: Uint8Array },
        ),
      )
      .pipeThrough(
        new TransformStream(
          { // Trims the last Uint8Array chunks off.
            x: [],
            transform(chunk, controller) {
              this.x.push(chunk);
              if (this.x.length === 3) {
                controller.enqueue(this.x.shift()!);
              }
            },
            flush(controller) {
              if (this.x.length < 2) {
                controller.error("Tarball was too small to be valid.");
              } else if (!this.x.every((x) => x.every((x) => x === 0))) {
                controller.error("Tarball has invalid ending.");
              }
            },
          } as Transformer<Uint8Array, Uint8Array> & { x: Uint8Array[] },
        ),
      )
      .getReader();
    let header: TarHeader | undefined;
    this.#readable = new ReadableStream<TarEntry>(
      {
        cancelled: false,
        async pull(controller) {
          while (header != undefined) {
            await new Promise((a) => setTimeout(a, 0));
          }

          const { done, value } = await reader.read();
          if (done) {
            return controller.close();
          }

          const decoder = new TextDecoder();
          { // Validate checksum
            const checksum = value.slice();
            checksum.set(new Uint8Array(8).fill(32), 148);
            if (
              checksum.reduce((x, y) => x + y) !==
                parseInt(decoder.decode(value.slice(148, 156 - 2)), 8)
            ) {
              return controller.error(
                "Invalid Tarball. Header failed to pass checksum.",
              );
            }
          }
          header = {
            name: decoder.decode(value.slice(0, 100)).replaceAll("\0", ""),
            mode: decoder.decode(value.slice(100, 108 - 2)),
            uid: decoder.decode(value.slice(108, 116 - 2)),
            gid: decoder.decode(value.slice(116, 124 - 2)),
            size: parseInt(decoder.decode(value.slice(124, 136)).trimEnd(), 8),
            mtime: parseInt(decoder.decode(value.slice(136, 148 - 1)), 8),
            checksum: decoder.decode(value.slice(148, 156 - 2)),
            typeflag: decoder.decode(value.slice(156, 157)),
            linkname: decoder.decode(value.slice(157, 257)).replaceAll(
              "\0",
              "",
            ),
            pad: value.slice(257),
          };
          if (header.typeflag === "\0") {
            header.typeflag = "0";
          }
          // Check if header is POSIX ustar | new TextEncoder().encode('ustar\0' + '00')
          if (
            [117, 115, 116, 97, 114, 0, 48, 48].every((byte, i) =>
              value[i + 257] === byte
            )
          ) {
            header = {
              ...header,
              magic: decoder.decode(value.slice(257, 263)),
              version: decoder.decode(value.slice(263, 265)),
              uname: decoder.decode(value.slice(265, 297)).replaceAll("\0", ""),
              gname: decoder.decode(value.slice(297, 329)).replaceAll("\0", ""),
              devmajor: decoder.decode(value.slice(329, 337)).replaceAll(
                "\0",
                "",
              ),
              devminor: decoder.decode(value.slice(337, 345)).replaceAll(
                "\0",
                "",
              ),
              prefix: decoder.decode(value.slice(345, 500)).replaceAll(
                "\0",
                "",
              ),
              pad: value.slice(500),
            };
          }

          if (header.typeflag === "0") {
            const size = header.size;
            let i = Math.ceil(size / 512);
            const isCancelled = () => this.cancelled;
            let lock = false;
            controller.enqueue({
              pathname: ("prefix" in header && header.prefix.length
                ? header.prefix + "/"
                : "") + header.name,
              header,
              readable: new ReadableStream<Uint8Array>({
                async pull(controller) {
                  if (i > 0) {
                    lock = true;
                    const { done, value } = await reader.read();
                    if (done) {
                      header = undefined;
                      controller.error("Tarball ended unexpectedly.");
                    } else {
                      // Pull is unlocked before enqueue is called because if pull is in the middle of processing a chunk when cancel is called, nothing after enqueue will run.
                      lock = false;
                      controller.enqueue(
                        i-- === 1 ? value.slice(0, size % 512) : value,
                      );
                    }
                  } else {
                    header = undefined;
                    if (isCancelled()) {
                      reader.cancel();
                    }
                    controller.close();
                  }
                },
                async cancel() {
                  while (lock) {
                    await new Promise((a) =>
                      setTimeout(a, 0)
                    );
                  }
                  try {
                    while (i-- > 0) {
                      if ((await reader.read()).done) {
                        throw new Error("Tarball ended unexpectedly.");
                      }
                    }
                  } catch (error) {
                    throw error;
                  } finally {
                    header = undefined;
                  }
                },
              }),
            });
          } else {
            controller.enqueue({
              pathname: ("prefix" in header && header.prefix.length
                ? header.prefix + "/"
                : "") + header.name,
              header,
            });
            header = undefined;
          }
        },
        cancel() {
          this.cancelled = true;
        },
      } as UnderlyingSource<TarEntry> & { cancelled: boolean },
    );
    this.#writable = writable;
  }

  /**
   * The ReadableStream
   */
  get readable(): ReadableStream<TarEntry> {
    return this.#readable;
  }

  /**
   * The WritableStream
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}
