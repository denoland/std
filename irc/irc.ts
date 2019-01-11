// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { listen, Listener, Conn } from "deno";
import { TextProtoReader } from "../net/textproto.ts";
import { BufReader, BufWriter } from "../net/bufio.ts";

// ensures that there are no crashes if a wrong
// property on a MessageData object, as a try-catch
// block does not catch
const messageProxyHandler: ProxyHandler<MessageData> = {
  get(target, property) {
    if (target[property] === undefined) {
      throw new TypeError(
        `Property ${String(property)} does not exist on Message.`
      );
    }

    return target[property];
  }
};

export class IrcServer {
  private _listener: Listener;
  private _db: IrcDatabase;

  constructor(address: string) {
    this._listener = listen("tcp", address);

    // Host prefixes for replies don't have the port usually
    this._db = new IrcDatabase(address.substring(0, address.indexOf(":")));
  }
  /** Allows server to begin accepting connections and messages */
  async start() {
    while (true) {
      const conn = await this._listener.accept();
      const newServerConn = new ServerConn(conn);
      this._handleUserMessages(newServerConn);
    }
  }

  private async _handleUserMessages(conn: ServerConn) {
    for await (const msg of conn.readMessages()) {
      try {
        const parsedMsg = new Proxy(parse(msg), messageProxyHandler);
        this._db.handleMsg(conn, parsedMsg);
      } catch (err) {
        console.error(err);
        return;
      }
    }

    this._db.removeConnection(conn);
  }

  close() {
    this._listener.close();
  }
}

/** Represents IRCv3 tags parsed as an object. */
export type ParsedTags = { [tag: string]: string | boolean };

/** MessageData is a parsed representation of a client message */
export interface MessageData {
  tags: ParsedTags;
  prefix: string;
  command: string;
  params: string[];
}

const RFC1459MaxMessageLength = 512;

export function parse(message: string): MessageData {
  if (message.length > RFC1459MaxMessageLength) {
    throw new InvalidMessageException("Message cannot exceed 512 characters.");
  }

  if (message.endsWith("\r\n")) {
    throw new InvalidMessageException(
      "CRLF must be removed from string before using parse."
    );
  }

  let tags: ParsedTags = {};
  let prefix = "";
  let command: string;
  let params: string[] = [];
  let index = 0;
  const messageParts = message.split(" ");

  // check for tags
  if (messageParts[index].startsWith("@")) {
    tags = parseTagsToJSON(messageParts[index]);
    index++;
  }

  // check for possible prefix
  if (messageParts[index].startsWith(":")) {
    prefix = messageParts[index];
    index++;
  }

  command = messageParts[index];
  index++;

  // iterate through params and add them one at a time,
  // possibly concatenating any message after another colon (":")
  // into one string as the last parameter
  for (let i = index; i < messageParts.length; i++) {
    const currentPart = messageParts[i];

    // any param that starts with a colon is the last param with whitespace
    // included
    if (currentPart.startsWith(":")) {
      const remainingParts = messageParts.slice(i);
      const lastParam = remainingParts.reduce(
        (prev, curr) => `${prev} ${curr}`
      );
      params.push(lastParam);
      break;
    }

    params.push(currentPart);
  }

  return {
    tags,
    prefix,
    command,
    params
  };
}

function parseTagsToJSON(tags: string): ParsedTags {
  const parsedTags: ParsedTags = {};
  const strWithoutSymbol = tags.substring(1);
  const tagParts = strWithoutSymbol.split(";");

  for (const part of tagParts) {
    const [key, value] = part.split("=");
    if (value === "") {
      parsedTags[key] = "";
    } else if (!value) {
      parsedTags[key] = true;
    } else {
      parsedTags[key] = value;
    }
  }

  return parsedTags;
}

/** Indicates that there was an invalid message passed to `parse` */
export class InvalidMessageException extends Error {}

const utf8Encoder = new TextEncoder();

export enum UserMode {
  Invisible = "+i",
  Operator = "+o",
  LocalOperator = "+O",
  Registered = "+r",
  Wallops = "+w"
}

export class ServerConn {
  private _reader: TextProtoReader;
  private _writer: BufWriter;

  private _userModes: Set<UserMode> = new Set();
  public nickname = "";
  public username = "";
  public fullname = "";
  public isRegistered = false;
  public id = "";

  constructor(conn: Conn) {
    this._reader = new TextProtoReader(new BufReader(conn));
    this._writer = new BufWriter(conn);
  }

  async *readMessages(): AsyncIterableIterator<string> {
    while (true) {
      const [plaintext, err] = await this._reader.readLine();

      if (err === "EOF") {
        return;
      }

      yield plaintext;
    }
  }

  /** Writes message to underlying BufWriter */
  write(msg: string) {
    const encoded = utf8Encoder.encode(msg);
    return this._writer.write(encoded);
  }

  /** Flushes buffered writes into underlying connection */
  flush() {
    return this._writer.flush();
  }

  get modes() {
    return Array.from(this._userModes);
  }

  get isInvisible() {
    return this._userModes.has(UserMode.Invisible);
  }

  set isInvisible(bool: boolean) {
    bool
      ? this._userModes.add(UserMode.Invisible)
      : this._userModes.delete(UserMode.Invisible);
  }

  get isOp() {
    return this._userModes.has(UserMode.Operator);
  }

  set isOp(bool: boolean) {
    bool
      ? this._userModes.add(UserMode.Operator)
      : this._userModes.delete(UserMode.Operator);
  }

  get isLocalOp() {
    return this._userModes.has(UserMode.LocalOperator);
  }

  set isLocalOp(bool: boolean) {
    bool
      ? this._userModes.add(UserMode.LocalOperator)
      : this._userModes.delete(UserMode.LocalOperator);
  }

  get isWallops() {
    return this._userModes.has(UserMode.Wallops);
  }

  set isWallops(bool: boolean) {
    bool
      ? this._userModes.add(UserMode.Wallops)
      : this._userModes.delete(UserMode.Wallops);
  }
}

export enum ChannelMode {
  Ban = "+b",
  Exception = "+e",
  ClientLimit = "+l",
  InviteOnly = "+i",
  InviteException = "+I",
  Key = "+k",
  Moderated = "+m",
  Secret = "+s",
  ProtectedTopic = "+t",
  NoExternalMessages = "+n"
}

export class Channel {
  public name: string;

  public types: Set<ChannelMode> = new Set();

  constructor(name: string) {
    this.name = name;
  }
}

function generateID() {
  return new Date().toJSON() + Math.random();
}

export class IrcDatabase {
  private _channels: Map<string, Channel> = new Map();

  /** Maps usernames to user objects */
  private _conns: Map<string, ServerConn> = new Map();

  private _host: string;

  constructor(host: string) {
    this._host = host;
  }

  handleMsg(conn: ServerConn, msg: MessageData) {
    switch (msg.command) {
      case "NICK":
        const nickname = msg.params[0];
        // TODO make sure nickname is sound
        this.NICK(conn, nickname);
        break;

      case "USER":
        const username = msg.params[0];
        const fullname = msg.params[3];
        this.USER(conn, username, fullname);
        break;
    }
  }

  removeConnection(conn: ServerConn) {
    if (conn.username) {
      this._conns.delete(conn.username);
    }

    if (conn.id) {
      this._conns.delete(conn.id);
    }
  }

  private _replyToConn(
    conn: ServerConn,
    command: string,
    params: string[],
    flush = true
  ) {
    // for unregistered users, most servers just put an asterisk in the <client> spot
    const nickname = conn.nickname || "*";
    let n = conn.write(`:${this._host} ${command} ${nickname} ${params}\r\n`);

    // optional flush if there's a big message, like a MOTD
    if (flush) {
      conn.flush();
    }
    return n;
  }

  private _attemptRegisterConn(conn: ServerConn) {
    if (!conn.nickname || !conn.username || !conn.fullname) {
      // can only register with all three

      // attempt to give this socket a unique ID
      if (!conn.id) {
        const uid = generateID();
        conn.id = uid;
        this._conns.set(uid, conn);
      }
      return;
    }

    this._conns.set(conn.username, conn);
    conn.isRegistered = true;

    if (this._conns.has(conn.id)) {
      this._conns.delete(conn.id);
    }

    this._replyToConn(conn, "001", [`:Welcome to the server ${conn.nickname}`]);
  }

  NICK(conn: ServerConn, nickname: string) {
    if (!nickname) {
      this._replyToConn(conn, "431", [":No nickname given"]);
      return;
    }

    // check if any registered users got that nickname
    for (const [_, currConn] of this._conns) {
      if (currConn.nickname === nickname) {
        // TODO move all numeric replies to something like a Typescript enum
        this._replyToConn(conn, "433", [
          `:Nickname "${nickname}" has already been taken.`
        ]);
        return;
      }
    }

    if (conn.nickname) {
      // let other users know that a user changed their nickname
      const oldNickname = conn.nickname;
      conn.nickname = nickname;
      this._attemptRegisterConn(conn);
      const nicknameUpdateMsg = `:${oldNickname} NICK ${nickname}\r\n`;

      // maybe handle automatic updates to other user through Proxying User?
      for (const [_, currConn] of this._conns) {
        if (conn === currConn) {
          continue;
        }

        currConn.write(nicknameUpdateMsg);
        currConn.flush();
      }
    } else {
      conn.nickname = nickname;
      this._attemptRegisterConn(conn);
    }
  }

  USER(conn: ServerConn, username: string, fullname: string) {
    if (!username || !fullname) {
      this._replyToConn(conn, "461", [":Wrong params for USER command"]);
      return;
    }

    if (conn.isRegistered) {
      this._replyToConn(conn, "462", [":Cannot register twice"]);
      return;
    }

    for (const [_, currConn] of this._conns) {
      if (currConn.username === username) {
        this._replyToConn(conn, "462", [":Cannot register twice"]);
        return;
      }
    }

    conn.username = username;
    conn.fullname = fullname;
    this._attemptRegisterConn(conn);
  }
}
