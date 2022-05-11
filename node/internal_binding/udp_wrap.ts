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
import { codeMap } from "./uv.ts";
import type { ErrnoException } from "../internal/errors.ts";
import { GetAddrInfoReqWrap } from "./cares_wrap.ts";
import { AsyncWrap } from "./async_wrap.ts";
import { Buffer } from "../buffer.ts";
import { isIP } from "../internal/net.ts";
import { notImplemented } from "../_utils.ts";
import * as DenoUnstable from "../../_deno_unstable.ts";

type MessageType = string | Uint8Array | Buffer | DataView;

const AF_INET = 2;
const AF_INET6 = 10;

const UDP_DGRAM_MAXSIZE = 64 * 1024;

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

  #address?: string;
  #port?: number;

  #remoteAddress?: string;
  #remoteFamily?: string;
  #remotePort?: number;

  #listener!: DenoUnstable.DatagramConn;

  #bound = false;
  #receiving = false;
  #connected = false;

  onmessage!: (
    nread: number,
    handle: UDP,
    buf?: Buffer,
    rinfo?: {
      address: string;
      family: "IPv4" | "IPv6";
      port: number;
      size?: number;
    },
  ) => void;

  lookup!: (
    address: string,
    callback: (
      err: ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  ) => GetAddrInfoReqWrap | Record<string, never>;

  constructor() {
    super(providerType.UDPWRAP);
  }

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

  /**
   * Bind to an IPv4 address.
   * @param ip The hostname to bind to.
   * @param port The port to bind to
   * @return An error status code.
   */
  bind(ip: string, port: number, flags: number): number {
    return this.#doBind(ip, port, flags, AF_INET);
  }

  /**
   * Bind to an IPv6 address.
   * @param ip The hostname to bind to.
   * @param port The port to bind to
   * @return An error status code.
   */
  bind6(ip: string, port: number, flags: number): number {
    return this.#doBind(ip, port, flags, AF_INET6);
  }

  bufferSize(
    _size: number,
    _buffer: boolean,
    _ctx: Record<string, unknown>,
  ): number {
    notImplemented("udp.UDP.prototype.bufferSize");
  }

  connect(ip: string, port: number): number {
    return this.#doConnect(ip, port, AF_INET);
  }

  connect6(ip: string, port: number): number {
    return this.#doConnect(ip, port, AF_INET6);
  }

  disconnect(): number {
    this.#connected = false;

    return 0;
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

  /**
   * Populates the provided object with remote address entries.
   * @param peername An object to add the remote address entries to.
   * @return An error status code.
   */
  getpeername(peername: Record<string, unknown>): number {
    if (
      typeof this.#remoteAddress === "undefined" ||
      typeof this.#remotePort === "undefined"
    ) {
      return codeMap.get("EADDRNOTAVAIL")!;
    }

    peername.address = this.#remoteAddress;
    peername.port = this.#remotePort;
    peername.family = this.#remoteFamily;

    return 0;
  }

  /**
   * Populates the provided object with local address entries.
   * @param sockname An object to add the local address entries to.
   * @return An error status code.
   */
  getsockname(sockname: Record<string, unknown>): number {
    if (
      typeof this.#address === "undefined" ||
      typeof this.#port === "undefined"
    ) {
      return codeMap.get("EADDRNOTAVAIL")!;
    }

    sockname.address = this.#address;
    sockname.port = this.#port;
    sockname.family = isIP(this.#address);

    return 0;
  }

  /**
   * Opens a file descriptor.
   * @param fd The file descriptor to open.
   * @return An error status code.
   */
  open(_fd: number): number {
    notImplemented("udp.UDP.prototype.open");
  }

  /**
   * Start receiving on the connection.
   * @return An error status code.
   */
  recvStart(): number {
    if (!this.#receiving) {
      this.#receiving = true;
      this.#receive();
    }

    return 0;
  }

  /**
   * Stop receiving on the connection.
   * @return An error status code.
   */
  recvStop(): number {
    this.#receiving = false;

    return 0;
  }

  send(
    req: SendWrap,
    bufs: MessageType[],
    count: number,
    ...args: unknown[]
  ): number {
    return this.#doSend(req, bufs, count, args, AF_INET);
  }

  send6(
    req: SendWrap,
    bufs: MessageType[],
    count: number,
    ...args: unknown[]
  ): number {
    return this.#doSend(req, bufs, count, args, AF_INET6);
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

  #doBind(ip: string, port: number, _flags: number, _family: number): number {
    // TODO(cmorten):
    // - validation of flags and family args
    // - use flags to inform socket reuse etc.
    const listenOptions = {
      port,
      hostname: ip,
      transport: "udp" as const,
    };

    let listener;

    try {
      listener = DenoUnstable.listenDatagram(listenOptions);
    } catch (e) {
      if (e instanceof Deno.errors.AddrInUse) {
        return codeMap.get("EADDRINUSE")!;
      } else if (e instanceof Deno.errors.AddrNotAvailable) {
        return codeMap.get("EADDRNOTAVAIL")!;
      }

      // TODO(cmorten): map errors to appropriate error codes.
      return codeMap.get("UNKNOWN")!;
    }

    const address = listener.addr as Deno.NetAddr;
    this.#address = address.hostname;
    this.#port = address.port;
    this.#listener = listener;

    return 0;
  }

  #doConnect(_ip: string, _port: number, _family: number): number {
    this.#connected = true;

    return 0;
  }

  #doSend(
    req: SendWrap,
    bufs: MessageType[],
    count: number,
    args: unknown[],
    _family: number,
  ): number {
    const sendTo = args.length === 3;
    let hasCallback: boolean;

    if (sendTo) {
      this.#remotePort = args[0] as number;
      this.#remoteAddress = args[1] as string;
      hasCallback = args[2] as boolean;
    } else {
      hasCallback = args[0] as boolean;
    }

    const addr: Deno.NetAddr = {
      hostname: this.#remoteAddress!,
      port: this.#remotePort!,
      transport: "udp",
    };

    (async () => {
      const ret: [number, number | null][] = await Promise.all(
        bufs.map(async (buf) => {
          let sent: number;
          let err: number | null = null;

          let payload: Uint8Array;

          if (typeof buf === "string") {
            payload = Buffer.from(buf);
          } else if (buf instanceof DataView) {
            payload = new Uint8Array(buf.buffer);
          } else {
            payload = buf;
          }

          try {
            sent = await this.#listener.send(payload, addr);
          } catch (e) {
            // TODO(cmorten): map errors to appropriate error codes.
            if (e instanceof Deno.errors.BadResource) {
              err = codeMap.get("EBADF")!;
            } else {
              err = codeMap.get("UNKNOWN")!;
            }

            sent = 0;
          }

          return [sent, err];
        }),
      );

      let sent = 0;
      let err: number | null = null;

      for (let i = 0; i < count; i++) {
        sent += ret[i][0];

        if (ret[i][1] !== null) {
          err = ret[i][1];
        }
      }

      if (hasCallback) {
        try {
          req.oncomplete(err, sent);
        } catch {
          // swallow callback errors
        }
      }
    })();

    return 0;
  }

  async #receive(): Promise<void> {
    if (this.#bound || this.#receiving === false) {
      return;
    }

    const p = new Uint8Array(UDP_DGRAM_MAXSIZE);

    let buf: Uint8Array;
    let remoteAddr: Deno.NetAddr | null;
    let nread: number | null;

    try {
      [buf, remoteAddr] = (await this.#listener.receive(p)) as [
        Uint8Array,
        Deno.NetAddr,
      ];

      nread = buf.length;
    } catch (e) {
      if (
        e instanceof Deno.errors.Interrupted ||
        e instanceof Deno.errors.BadResource
      ) {
        nread = codeMap.get("EOF")!;
      } else {
        nread = codeMap.get("UNKNOWN")!;
      }

      buf = new Uint8Array(0);
      remoteAddr = null;
    }

    nread ??= codeMap.get("EOF")!;

    const rinfo = remoteAddr
      ? {
        address: remoteAddr.hostname,
        port: remoteAddr.port,
        family: isIP(remoteAddr.hostname) === 6
          ? ("IPv6" as const)
          : ("IPv4" as const),
      }
      : undefined;

    try {
      this.onmessage(nread, this, Buffer.from(buf), rinfo);
    } catch {
      // swallow callback errors.
    }

    if (this.#receiving) {
      this.#receive();
    }
  }

  /** Handle socket closure. */
  override _onClose(): number {
    this.#bound = false;
    this.#receiving = false;

    this.#address = undefined;
    this.#port = undefined;

    try {
      this.#listener.close();
    } catch {
      // listener already closed
    }

    return 0;
  }
}
