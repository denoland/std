// Copyright 2018-2025 the Deno authors. MIT license.

import { CappedDelimiterStream } from "@std/streams/unstable-capped-delimiter-stream";

export interface FormDataEntry {
  name: string;
  value: ReadableStream<Uint8Array>;
  contentType: string;
  filename: string | undefined;
}

export class FormDataDecoderStream {
  #readable: ReadableStream<FormDataEntry>;
  constructor(contentType: string, readable: ReadableStream<Uint8Array>) {
    let boundary: string | Uint8Array | undefined = contentType
      .split(";")
      .find((x) => x.trimStart().startsWith("boundary="))
      ?.split("=")[1];
    if (boundary == undefined) throw Error("Boundary not found in contentType");
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
    ) throw new Error("Boundary has invalid characters within it");
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
      if (buffer == undefined) throw new Error("Unexpected EOF");
      if (!buffer.length) {
        throw new Error(
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
            throw new Error("Content-Disposition was not of form-data");
          }
          name = x
            .find((x) => x.startsWith("name="))
            ?.split("=")[1];
          if (name == undefined) {
            throw new Error("Content-Disposition missing name field");
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
        if (buffer == undefined) throw new Error("Unexpected EOF");
      } while (buffer.length);
      if (name == undefined) {
        throw new Error(
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
                error(new Error("Unexpected EOF"));
                return controller.error(new Error("Unexpected EOF"));
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
                return error(new Error("Unexpected EOF"));
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

  static from(request: Request | Response): ReadableStream<FormDataEntry> {
    const contentType = request.headers.get("Content-Type");
    if (contentType == undefined) {
      throw new Error("Content-Type header is missing");
    }
    if (request.body == undefined) throw new Error("Request body is missing");
    return new FormDataDecoderStream(contentType, request.body).readable;
  }

  get readable(): ReadableStream<FormDataEntry> {
    return this.#readable;
  }
}
