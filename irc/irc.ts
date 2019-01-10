// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { listen, Listener, Conn } from "deno";

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
      const newUser = new User(conn);
      this._handleUserMessages(newUser);
    }
  }

  private async _handleUserMessages(user: User) {
    for await (const msg of user.readMessages()) {
      try {
        const parsedMsg = new Proxy(parse(msg), messageProxyHandler);
        this._db.handleMsg(user, parsedMsg);
      } catch (err) {
        console.error(err);
        return;
      }
    }

    this._db.removeUser(user);
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

const utf8Decoder = new TextDecoder();
const utf8Encoder = new TextEncoder();
const DEFAULT_BUFFER_SIZE = 1024;


export enum UserMode {
  Invisible = "+i",
  Operator = "+o",
  LocalOperator = "+O",
  Registered = "+r",
  Wallops = "+w"
}

export class User {
  private _conn: Conn;
  private _buf: Uint8Array;

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
  private _users: Map<string, User> = new Map();

  private _host: string;

  constructor(host: string) {
    this._host = host;
  }

  handleMsg(user: User, msg: MessageData) {
    switch (msg.command) {
      case "NICK":
        const nickname = msg.params[0];
        // TODO make sure nickname is sound
        this.NICK(user, nickname);
        break;

      case "USER":
        const username = msg.params[0];
        const fullname = msg.params[3];
        this.USER(user, username, fullname);
        break;
    }
  }

  removeUser(user: User) {
    if (user.username) {
      this._users.delete(user.username);
    }

    if (user.id) {
      this._users.delete(user.id);
    }
  }

  private _replyToUser(user: User, command: string, params: string[]) {
    // for unregistered users, most servers just put an asterisk in the <client> spot
    const nickname = user.nickname || "*";
    return user.write(`:${this._host} ${command} ${nickname} ${params}\r\n`);
  }

  private _attemptRegisterUser(user: User) {
    if (!user.nickname || !user.username || !user.fullname) {
      // can only register with all three

      // attempt to give this socket a unique ID
      if (!user.id) {
        const uid = generateID();
        user.id = uid;
        this._users.set(uid, user);
      }
      return;
    }

    this._users.set(user.username, user);
    user.isRegistered = true;

    if (this._users.has(user.id)) {
      this._users.delete(user.id);
    }

    this._replyToUser(user, "001", [`:Welcome to the server ${user.nickname}`]);
  }

  NICK(user: User, nickname: string) {
    if (!nickname) {
      this._replyToUser(user, "431", [":No nickname given"]);
      return;
    }

    // check if any registered users got that nickname
    for (const [_, currUser] of this._users) {
      if (currUser.nickname === nickname) {
        // TODO move all numeric replies to something like a Typescript enum
        this._replyToUser(user, "433", [
          `:Nickname "${nickname}" has already been taken.`
        ]);
        return;
      }
    }

    this._attemptRegisterUser(user);

    if (user.nickname) {
      // let other users know that a user changed their nickname
      const oldNickname = user.nickname;
      user.nickname = nickname;
      const nicknameUpdateMsg = `:${oldNickname} NICK ${nickname}\r\n`;

      // maybe handle automatic updates to other user through Proxying User?
      for (const [_, currUser] of this._users) {
        if (user === currUser) {
          continue;
        }

        currUser.write(nicknameUpdateMsg);
      }
    } else {
      user.nickname = nickname;
    }
  }

  USER(user: User, username: string, fullname: string) {
    if (!username || !fullname) {
      this._replyToUser(user, "461", [":Wrong params for USER command"]);
      return;
    }

    if (user.isRegistered) {
      this._replyToUser(user, "462", [":Cannot register twice"]);
      return;
    }

    for (const [_, currUser] of this._users) {
      if (currUser.username === username) {
        this._replyToUser(user, "462", [":Cannot register twice"]);
        return;
      }
    }

    user.username = username;
    user.fullname = fullname;
    this._attemptRegisterUser(user);
  }
}
