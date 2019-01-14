// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { listen, Listener, Conn } from "deno";
import { TextProtoReader } from "../net/textproto.ts";
import { BufReader, BufWriter } from "../net/bufio.ts";

declare module "deno" {
  interface Conn {
    rid: number;
  }
}

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

enum RPL {
  WELCOME = "001",
  YOURHOST = "002",
  CREATED = "003",
  MYINFO = "004",
  ISUPPORT = "005",
  LUSERCLIENT = "251",
  LUSEROP = "252",
  LUSERUNKNOWN = "253",
  LUSERCHANNELS = "254",
  LUSERME = "255",
  LOCALUSERS = "265",
  GLOBALUSERS = "266"
}

enum ERR {
  NONICKNAMEGIVEN = "431",
  ERRONEUSNICKNAME = "432",
  NICKNAMEINUSE = "433",
  NEEDMOREPARAMS = "461",
  ALREADYREGISTERED = "462",
}

export class IrcServer {
  private _listener: Listener;
  private _channels: Map<string, Channel> = new Map();
  /** Maps usernames to user objects */
  private _conns: Map<string, ServerConn> = new Map();
  private _host: string;

  constructor(address: string) {
    this._listener = listen("tcp", address);

    // Host prefixes for replies don't have the port usually
    this._host = address.substring(0, address.indexOf(":"));
  }
  /** Allows server to begin accepting connections and messages */
  async start() {
    while (true) {
      const conn = await this._listener.accept();
      const newServerConn = new ServerConn(conn);
      const id = conn.rid.toString();
      this._conns.set(id, newServerConn);
      newServerConn.id = id;
      this._handleUserMessages(newServerConn);
    }
  }

  // start() {
  //   const acceptRoutine = () => {
  //     const handleConn = (conn: Conn) => {
  //       const newServerConn = new ServerConn(conn);
  //       // TODO(fancyplants) replace id with conn.rid when implemented
  //       const id = generateID();
  //       this._conns.set(id, newServerConn);
  //       newServerConn.id = id;
  //       this._handleUserMessages(newServerConn);
  //       scheduleAccept();
  //     };

  //     const scheduleAccept = () => {
  //       this._listener.accept().then(handleConn);
  //     };

  //     scheduleAccept();
  //   };

  //   acceptRoutine();
  // }

  private async _handleUserMessages(conn: ServerConn) {
    for await (const msg of conn.readMessages()) {
      try {
        const parsedMsg = new Proxy(parse(msg), messageProxyHandler);
        switch (parsedMsg.command) {
          case "NICK":
            const nickname = parsedMsg.params[0];
            // TODO make sure nickname is sound
            this.NICK(conn, nickname);
            break;

          case "USER":
            const username = parsedMsg.params[0];
            const fullname = parsedMsg.params[3];
            this.USER(conn, username, fullname);
            break;
        }
      } catch (err) {
        console.error(err);
        return;
      }
    }

    this.removeConnection(conn);
  }

  close() {
    this._listener.close();
    for (const [_, conn] of this._conns) {
      conn.close();
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
      return;
    }

    this._conns.set(conn.username, conn);
    conn.isRegistered = true;

    if (this._conns.has(conn.id)) {
      this._conns.delete(conn.id);
    }

    // after successful registration, multiple mandated responses from server
    this._replyToConn(
      conn,
      RPL.WELCOME,
      [`:Welcome to the server ${conn.nickname}`],
      false
    );
    this._replyToConn(
      conn,
      RPL.YOURHOST,
      [":Your host is PLACEHOLDER, running version PLACEHOLDER"],
      false
    );
    this._replyToConn(
      conn,
      RPL.CREATED,
      [":This server was created PLACEHOLDER"],
      false
    );
    this._replyToConn(conn, RPL.MYINFO, ["Misc information here"], false);
    this._replyToConn(conn, RPL.ISUPPORT, [
      "PLACEHOLDER :are supported by this server."
    ]);
    this._replyToLUSERS(conn);
    this._sendMOTD(conn);
  }

  private _sendMOTD(conn: ServerConn) {
    // TODO(fancyplants) send actual MOTD message
    this._replyToConn(conn, "422", [":MOTD is missing"]);
  }

  private _replyToLUSERS(conn: ServerConn) {
    this._replyToConn(
      conn,
      RPL.LUSERCLIENT,
      [":There are PLACEHOLDER users and PLACEHOLDER invisible on 1 server"],
      false
    );
    this._replyToConn(
      conn,
      RPL.LUSEROP,
      [":PLACEHOLDER :operators online"],
      false
    );
    this._replyToConn(
      conn,
      RPL.LUSERUNKNOWN,
      ["PLACEHOLDER :unknown connections"],
      false
    );
    this._replyToConn(
      conn,
      RPL.LUSERCHANNELS,
      [`${this._channels.size} :channels formed`],
      false
    );
    this._replyToConn(conn, RPL.LUSERME, [
      ":I have PLACEHOLDER clients and 1 server"
    ]);
  }

  NICK(conn: ServerConn, nickname: string) {
    if (!nickname) {
      this._replyToConn(conn, ERR.NONICKNAMEGIVEN, [":No nickname given"]);
      return;
    }

    // check if any registered users got that nickname
    for (const [_, currConn] of this._conns) {
      if (currConn.nickname === nickname) {
        // TODO move all numeric replies to something like a Typescript enum
        this._replyToConn(conn, ERR.NICKNAMEINUSE, [
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
      this._replyToConn(conn, ERR.NEEDMOREPARAMS, [":Wrong params for USER command"]);
      return;
    }

    if (conn.isRegistered) {
      this._replyToConn(conn, ERR.ALREADYREGISTERED, [":Cannot register twice"]);
      return;
    }

    for (const [_, currConn] of this._conns) {
      if (currConn.username === username) {
        this._replyToConn(conn, ERR.ALREADYREGISTERED, [":Cannot register twice"]);
        return;
      }
    }

    conn.username = username;
    conn.fullname = fullname;
    this._attemptRegisterConn(conn);
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
  private _conn: Conn;

  private _userModes: Set<UserMode> = new Set();
  public nickname = "";
  public username = "";
  public fullname = "";
  public isRegistered = false;
  public id = "";

  constructor(conn: Conn) {
    this._conn = conn;
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

  close() {
    this._conn.close();
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
