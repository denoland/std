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

// This module implements:
// - https://github.com/nodejs/node/blob/master/src/pipe_wrap.h
// - https://github.com/nodejs/node/blob/master/src/pipe_wrap.cc

import { notImplemented } from "../_utils.ts";
import { unreachable } from "../../testing/asserts.ts";
import { ConnectionWrap } from "./connection_wrap.ts";

export enum socketType {
  SOCKET,
  SERVER,
  IPC,
}

enum providerType {
  PipeSocketWrap = "PipeSocketWrap",
  PipeServerWrap = "PipeServerWrap",
}

// Extends:
// - ConnectionWrap
// - LibuvStreamWrap
// - HandleWrap
// - StreamBase
// - ShutdownWrap
// - WriteWrap
export class Pipe extends ConnectionWrap {
  reading = false;
  ipc: boolean;

  constructor(type: number) {
    let provider: providerType;
    let ipc: boolean;

    switch (type) {
      case socketType.SOCKET: {
        provider = providerType.PipeSocketWrap;
        ipc = false;

        break;
      }
      case socketType.SERVER: {
        provider = providerType.PipeServerWrap;
        ipc = false;

        break;
      }
      case socketType.IPC: {
        provider = providerType.PipeSocketWrap;
        ipc = true;

        break;
      }
      default: {
        unreachable();
      }
    }

    super(provider);
    this.ipc = ipc;
  }

  bind() {
    notImplemented();
  }

  listen() {
    notImplemented();
  }

  connect(
    _req: PipeConnectWrap,
    _address: string,
    _afterConnect: (
      status: number,
      handle: Pipe,
      req: PipeConnectWrap,
      readable: boolean,
      writable: boolean,
    ) => void,
  ) {
    notImplemented();
  }

  open(_fd: number): number {
    // REF: https://github.com/denoland/deno/issues/6529
    notImplemented();
  }

  // Windows only
  setPendingInstances(_instances: number) {
    notImplemented();
  }

  fchmod() {
    notImplemented();
  }

  getFD() {
    notImplemented();
  }

  isAlive() {
    notImplemented();
  }

  isClosing() {
    notImplemented();
  }

  isIPCPipe() {
    return this.ipc;
  }

  readStart() {
    notImplemented();
  }

  readStop() {
    notImplemented();
  }

  doShutdown() {
    notImplemented();
  }

  doTryWrite() {
    notImplemented();
  }

  doWrite() {
    notImplemented();
  }

  writeQueueSize = 0;

  setBlocking() {
    notImplemented();
  }

  useUserBuffer() {
    notImplemented();
  }

  shutdown() {
    notImplemented();
  }

  setWriteResult() {
    notImplemented();
  }

  writev() {
    notImplemented();
  }

  writeBuffer() {
    notImplemented();
  }

  writeString() {
    notImplemented();
  }

  bytesRead = 0;

  bytesWritten = 0;

  // deno-lint-ignore no-explicit-any
  onread(_a: any, _b: any): any {
    notImplemented();
  }

  // deno-lint-ignore ban-types
  close(_cb?: Function) {
    notImplemented();
  }

  ref() {
    notImplemented();
  }

  unref() {
    notImplemented();
  }

  hasRef() {
    notImplemented();
  }

  onclose() {
    notImplemented();
  }
}

export class PipeConnectWrap {
  oncomplete!: (
    status: number,
    handle: ConnectionWrap,
    req: PipeConnectWrap,
    readable: boolean,
    writeable: boolean,
  ) => void;
  address!: string;
}

export enum constants {
  SOCKET = socketType.SOCKET,
  SERVER = socketType.SERVER,
  IPC = socketType.IPC,
  UV_READABLE,
  UV_WRITABLE,
}
