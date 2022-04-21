// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

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
    notImplemented("dgram.Socket.prototype.addMembership");
  }
  addSourceSpecificMembership(
    _sourceAddress: string,
    _groupAddress: string,
    _interfaceAddress?: string,
  ): void {
    notImplemented("dgram.Socket.prototype.addSourceSpecifiMembership");
  }
  address(): AddressInfo {
    notImplemented("dgram.Socket.prototype.address");
  }
  bind(port?: number, address?: string, callback?: () => void): this;
  bind(port: number, callback?: () => void): this;
  bind(callback: () => void): this;
  bind(options: BindOptions, callback?: () => void): this;
  bind(..._args: unknown[]): this {
    notImplemented("dgram.Socket.prototype.bind");
  }
  close(_callback?: () => void): this {
    notImplemented("dgram.Socket.prototype.close");
  }

  connect(port: number, address?: string, callback?: () => void): void;
  connect(port: number, callback: () => void): void;
  connect(_port: number, _arg1?: unknown, _arg2?: unknown): void {
    notImplemented("dgram.Socket.prototype.connect");
  }
  disconnect(): void {
    notImplemented("dgram.Socket.prototype.");
  }
  dropMembership(_multicastAddress: string, _interfaceAddress?: string): void {
    notImplemented("dgram.Socket.prototype.dropMembership");
  }
  dropSourceSpecificMembership(
    _sourceAddress: string,
    _groupAddress: string,
    _interfaceAddress?: string,
  ): void {
    notImplemented("dgram.Socket.prototype.dropSourceSpecificMembership");
  }
  getRecvBufferSize(): number {
    notImplemented("dgram.Socket.prototype.getRecvBufferSize");
  }
  getSendBufferSize(): number {
    notImplemented("dgram.Socket.prototype.getSendBufferSize");
  }
  ref(): this {
    notImplemented("dgram.Socket.prototype.ref");
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
    notImplemented("dgram.Socket.prototype.send");
  }

  remoteAddress(): AddressInfo {
    notImplemented("dgram.Socket.prototype.remoteAddress");
  }
  setBroadcast(_arg: boolean): void {
    notImplemented("dgram.Socket.prototype.setBroadcast");
  }
  setMulticastInterface(_interfaceAddress: string): void {
    notImplemented("dgram.Socket.prototype.setMulticastInterface");
  }
  setMulticastLoopback(_arg: boolean): void {
    notImplemented("dgram.Socket.prototype.setMulticastLoopback");
  }
  setMulticastTTL(_ttl: number): void {
    notImplemented("dgram.Socket.prototype.setMulticastTTL");
  }
  setRecvBufferSize(_size: number): void {
    notImplemented("dgram.Socket.prototype.setRecvBufferSize");
  }
  setSendBufferSize(_size: number): void {
    notImplemented("dgram.Socket.prototype.setSendBufferSize");
  }
  setTTL(_ttl: number): void {
    notImplemented("dgram.Socket.prototype.setTTL");
  }
  unref(): this {
    notImplemented("dgram.Socket.prototype.unref");
  }
  override addListener(event: "close", listener: () => void): this;
  override addListener(event: "connect", listener: () => void): this;
  override addListener(event: "error", listener: (err: Error) => void): this;
  override addListener(event: "listening", listener: () => void): this;
  override addListener(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  override addListener(
    event: string,
    // deno-lint-ignore no-explicit-any
    listener: (...args: any[]) => void,
  ): this {
    return super.addListener(event, listener);
  }

  override emit(event: "close"): boolean;
  override emit(event: "connect"): boolean;
  override emit(event: "error", err: Error): boolean;
  override emit(event: "listening"): boolean;
  override emit(event: "message", msg: Buffer, rinfo: RemoteInfo): boolean;
  // deno-lint-ignore no-explicit-any
  override emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
  override on(event: "close", listener: () => void): this;
  override on(event: "connect", listener: () => void): this;
  override on(event: "error", listener: (err: Error) => void): this;
  override on(event: "listening", listener: () => void): this;
  override on(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  // deno-lint-ignore no-explicit-any
  override on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
  override once(event: "close", listener: () => void): this;
  override once(event: "connect", listener: () => void): this;
  override once(event: "error", listener: (err: Error) => void): this;
  override once(event: "listening", listener: () => void): this;
  override once(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  // deno-lint-ignore no-explicit-any
  override once(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
  override prependListener(event: "close", listener: () => void): this;
  override prependListener(event: "connect", listener: () => void): this;
  override prependListener(
    event: "error",
    listener: (err: Error) => void,
  ): this;
  override prependListener(event: "listening", listener: () => void): this;
  override prependListener(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  override prependListener(
    event: string,
    // deno-lint-ignore no-explicit-any
    listener: (...args: any[]) => void,
  ): this {
    return super.prependListener(event, listener);
  }
  override prependOnceListener(event: "close", listener: () => void): this;
  override prependOnceListener(event: "connect", listener: () => void): this;
  override prependOnceListener(
    event: "error",
    listener: (err: Error) => void,
  ): this;
  override prependOnceListener(event: "listening", listener: () => void): this;
  override prependOnceListener(
    event: "message",
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  override prependOnceListener(
    event: string,
    // deno-lint-ignore no-explicit-any
    listener: (...args: any[]) => void,
  ): this {
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
