// Copyright 2018-2025 the Deno authors. MIT license.

import { toByteStream } from "@std/streams/unstable-to-byte-stream";

export interface FormDataInput {
  name: string;
  value: string | Blob | ReadableStream<Uint8Array>;
  filename?: string;
  contentType?: string;
}

export class FormDataEncoderStream {
  #encoder = new TextEncoder();
  #readable: ReadableStream<Uint8Array>;
  #boundary: Uint8Array;
  #contentType: string;
  constructor(readable: ReadableStream<FormDataInput>) {
    const boundary = "--deno-std-" +
      crypto.getRandomValues(new Uint8Array(30)).toBase64() +
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
      this.#encoder.encode('" filename="'),
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

  toResponse(init?: ResponseInit): Response {
    init ??= {};
    init.headers = { ...init.headers, "Content-Type": this.#contentType };
    return new Response(this.#readable, init);
  }

  toRequest(input: RequestInfo | URL, init?: RequestInit): Request {
    init ??= {};
    init.headers = { ...init.headers, "Content-Type": this.#contentType };
    init.body = this.#readable;
    return new Request(input, init);
  }

  static from(readable: ReadableStream<FormDataInput>): FormDataEncoderStream {
    return new FormDataEncoderStream(readable);
  }

  get contentType(): string {
    return this.#contentType;
  }

  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }
}
