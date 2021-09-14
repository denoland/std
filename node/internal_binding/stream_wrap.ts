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

export const streamBaseState = new Int8Array();

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

export class LibuvStreamWrap extends HandleWrap {
  writeQueueSize = 0;
  bytesRead = 0;
  bytesWritten = 0;

  constructor(provider: providerType) {
    super(provider);
  }

  readStart(): number {
    notImplemented();
  }

  readStop(): number {
    notImplemented();
  }

  useUserBuffer(_userBuf: unknown) {
    notImplemented();
  }

  shutdown(_req: ShutdownWrap<LibuvStreamWrap>): number {
    notImplemented();
  }

  onread(_a: unknown, _b: unknown): Uint8Array | undefined {
    notImplemented();
  }

  writev(
    _req: WriteWrap<LibuvStreamWrap>,
    // deno-lint-ignore no-explicit-any
    _chunks: any,
    // deno-lint-ignore no-explicit-any
    _allBuffers: any,
  ): number {
    notImplemented();
  }
}
