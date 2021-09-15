// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/stream_base-inl.h
// - https://github.com/nodejs/node/blob/master/src/stream_base.h
// - https://github.com/nodejs/node/blob/master/src/stream_base.cc
// - https://github.com/nodejs/node/blob/master/src/stream_wrap.h
// - https://github.com/nodejs/node/blob/master/src/stream_wrap.cc

import { notImplemented } from "../_utils.ts";
import { HandleWrap } from "./handle_wrap.ts";
import { AsyncWrap, providerType } from "./async_wrap.ts";
import { UV_EOF, UV_UNKNOWN } from "./uv.ts";
import { writeAll } from "../../io/util.ts";

enum StreamBaseStateFields {
  kReadBytesOrError,
  kArrayBufferOffset,
  kBytesWritten,
  kLastWriteWasAsync,
  kNumStreamBaseStateFields,
}

export const kReadBytesOrError = StreamBaseStateFields.kReadBytesOrError;
export const kArrayBufferOffset = StreamBaseStateFields.kArrayBufferOffset;
export const kBytesWritten = StreamBaseStateFields.kBytesWritten;
export const kLastWriteWasAsync = StreamBaseStateFields.kLastWriteWasAsync;
export const kNumStreamBaseStateFields =
  StreamBaseStateFields.kNumStreamBaseStateFields;

export const streamBaseState = new Uint8Array(5);

export class StreamReq extends AsyncWrap {
  done(_status: number, _errorStr: string) {}
  ondone(_status: number) {}
  dispose() {}
}

export class WriteWrap<H extends HandleWrap> extends StreamReq {
  handle!: H;
  oncomplete!: (status: number) => void;
  async!: boolean;
  bytes!: number;
  buffer!: unknown;
  callback!: unknown;
  _chunks!: unknown[];

  constructor() {
    super(providerType.WRITEWRAP);
  }
}

export class ShutdownWrap<H extends HandleWrap> extends StreamReq {
  handle!: H;
  oncomplete!: (status: number) => void;
  callback!: () => void;

  constructor() {
    super(providerType.SHUTDOWNWRAP);
  }
}

const SUGGESTED_SIZE = 64 * 1024;
export const kStreamBaseField = Symbol("kStreamBaseField");

export class LibuvStreamWrap extends HandleWrap {
  [kStreamBaseField]?: Deno.Reader & Deno.Writer & Deno.Closer;
  [kArrayBufferOffset] = 0;

  reading!: boolean;
  destroyed = false;
  writeQueueSize = 0;
  bytesRead = 0;
  bytesWritten = 0;

  // deno-lint-ignore no-explicit-any
  onread!: (_arrayBuffer: any) => Uint8Array | undefined;

  constructor(
    provider: providerType,
    object?: Deno.Reader & Deno.Writer & Deno.Closer,
  ) {
    super(provider);
    this.#attachToObject(object);
  }

  #attachToObject(object?: Deno.Reader & Deno.Writer & Deno.Closer) {
    this[kStreamBaseField] = object;
  }

  async #read() {
    if (!this.reading) {
      return;
    }

    const buf = new Uint8Array(SUGGESTED_SIZE);

    let nread: number | null;
    try {
      nread = await this[kStreamBaseField]!.read(buf);
    } catch {
      // TODO(cmorten): map err to status codes
      streamBaseState[kReadBytesOrError] = UV_UNKNOWN;
      this.onread!(buf);

      return;
    }

    nread ??= UV_EOF;

    if (nread > 0) {
      // TODO(cmorten): resize the buffer based on nread
      this[kArrayBufferOffset] += nread;
      streamBaseState[kArrayBufferOffset] = this.bytesRead =
        this[kArrayBufferOffset];
    }

    streamBaseState[kReadBytesOrError] = nread;
    this.onread!(buf);

    if (nread > 0) {
      this.#read();
    }
  }

  readStart(): number {
    this.reading = true;
    this.#read();

    return 0;
  }

  readStop(): number {
    this.reading = false;

    return 0;
  }

  shutdown(req: ShutdownWrap<LibuvStreamWrap>): number {
    // TODO(cmorten): check this
    req.dispose();
    req.done(0, "");
    req.oncomplete(0);

    return 0;
  }

  useUserBuffer(_userBuf: unknown) {
    notImplemented();
  }

  writev(
    _req: WriteWrap<LibuvStreamWrap>,
    // deno-lint-ignore no-explicit-any
    _chunks: any,
    // deno-lint-ignore no-explicit-any
    _allBuffers: any,
  ): number {
    // TODO(cmorten)
    return 0;
  }

  async #write(req: WriteWrap<LibuvStreamWrap>, data: Uint8Array) {
    const { byteLength } = data;

    try {
      // TODO(cmorten): somewhat over simplifying what Node appears to be doing,
      // but perhaps fine for now?
      await writeAll(this[kStreamBaseField]!, data);
    } catch {
      // TODO(cmorten): map err to status codes
      return req.oncomplete(UV_UNKNOWN);
    }

    streamBaseState[kBytesWritten] = byteLength;
    this.bytesWritten += byteLength;

    return req.oncomplete(0);
  }

  writeBuffer(req: WriteWrap<LibuvStreamWrap>, data: Uint8Array): number {
    // TODO(cmorten)
    this.#write(req, data);
    streamBaseState[kLastWriteWasAsync] = 1;

    return 0;
  }

  writeAsciiString(): number {
    // TODO(cmorten)
    notImplemented();
  }

  writeUtf8String(): number {
    // TODO(cmorten)
    notImplemented();
  }

  writeUcs2String(): number {
    // TODO(cmorten)
    notImplemented();
  }

  writeLatin1String(): number {
    // TODO(cmorten)
    notImplemented();
  }
}
