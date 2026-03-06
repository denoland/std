// Copyright 2018-2026 the Deno authors. MIT license.

import { CappedDelimiterStream } from "@std/streams/unstable-capped-delimiter-stream";

/**
 * The output that is passed from a {@linkcode FormDataDecoderStream}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface FormDataEntry {
  /**
   * A string containing the key used for the form data entry.
   */
  name: string;
  /**
   * The value of the form data entry.
   */
  value: ReadableStream<Uint8Array>;
  /**
   * The content type of the form data entry.
   */
  contentType: string;
  /**
   * The filename of the form data entry if one was provided.
   */
  filename: string | undefined;
}

/**
 * ### Overview
 * {@linkcode FormDataDecoderStream} is a class based off the
 * [RFC 7578](https://datatracker.ietf.org/doc/html/rfc7578) spec and offers a
 * way to decode a {@linkcode FormData} in a streaming manner. Enabling one to
 * receive large amounts of information and start working with it, without
 * having it all locally in memory first.
 *
 * ### Limitations
 * Due to the nature of streaming implementations the next entry of this stream
 * won't be yielded until the `ReadableStream` value on the entry has been
 * either fully consumed or cancelled. To not handle it will result in a
 * hanging effect. Be aware that the client may send you a
 * `multipart/form-data` with entries in an undesirable order.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { FormDataDecoderStream } from "@std/http/unstable-formdata-decoder-stream";
 * const request = new Request("https://example.com", {
 *   method: "POST",
 *   body: function() {
 *     const formData = new FormData();
 *     formData.append("file", "Hello World");
 *     return formData;
 *   }(),
 * });
 *
 * for await (const entry of FormDataDecoderStream.from(request)) {
 *   assertEquals(entry.name, "file");
 *   assertEquals(await new Response(entry.value).text(), "Hello World");
 * }
 * ```
 */
export class FormDataDecoderStream {
  #readable: ReadableStream<FormDataEntry>;
  /**
   * Constructs a new instance.
   *
   * @param contentType The content type of the form data.
   * @param readable The readable stream of the form data.
   */
  constructor(contentType: string, readable: ReadableStream<Uint8Array>) {
    let boundary: string | Uint8Array | undefined = contentType
      .split(";")
      .find((x) => x.trimStart().startsWith("boundary="))
      ?.split("=")[1];
    if (boundary == undefined) {
      throw TypeError("Boundary not found in contentType");
    }
    if (boundary.startsWith('"')) boundary = boundary.slice(1, -1);
    boundary = "--" + boundary;
    // Only ASCII Characters are allowed within the boundary.
    // *Presumably* if the UTF-16 length of the boundary does not match that of
    // the characters encoded then the boundary contained non-ASCII characters.
    if (
      boundary.length !==
        new TextEncoder()
          .encodeInto(
            boundary,
            boundary = new Uint8Array(boundary.length),
          )
          .read
    ) throw new SyntaxError("Boundary has invalid characters within it");
    this.#readable = ReadableStream.from(this.#handle(readable, boundary));
  }

  async *#handle(
    readable: ReadableStream<Uint8Array>,
    boundary: Uint8Array,
  ): AsyncGenerator<FormDataEntry> {
    const decoder = new TextDecoder();
    const reader = readable.pipeThrough(
      new CappedDelimiterStream({
        delimiter: Uint8Array.from([13, 10]),
        limit: 1024 * 8 - 2,
      }),
    ).getReader();

    let buffer = (await reader.read()).value?.value;
    // Ignore Preamble
    while (buffer != undefined) {
      if (
        buffer.length >= boundary.length &&
        boundary.every((x, i) => x === buffer![i])
      ) break;
      buffer = (await reader.read()).value?.value;
    }

    let defaultContentType = "text/plain; charset=UTF-8";
    while (
      buffer != undefined && buffer[boundary.length] !== 45 &&
      buffer[boundary.length + 1] !== 45
    ) {
      buffer = (await reader.read()).value?.value;
      if (buffer == undefined) throw new SyntaxError("Unexpected EOF");
      if (!buffer.length) {
        throw new SyntaxError(
          "Missing Content-Disposition header within FormData segment",
        );
      }

      // Header
      let name: string | undefined;
      let filename: string | undefined;
      let contentType = defaultContentType;
      do {
        const header = decoder.decode(buffer);
        if (header.startsWith("Content-Disposition:")) {
          const x = header
            .slice(header.indexOf(":") + 1)
            .split(";")
            .map((x) => x.trim());
          if (x.findIndex((x) => x === "form-data") === -1) {
            throw new SyntaxError("Content-Disposition was not of form-data");
          }
          name = x
            .find((x) => x.startsWith("name="))
            ?.split("=")[1];
          if (name == undefined) {
            throw new SyntaxError("Content-Disposition missing name field");
          }
          if (name.startsWith('"')) name = name.slice(1, -1);

          filename = x
            .find((x) => x.startsWith("filename="))
            ?.split("=")[1];
          if (filename != undefined && filename.startsWith('"')) {
            filename = filename.slice(1, -1);
          }
        } else if (header.startsWith("Content-Type:")) {
          contentType = header.slice(header.indexOf(":") + 1).trim();
        } // else ignore header
        buffer = (await reader.read()).value?.value;
        if (buffer == undefined) throw new SyntaxError("Unexpected EOF");
      } while (buffer.length);
      if (name == undefined) {
        throw new SyntaxError(
          "Missing Content-Disposition header within FormData segment",
        );
      }

      // Body
      const { lock, releaseLock, error } = this.#createLock();
      let pMatch = false;
      const entry = {
        contentType,
        filename,
        name,
        value: new ReadableStream({
          type: "bytes",
          autoAllocateChunkSize: 1024 * 8,
          async pull(controller) {
            const length = controller.byobRequest!.view!.byteLength;
            const buf = new Uint8Array(
              controller.byobRequest!.view!.buffer,
              controller.byobRequest!.view!.byteOffset,
              length,
            );

            let written = 0;
            while (true) {
              const v = (await reader.read()).value;
              if (v == undefined) {
                error(new SyntaxError("Unexpected EOF"));
                return controller.error(new SyntaxError("Unexpected EOF"));
              }
              if (
                v.value.length >= boundary.length &&
                boundary.every((x, i) => x === v.value[i])
              ) {
                buffer = v.value;
                releaseLock();
                controller.close();
                return controller.byobRequest!.respond(0);
              }

              if (pMatch) {
                if (length - written === 1) {
                  buf[written] = 13;
                  controller.byobRequest!.respond(written + 1);
                  controller.enqueue(Uint8Array.from([10]));
                  return controller.enqueue(v.value);
                }
                buf.set([13, 10], written);
                written += 2;
              }

              if (v.value.length + written) {
                if (v.value.length > length - written) {
                  buf.set(v.value.subarray(0, length - written), written);
                  controller.byobRequest!.respond(length);
                  controller.enqueue(v.value.subarray(length - written));
                } else {
                  buf.set(v.value, written);
                  written += v.value.length;
                  controller.byobRequest!.respond(written);
                }
                pMatch = v.match;
                return;
              }
              // Only loops if body starts with \r\n
              pMatch = v.match;
            }
          },
          async cancel() {
            do {
              buffer = (await reader.read()).value?.value;
              if (buffer == undefined) {
                return error(new SyntaxError("Unexpected EOF"));
              }
            } while (!boundary.every((x, i) => x === buffer![i]));
            releaseLock();
          },
        }),
      };
      if (entry.name === "_charset_") {
        defaultContentType = await new Response(entry.value).text();
      } else yield entry;
      await lock;
    }
  }

  #createLock<T>(): {
    lock: Promise<void>;
    releaseLock: () => void;
    error: (x: T) => void;
  } {
    let releaseLock: () => void;
    let error: (x: T) => void;
    const lock = new Promise<void>((resolve, reject) => {
      releaseLock = () => resolve();
      error = (x: T) => reject(x);
    });
    return { lock, releaseLock: releaseLock!, error: error! };
  }

  /**
   * Creates a {@linkcode ReadableStream} from a {@linkcode Request} or
   * {@linkcode Response}.
   *
   * @param request The {@linkcode Request} or {@linkcode Response} to decode.
   * @returns A {@linkcode ReadableStream} containing the decoded form data
   * entries.
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { FormDataDecoderStream } from "@std/http/unstable-formdata-decoder-stream";
   * const request = new Request("https://example.com", {
   *   method: "POST",
   *   body: function() {
   *     const formData = new FormData();
   *     formData.append("file", "Hello World");
   *     return formData;
   *   }(),
   * });
   *
   * for await (const entry of FormDataDecoderStream.from(request)) {
   *   assertEquals(entry.name, "file");
   *   assertEquals(await new Response(entry.value).text(), "Hello World");
   * }
   * ```
   */
  static from(request: Request | Response): ReadableStream<FormDataEntry> {
    const contentType = request.headers.get("Content-Type");
    if (contentType == undefined) {
      throw new TypeError("Content-Type header is missing");
    }
    if (request.body == undefined) {
      throw new TypeError("Request body is missing");
    }
    return new FormDataDecoderStream(contentType, request.body).readable;
  }

  /**
   * The ReadableStream containing the decoded form data entries.
   *
   * @returns The {@linkcode ReadableStream} containing the decoded form data
   * entries.
   *
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import { FormDataDecoderStream } from "@std/http/unstable-formdata-decoder-stream";
   * const request = new Request("https://example.com", {
   *   method: "POST",
   *   body: function() {
   *     const formData = new FormData();
   *     formData.append("file", "Hello World");
   *     return formData;
   *   }(),
   * });
   * const contentType = request.headers.get("Content-Type");
   * assert(typeof contentType === "string");
   * const readable = request.body;
   * assert(readable != undefined);
   *
   * for await (
   *   const entry of new FormDataDecoderStream(contentType, readable).readable
   * ) {
   *   assertEquals(entry.name, "file");
   *   assertEquals(await new Response(entry.value).text(), "Hello World");
   * }
   * ```
   */
  get readable(): ReadableStream<FormDataEntry> {
    return this.#readable;
  }
}
