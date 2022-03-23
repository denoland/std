// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
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
// - https://github.com/nodejs/node/blob/master/src/pipe_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/pipe_wrap.h

import { notImplemented } from "../_utils.ts";
import { unreachable } from "../../testing/asserts.ts";
import { ConnectionWrap } from "./connection_wrap.ts";
import { AsyncWrap, providerType } from "./async_wrap.ts";

export enum socketType {
  SOCKET,
  SERVER,
  IPC,
}

export class Pipe extends ConnectionWrap {
  override reading = false;
  ipc: boolean;

  constructor(type: number) {
    let provider: providerType;
    let ipc: boolean;

    switch (type) {
      case socketType.SOCKET: {
        provider = providerType.PIPEWRAP;
        ipc = false;

        break;
      }
      case socketType.SERVER: {
        provider = providerType.PIPESERVERWRAP;
        ipc = false;

        break;
      }
      case socketType.IPC: {
        provider = providerType.PIPEWRAP;
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
}

export class PipeConnectWrap extends AsyncWrap {
  oncomplete!: (
    status: number,
    handle: ConnectionWrap,
    req: PipeConnectWrap,
    readable: boolean,
    writeable: boolean,
  ) => void;
  address!: string;

  constructor() {
    super(providerType.PIPECONNECTWRAP);
  }
}

export enum constants {
  SOCKET = socketType.SOCKET,
  SERVER = socketType.SERVER,
  IPC = socketType.IPC,
  UV_READABLE,
  UV_WRITABLE,
}
