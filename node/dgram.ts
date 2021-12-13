// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { notImplemented } from "./_utils.ts";
import { Buffer } from "./buffer.ts";
import { EventEmitter } from "./events.ts";
import { lookup as defaultLookup } from "./dns.ts";

interface AddressInfo {
  address: string;
  family: string;
  port: number;
}

type SocketType = "udp4" | "udp6";
type RemoteInfo = {
  address: string;
  family: "IPv4" | "IPv6";
  port: number;
  size: number;
};

interface BindOptions {
  port?: number;
  address?: string;
  exclusive?: boolean;
  fd?: number;
}
interface SocketOption {
  type: SocketType;
  reuseAddr?: boolean;
  ipv6Only?: boolean;
  recvBufferSize?: number;
  sendBufferSize?: number;
  lookup?: typeof defaultLookup;
  signal?: AbortSignal;
}

type MessageType = string | Uint8Array | Buffer | DataView;

export class Socket extends EventEmitter {
  constructor(
    _type: SocketType | SocketOption,
    _listener?: (msg: Buffer, rinfo: RemoteInfo) => void,
  ) {
    super();
  }
  addMembership(_multicastAddress: string, _interfaceAddress?: string): void {
    notImplemented();
  }
  addSourceSpecificMembership(
    _sourceAddress: string,
    _groupAddress: string,
    _interfaceAddress?: string,
  ): void {
    notImplemented();
  }
  address(): AddressInfo {
    notImplemented();
  }
  bind(port?: number, address?: string, callback?: () => void): this;
  bind(port: number, callback?: () => void): this;
  bind(callback: () => void): this;
  bind(options: BindOptions, callback?: () => void): this;
  bind(..._args: unknown[]): this {
    notImplemented();
  }
  close(_callback?: () => void): this {
    notImplemented();
  }

  connect(port: number, address?: string, callback?: () => void): void;
  connect(port: number, callback: () => void): void;
  connect(_port: number, _arg1?: unknown, _arg2?: unknown): void {
    notImplemented();
  }
  disconnect(): void {
    notImplemented();
  }
  dropMembership(_multicastAddress: string, _interfaceAddress?: string): void {
    notImplemented();
  }
  dropSourceSpecificMembership(
    _sourceAddress: string,
    _groupAddress: string,
    _interfaceAddress?: string,
  ): void {
    notImplemented();
  }
  getRecvBufferSize(): number {
    notImplemented();
  }
  getSendBufferSize(): number {
    notImplemented();
  }
  ref(): this {
    notImplemented();
  }
  send(
    msg: MessageType | ReadonlyArray<MessageType>,
    port?: number,
    address?: string,
    callback?: (error: Error | null, bytes: number) => void,
  ): void;
  send(
    msg: MessageType | ReadonlyArray<MessageType>,
    port?: number,
    callback?: (error: Error | null, bytes: number) => void,
  ): void;
  send(
    msg: MessageType | ReadonlyArray<MessageType>,
    callback?: (error: Error | null, bytes: number) => void,
  ): void;
  send(
    msg: MessageType,
    offset: number,
    length: number,
    port?: number,
    address?: string,
    callback?: (error: Error | null, bytes: number) => void,
  ): void;
  send(
    msg: MessageType,
    offset: number,
    length: number,
    port?: number,
    callback?: (error: Error | null, bytes: number) => void,
  ): void;
  send(
    msg: MessageType,
    offset: number,
    length: number,
    callback?: (error: Error | null, bytes: number) => void,
  ): void;
  // deno-lint-ignore no-explicit-any
  send(_msg: MessageType | ReadonlyArray<any>, ..._args: unknown[]): void {
    notImplemented();
  }

  remoteAddress(): AddressInfo {
    notImplemented();
  }
  setBroadcast(_arg: boolean): void {
    notImplemented();
  }
  setMulticastInterface(_interfaceAddress: string): void {
    notImplemented();
  }
  setMulticastLoopback(_arg: boolean): void {
    notImplemented();
  }
  setMulticastTTL(_ttl: number): void {
    notImplemented();
  }
  setRecvBufferSize(_size: number): void {
    notImplemented();
  }
  setSendBufferSize(_size: number): void {
    notImplemented();
  }
  setTTL(_ttl: number): void {
    notImplemented();
  }
  unref(): this {
    notImplemented();
  }
  addListener(event: "close", listener: () => void): this;
  addListener(event: "connect", listener: () => void): this;
  addListener(event: "error", listener: (err: Error) => void): this;
  addListener(event: "listening", listener: () => void): this;
  addListener(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  // deno-lint-ignore no-explicit-any
  addListener(event: string, listener: (...args: any[]) => void): this {
    return super.addListener(event, listener);
  }

  emit(event: "close"): boolean;
  emit(event: "connect"): boolean;
  emit(event: "error", err: Error): boolean;
  emit(event: "listening"): boolean;
  emit(event: "message", msg: Buffer, rinfo: RemoteInfo): boolean;
  // deno-lint-ignore no-explicit-any
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
  on(event: "close", listener: () => void): this;
  on(event: "connect", listener: () => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "listening", listener: () => void): this;
  on(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  // deno-lint-ignore no-explicit-any
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
  once(event: "close", listener: () => void): this;
  once(event: "connect", listener: () => void): this;
  once(event: "error", listener: (err: Error) => void): this;
  once(event: "listening", listener: () => void): this;
  once(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  // deno-lint-ignore no-explicit-any
  once(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
  prependListener(event: "close", listener: () => void): this;
  prependListener(event: "connect", listener: () => void): this;
  prependListener(event: "error", listener: (err: Error) => void): this;
  prependListener(event: "listening", listener: () => void): this;
  prependListener(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  // deno-lint-ignore no-explicit-any
  prependListener(event: string, listener: (...args: any[]) => void): this {
    return super.prependListener(event, listener);
  }
  prependOnceListener(event: "close", listener: () => void): this;
  prependOnceListener(event: "connect", listener: () => void): this;
  prependOnceListener(event: "error", listener: (err: Error) => void): this;
  prependOnceListener(event: "listening", listener: () => void): this;
  prependOnceListener(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  // deno-lint-ignore no-explicit-any
  prependOnceListener(event: string, listener: (...args: any[]) => void): this {
    return super.prependOnceListener(event, listener);
  }
}
export function createSocket(
  type: SocketType,
  listener?: (msg: Buffer, rinfo: RemoteInfo) => void,
): Socket;
export function createSocket(
  type: SocketOption,
  listener?: (msg: Buffer, rinfo: RemoteInfo) => void,
): Socket;
export function createSocket(
  type: SocketType | SocketOption,
  listener?: (msg: Buffer, rinfo: RemoteInfo) => void,
): Socket {
  return new Socket(type, listener);
}

export default {
  createSocket,
  Socket,
};
