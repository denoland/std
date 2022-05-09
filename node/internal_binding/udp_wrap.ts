// TODO(cmorten): remove once typed
// deno-lint-ignore-file no-explicit-any

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

import { HandleWrap } from "./handle_wrap.ts";
import { providerType } from "./async_wrap.ts";
import { ownerSymbol } from "./symbols.ts";
import type { ErrnoException } from "../internal/errors.ts";
import { GetAddrInfoReqWrap } from "./cares_wrap.ts";
import { AsyncWrap } from "./async_wrap.ts";
import { Buffer } from "../buffer.ts";

type MessageType = string | Uint8Array | Buffer | DataView;

export class SendWrap extends AsyncWrap {
  list!: MessageType[];
  address!: string;
  port!: number;

  callback!: (error: ErrnoException | null, bytes?: number) => void;
  oncomplete!: (err: number | null, sent?: number) => void;

  constructor() {
    super(providerType.UDPSENDWRAP);
  }
}

export class UDP extends HandleWrap {
  [ownerSymbol]: unknown = null;

  lookup!: (
    address: string,
    callback: (
      err: ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  ) => GetAddrInfoReqWrap | Record<string, never>;

  bind!: any;
  bind6!: any;
  connect!: any;
  connect6!: any;
  send!: any;
  send6!: any;
  open!: any;
  addMembership!: any;
  addSourceSpecificMembership!: any;
  getsockname!: any;
  getpeername!: any;
  onmessage!: any;
  recvStart!: any;
  recvStop!: any;
  bufferSize!: any;
  disconnect!: any;
  dropMembership!: any;
  dropSourceSpecificMembership!: any;
  setTTL!: any;
  setBroadcast!: any;
  setMulticastInterface!: any;
  setMulticastLoopback!: any;
  setMulticastTTL!: any;

  constructor() {
    super(providerType.UDPWRAP);
  }
}
