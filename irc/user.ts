// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Conn } from "deno";

const utf8Decoder = new TextDecoder();
const utf8Encoder = new TextEncoder();
const DEFAULT_BUFFER_SIZE = 1024;

type UserMode =
  | "+i"
  | "+o"
  | "+O"
  // | "+r"
  | "+w";

export class User {
  private _conn: Conn;
  private _buf: Uint8Array;

  // TODO: buffer full IRC messages
  private _messageBuf: string = "";

  private _userModes: Set<UserMode> = new Set();
  public nickname = "";
  public username = "";
  public fullname = "";
  public isRegistered = false;
  public id = "";

  constructor(conn: Conn) {
    this._conn = conn;
    this._buf = new Uint8Array(DEFAULT_BUFFER_SIZE);
  }

  async *readMessages(): AsyncIterableIterator<string> {
    while (true) {
      const rr = await this._conn.read(this._buf);
      if (rr.eof) {
        return;
      }

      const plaintext = utf8Decoder.decode(this._buf.buffer.slice(0, rr.nread));
      // TODO(fancyplants) figure out how to split incoming multiple messages
      const ircMessages = plaintext.split("\r\n");

      for (const msg of ircMessages) {
        if (msg) {
          yield msg;
        }
      }
    }
  }

  write(msg: string): Promise<number> {
    const encoded = utf8Encoder.encode(msg);
    return this._conn.write(encoded);
  }

  get modes() {
    return Array.from(this._userModes);
  }

  get isInvisible() {
    return this._userModes.has("+i");
  }

  set isInvisible(bool: boolean) {
    bool ? this._userModes.add("+i") : this._userModes.delete("+i");
  }

  get isOp() {
    return this._userModes.has("+o");
  }

  set isOp(bool: boolean) {
    bool ? this._userModes.add("+o") : this._userModes.delete("+o");
  }

  get isLocalOp() {
    return this._userModes.has("+O");
  }

  set isLocalOp(bool: boolean) {
    bool ? this._userModes.add("+O") : this._userModes.delete("+O");
  }

  get isWallops() {
    return this._userModes.has("+w");
  }

  set isWallops(bool: boolean) {
    bool ? this._userModes.add("+w") : this._userModes.delete("+w");
  }
}
