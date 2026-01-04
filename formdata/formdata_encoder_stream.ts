// Copyright 2018-2026 the Deno authors. MIT license.

import { encodeBase64 } from "@std/encoding/unstable-base64";
import { toByteStream } from "@std/streams/unstable-to-byte-stream";

/**
 * The input that can be passed to a {@linkcode FormDataEncoderStream}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface FormDataInput {
  /**
   * A string containing the key used for the form data entry. While all UTF-8
   * characters should work, it is encouraged to only use ascii. The value of
   * `name` should not generally be exposed to the user.
   */
  name: string;
  /**
   * The value of the form data entry.
   */
  value: string | Blob | ReadableStream<Uint8Array>;
  /**
   * The content type of the form data entry.
   * Defaults to:
   * - `text/plain` when a string is passed to `value`.
   * - `application/octet-stream` when a {@linkcode Blob} is passed to `value`
   * and the {@linkcode Blob} doesn't have its own type.
   * - `application/octet-stream` when a {@linkcode ReadableStream<Uint8Array>}
   * is passed to `value`.
   */
  contentType?: string;
  /**
   * The filename of the form data entry.
   */
  filename?: string;
}

/**
 * ### Overview
 * {@linkcode FormDataEncoderStream} is a class based off the
 * [RFC 7578](https://datatracker.ietf.org/doc/html/rfc7578) spec and offers a
 * way to create a {@linkcode FormData} in a streaming manner. Enabling one to
 * send large amounts of information without having it all locally in memory
 * first.
 *
 * ### Limitations
 * Due to the structure of the `multipart` media type and the constraints of a
 * streaming implementation, it is not possible to guarantee that a chosen
 * boundary string will never occur within the payload itself. As a result, the
 * appearance of a boundary sequence within the content must be considered a
 * valid and unavoidable edge case inherent to this API. Each instance of this
 * class will result in a different boundary being generated.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { FormDataEncoderStream } from "@std/formdata/formdata-encoder-stream";
 * const response = FormDataEncoderStream.from(ReadableStream.from([
 *   {
 *     name: "file",
 *     value: (await Deno.open("deno.json")).readable,
 *     contentType: "application/json",
 *   }
 * ]))
 *   .toResponse();
 *
 * const formData = await response.formData();
 * assertEquals(formData.get("file"), await Deno.readTextFile("deno.json"));
 * ```
 */
export class FormDataEncoderStream {
  #encoder = new TextEncoder();
  #readable: ReadableStream<Uint8Array>;
  #boundary: Uint8Array;
  #contentType: string;
  /**
   * Constructs a new instance.
   *
   * @param readable The readable stream of form data inputs.
   */
  constructor(readable: ReadableStream<FormDataInput>) {
    const boundary = "--deno-std-" +
      encodeBase64(crypto.getRandomValues(new Uint8Array(30))) +
      "\r\n";
    this.#encoder
      .encodeInto(boundary, this.#boundary = new Uint8Array(boundary.length));
    this.#contentType = 'multipart/form-data; boundary="' +
      boundary.slice(2, -2) + '"';

    const gen = this.#handle(readable);
    this.#readable = new ReadableStream({
      type: "bytes",
      autoAllocateChunkSize: 1024,
      async start() {
        await gen.next();
      },
      async pull(controller) {
        const length = controller.byobRequest!.view!.byteLength;
        const buffer = new Uint8Array(
          controller.byobRequest!.view!.buffer,
          controller.byobRequest!.view!.byteOffset,
          length,
        );

        try {
          const { done, value } = await gen.next(buffer);
          if (done) {
            controller.close();
            return controller.byobRequest!.respond(0);
          }

          // deno-lint-ignore no-explicit-any
          if ((buffer.buffer as any).detached) {
            controller.byobRequest!.respondWithNewView(value);
          } else if (buffer.buffer === value.buffer) {
            controller.byobRequest!.respond(value.length);
          } else {
            buffer.set(value.subarray(0, length));
            controller.byobRequest!.respond(length);
            controller.enqueue(value.subarray(length));
          }
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel(reason) {
        await gen.throw(reason).catch(() => undefined);
      },
    });
  }

  async *#handle(
    readable: ReadableStream<FormDataInput>,
  ): AsyncGenerator<Uint8Array, void, Uint8Array> {
    const fixed = [
      this.#encoder.encode('Content-Disposition: form-data; name="'),
      this.#encoder.encode('"; filename="'),
      this.#encoder.encode('"\r\nContent-Type: '),
      this.#encoder.encode('text/plain; charset="UTF-8"\r\n\r\n'),
      this.#encoder.encode("application/octet-stream\r\n\r\n"),
      this.#encoder.encode("\r\n\r\n"),
      this.#encoder.encode("\r\n"),
    ];
    let buffer = yield new Uint8Array();
    for await (const input of readable) {
      buffer = yield this.#setBuffer(buffer, this.#boundary);

      buffer = yield this.#setBuffer(buffer, fixed[0]!);
      buffer = yield this.#setString(buffer, input.name);
      if (input.filename != undefined) {
        buffer = yield this.#setBuffer(buffer, fixed[1]!);
        buffer = yield this.#setString(buffer, input.filename);
      }
      buffer = yield this.#setBuffer(buffer, fixed[2]!);

      if (input.contentType != undefined) {
        buffer = yield this.#setString(buffer, input.contentType);
        buffer = yield this.#setBuffer(buffer, fixed[5]!);
      } else if (typeof input.value === "string") {
        buffer = yield this.#setBuffer(buffer, fixed[3]!);
      } else if (input.value instanceof Blob && input.value.type.length) {
        buffer = yield this.#setString(buffer, input.value.type);
        buffer = yield this.#setBuffer(buffer, fixed[5]!);
      } else {
        buffer = yield this.#setBuffer(buffer, fixed[4]!);
      }

      if (typeof input.value === "string") {
        buffer = yield this.#setString(buffer, input.value);
      } else {
        if (input.value instanceof Blob) input.value = input.value.stream();
        const reader = toByteStream(input.value).getReader({ mode: "byob" });
        try {
          while (true) {
            const { done, value } = await reader
              .read(buffer, { min: buffer.length });
            buffer = yield value!;
            if (done) break;
          }
        } catch (reason) {
          await reader.cancel(reason);
          throw reason;
        }
      }
      buffer = yield this.#setBuffer(buffer, fixed[6]!);
    }
    this.#boundary.set([45, 45], this.#boundary.length - 2);
    yield this.#setBuffer(buffer, this.#boundary);
  }

  #setBuffer(buffer: Uint8Array, x: Uint8Array): Uint8Array {
    if (buffer.length < x.length) buffer = new Uint8Array(x.length);
    buffer.set(x);
    return buffer.subarray(0, x.length);
  }

  #setString(buffer: Uint8Array, x: string): Uint8Array {
    if (buffer.length < x.length * 3) buffer = new Uint8Array(x.length * 3);
    return buffer.subarray(0, this.#encoder.encodeInto(x, buffer).written);
  }

  /**
   * Convert the {@linkcode FormDataEncoderStream} to a {@linkcode Response} to send to a
   * client.
   *
   * @param init Optional response initialization options.
   * @returns The {@linkcode Response} containing the encoded form data.
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { FormDataEncoderStream } from "@std/formdata/formdata-encoder-stream";
   * const response = FormDataEncoderStream.from(ReadableStream.from([
   *   {
   *     name: "file",
   *     value: (await Deno.open("deno.json")).readable,
   *     contentType: "application/json",
   *   }
   * ]))
   *   .toResponse();
   *
   * const formData = await response.formData();
   * assertEquals(formData.get("file"), await Deno.readTextFile("deno.json"));
   * ```
   */
  toResponse(init?: ResponseInit): Response {
    init ??= {};
    init.headers = { ...init.headers, "Content-Type": this.#contentType };
    return new Response(this.#readable, init);
  }

  /**
   * Convert the {@linkcode FormDataEncoderStream} to a {@linkcode Request} to send to a server.
   *
   * @param input The URL or RequestInfo to send the request to.
   * @param init Optional request initialization options.
   * @returns The {@linkcode Request} containing the encoded form data.
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { FormDataEncoderStream } from "@std/formdata/formdata-encoder-stream";
   * const request = FormDataEncoderStream.from(ReadableStream.from([
   *   {
   *     name: "file",
   *     value: (await Deno.open("deno.json")).readable,
   *     contentType: "application/json",
   *   }
   * ]))
   *   .toRequest("https://example.com", { method: "POST" });
   *
   * const formData = await request.formData();
   * assertEquals(formData.get("file"), await Deno.readTextFile("deno.json"));
   * ```
   */
  toRequest(input: RequestInfo | URL, init?: RequestInit): Request {
    init ??= {};
    init.headers = { ...init.headers, "Content-Type": this.#contentType };
    init.body = this.#readable;
    return new Request(input, init);
  }

  /**
   * Create a {@linkcode FormDataEncoderStream} from a
   * {@linkcode ReadableStream}.
   *
   * @param readable The `ReadableStream` to encode.
   * @returns The {@linkcode FormDataEncoderStream} containing the encoded form
   * data.
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { FormDataEncoderStream } from "@std/formdata/formdata-encoder-stream";
   * const response = FormDataEncoderStream.from(ReadableStream.from([
   *   {
   *     name: "file",
   *     value: (await Deno.open("deno.json")).readable,
   *     contentType: "application/json",
   *   }
   * ]))
   *   .toResponse();
   *
   * const formData = await response.formData();
   * assertEquals(formData.get("file"), await Deno.readTextFile("deno.json"));
   * ```
   */
  static from(readable: ReadableStream<FormDataInput>): FormDataEncoderStream {
    return new FormDataEncoderStream(readable);
  }

  /**
   * The content type of the `ReadableStream`. Contains the boundary
   * required for decoding.
   *
   * @returns The content type of the `ReadableStream`.
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { FormDataEncoderStream } from "@std/formdata/formdata-encoder-stream";
   * const encoder = FormDataEncoderStream.from(ReadableStream.from([
   *   {
   *     name: "file",
   *     value: (await Deno.open("deno.json")).readable,
   *     contentType: "application/json",
   *   }
   * ]));
   *
   * const response = new Response(encoder.readable, {
   *   headers: { "Content-Type": encoder.contentType },
   * });
   *
   * const formData = await response.formData();
   * assertEquals(formData.get("file"), await Deno.readTextFile("deno.json"));
   * ```
   */
  get contentType(): string {
    return this.#contentType;
  }

  /**
   * The ReadableStream containing the encoded content.
   *
   * @returns The `ReadableStream` containing the encoded form data.
   *
   * @example Usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { FormDataEncoderStream } from "@std/formdata/formdata-encoder-stream";
   * const encoder = FormDataEncoderStream.from(ReadableStream.from([
   *   {
   *     name: "file",
   *     value: (await Deno.open("deno.json")).readable,
   *     contentType: "application/json",
   *   }
   * ]));
   *
   * const response = new Response(encoder.readable, {
   *   headers: { "Content-Type": encoder.contentType },
   * });
   *
   * const formData = await response.formData();
   * assertEquals(formData.get("file"), await Deno.readTextFile("deno.json"));
   * ```
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }
}
