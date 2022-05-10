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
import { notImplemented } from "../_utils.ts";

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
  onmessage!: (
    nread: number,
    handle: UDP,
    buf: Buffer,
    rinfo: {
      address: string;
      family: "IPv4" | "IPv6";
      port: number;
      size: number;
    },
  ) => void;

  constructor() {
    super(providerType.UDPWRAP);
  }

  lookup!: (
    address: string,
    callback: (
      err: ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  ) => GetAddrInfoReqWrap | Record<string, never>;

  addMembership(_multicastAddress: string, _interfaceAddress?: string): number {
    notImplemented("udp.UDP.prototype.addMembership");
  }

  addSourceSpecificMembership(
    _sourceAddress: string,
    _groupAddress: string,
    _interfaceAddress?: string,
  ): number {
    notImplemented("udp.UDP.prototype.addSourceSpecificMembership");
  }

  bind(_ip: string, _port: number, _flags: number): number {
    notImplemented("udp.UDP.prototype.bind");
  }

  bind6(_ip: string, _port: number, _flags: number): number {
    notImplemented("udp.UDP.prototype.bind6");
  }

  bufferSize(
    _size: number,
    _buffer: boolean,
    _ctx: Record<string, unknown>,
  ): number {
    notImplemented("udp.UDP.prototype.bufferSize");
  }

  connect(_ip: string, _port: number): number {
    notImplemented("udp.UDP.prototype.connect");
  }

  connect6(_ip: string, _port: number): number {
    notImplemented("udp.UDP.prototype.connect6");
  }

  disconnect(): number {
    notImplemented("udp.UDP.prototype.disconnect");
  }

  dropMembership(
    _multicastAddress: string,
    _interfaceAddress?: string,
  ): number {
    notImplemented("udp.UDP.prototype.dropMembership");
  }

  dropSourceSpecificMembership(
    _sourceAddress: string,
    _groupAddress: string,
    _interfaceAddress?: string,
  ): number {
    notImplemented("udp.UDP.prototype.dropSourceSpecificMembership");
  }

  getpeername(_req: Record<string, unknown>): number {
    notImplemented("udp.UDP.prototype.getpeername");
  }

  getsockname(_req: Record<string, unknown>): number {
    notImplemented("udp.UDP.prototype.getsockname");
  }

  open(_fd: number): number {
    notImplemented("udp.UDP.prototype.open");
  }

  recvStart(): void {
    notImplemented("udp.UDP.prototype.recvStart");
  }

  recvStop(): void {
    notImplemented("udp.UDP.prototype.recvStart");
  }

  send(
    _req: SendWrap,
    _bufs: MessageType[],
    _count: number,
    ..._args: unknown[]
  ): number {
    notImplemented("udp.UDP.prototype.send");
  }

  send6(
    _req: SendWrap,
    _bufs: MessageType[],
    _count: number,
    ..._args: unknown[]
  ): number {
    notImplemented("udp.UDP.prototype.send6");
  }

  setBroadcast(_bool: 0 | 1): number {
    notImplemented("udp.UDP.prototype.setBroadcast");
  }

  setMulticastInterface(_interfaceAddress: string): number {
    notImplemented("udp.UDP.prototype.setMulticastInterface");
  }

  setMulticastLoopback(_bool: 0 | 1): number {
    notImplemented("udp.UDP.prototype.setMulticastLoopback");
  }

  setMulticastTTL(_ttl: number): number {
    notImplemented("udp.UDP.prototype.setMulticastTTL");
  }

  setTTL(_ttl: number): number {
    notImplemented("udp.UDP.prototype.setTTL");
  }
}
