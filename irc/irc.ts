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
  GLOBALUSERS = "266",
  ENDOFWHO = "315",
  CHANNELMODEIS = "324",
  NOTOPIC = "331",
  TOPIC = "332",
  WHOREPLY = "352",
  NAMREPLY = "353",
  ENDOFNAMES = "366"
}

enum ERR {
  NOSUCHNICK = "401",
  NOSUCHSERVER = "402",
  NOSUCHCHANNEL = "403",
  UNKNOWNCOMMAND = "421",
  NOMOTD = "422",
  NONICKNAMEGIVEN = "431",
  ERRONEUSNICKNAME = "432",
  NICKNAMEINUSE = "433",
  NOTONCHANNEL = "442",
  NEEDMOREPARAMS = "461",
  ALREADYREGISTERED = "462"
}

export class IrcServer {
  private _listener: Listener;
  private _channels: Map<string, Channel> = new Map();
  /** Maps nicknames to user objects */
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
      let conn: Conn;
      try {
        conn = await this._listener.accept();
      } catch (e) {
        console.error(e.toString());
        break;
      }

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

          case "JOIN":
            const channels = parseCSV(parsedMsg.params[0]);
            const keys = parseCSV(parsedMsg.params[1]);
            this.JOIN(conn, channels, keys);
            break;

          case "PART":
            const partChannels = parseCSV(parsedMsg.params[0]);
            this.PART(conn, partChannels, parsedMsg.params[1]);
            break;

          case "PRIVMSG":
            const targets = parseCSV(parsedMsg.params[0]);
            this.PRIVMSG(conn, targets, parsedMsg.params[1]);
            break;

          case "NAMES":
            const nameChannels = parseCSV(parsedMsg.params[0]);
            this.NAMES(conn, nameChannels);
            break;

          case "WHO":
            const channelName = parsedMsg.params[0];
            this.WHO(conn, channelName);
            break;

          case "QUIT":
            const reason = parsedMsg.params[0];
            this.QUIT(conn, reason);
            break;

          case "MODE":
            const target = parsedMsg.params[0];
            this.MODE(conn, target);
            break;

          case "PING":
            this.PING(conn);
            break;

          default:
            console.log(`${conn.nickname}:`, parsedMsg);
            this._replyToConn(conn, ERR.UNKNOWNCOMMAND, [
              parsedMsg.command,
              ":Unknown/unimplemented command"
            ]);
            break;
        }
      } catch (err) {
        console.error(err);
      }
    }

    this.QUIT(conn);
  }

  close() {
    this._listener.close();
    for (const [_, conn] of this._conns) {
      conn.close();
    }
  }

  private _sendMsg(
    conn: ServerConn,
    prefix: string,
    command: string,
    params: string[]
  ) {
    return conn.write(`:${prefix} ${command} ${params.join(" ")}\r\n`);
  }

  private _replyToConn(
    conn: ServerConn,
    command: string,
    params: string[],
    flush = true
  ) {
    // for unregistered users, most servers just put an asterisk in the <client> spot
    const nickname = conn.nickname || "*";
    let n = conn.write(
      `:${this._host} ${command} ${nickname} ${params.join(" ")}\r\n`
    );

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

    this._conns.set(conn.nickname, conn);
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
    this._replyToConn(conn, ERR.NOMOTD, [":MOTD is missing"]);
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

  private _replyToNAMES(conn: ServerConn, channels: string[]) {
    for (const channelName of channels) {
      const channel = this._channels.get(channelName);
      if (!channel) {
        continue;
      }

      const channelOps = channel.ops;
      const userNicks = channel.users.map(user =>
        channelOps.includes(user) ? `@${user.nickname}` : user.nickname
      );

      for (const nick of userNicks) {
        this._replyToConn(conn, RPL.NAMREPLY, ["=", channel.name, `:${nick}`]);
      }

      this._replyToConn(conn, RPL.ENDOFNAMES, [
        channel.name,
        ":End of /NAMES list"
      ]);
    }
  }

  private _replyToTOPIC(conn: ServerConn, channelName: string) {
    // TODO(fancyplants) implement channel topics
    this._replyToConn(conn, RPL.NOTOPIC, [":No topic is set (TODO)"]);
  }

  NICK(conn: ServerConn, nickname: string) {
    if (!nickname) {
      this._replyToConn(conn, ERR.NONICKNAMEGIVEN, [":No nickname given"]);
      return;
    }

    // check if any registered users got that nickname
    for (const [_, currConn] of this._conns) {
      if (currConn.nickname === nickname) {
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
      this._replyToConn(conn, ERR.NEEDMOREPARAMS, [
        ":Wrong params for USER command"
      ]);
      return;
    }

    if (conn.isRegistered) {
      this._replyToConn(conn, ERR.ALREADYREGISTERED, [
        ":Cannot register twice"
      ]);
      return;
    }

    for (const [_, currConn] of this._conns) {
      if (currConn.username === username) {
        this._replyToConn(conn, ERR.ALREADYREGISTERED, [
          ":Cannot register twice"
        ]);
        return;
      }
    }

    conn.username = username;
    conn.fullname = fullname;
    this._attemptRegisterConn(conn);
  }

  JOIN(conn: ServerConn, channels: string[], keys: string[]) {
    if (channels.length === 0) {
      this._replyToConn(conn, ERR.NEEDMOREPARAMS, []);
      return;
    }

    for (let i = 0; i < channels.length; i++) {
      const channelName = channels[i];
      const key = keys[i];
      if (key) {
        throw new Error("Not ready for keys yet!");
      }

      if (!channelName.startsWith("#") && !channelName.startsWith("&")) {
        continue;
      }

      let channel = this._channels.get(channelName);
      if (!channel) {
        channel = new Channel(channelName);
        channel.topic = "PLACEHOLDER";
        this._channels.set(channelName, channel);
      }

      channel.joinChannel(conn);
      this._replyToNAMES(conn, [channelName]);
      // this._replyToTOPIC(conn, channelName);
      // notify other users on channel that a new user has entered
      for (const userConn of channel.users) {
        this._sendMsg(userConn, conn.nickname, "JOIN", [channelName]);
      }
    }
  }

  PART(conn: ServerConn, channels: string[], reason?: string) {
    // first check if user is actually within each channel
    for (const channelName of channels) {
      const isInChannel = conn.joinedChannels.has(channelName);
      if (!isInChannel) {
        this._replyToConn(conn, ERR.NOTONCHANNEL, [
          channelName,
          ":You're not on that channel"
        ]);
        return;
      }
    }

    for (const channelName of channels) {
      const channel = conn.joinedChannels.get(channelName);
      // notify users in channel that this person has left
      for (const userConn of channel.users) {
        this._sendMsg(userConn, conn.nickname, "PART", [channelName, reason]);
      }
      channel.leaveChannel(conn);
    }
  }

  PRIVMSG(conn: ServerConn, targets: string[], message: string) {
    for (const target of targets) {
      // TODO(fancyplants) target other channel prefixes
      if (target.startsWith("#")) {
        const channel = this._channels.get(target);
        if (!channel) {
          this._replyToConn(conn, ERR.NOSUCHNICK, [":No such channel"]);
        }

        for (const userConn of channel.users) {
          if (userConn === conn) {
            continue;
          }

          this._sendMsg(userConn, conn.nickname, "PRIVMSG", [
            channel.name,
            message
          ]);
        }
      } else {
        const targetConn = this._conns.get(target);
        if (!targetConn) {
          this._replyToConn(conn, ERR.NOSUCHNICK, [":No such nick"]);
          continue;
        }
        this._sendMsg(targetConn, conn.nickname, "PRIVMSG", [
          targetConn.nickname,
          message
        ]);
      }
    }
  }

  NAMES(conn: ServerConn, channels: string[]) {
    this._replyToNAMES(conn, channels);
  }

  WHO(conn: ServerConn, channelName: string) {
    const channel = this._channels.get(channelName);
    if (!channel) {
      this._replyToConn(conn, ERR.NOSUCHSERVER, [":No such server"]);
      return;
    }
    for (const userConn of channel.users) {
      this._replyToConn(conn, RPL.WHOREPLY, [
        channelName,
        userConn.username,
        "PLACEHOLDER", // host of user
        this._host,
        userConn.nickname,
        "G",
        `:0 ${userConn.fullname}`
      ]);
    }
    this._replyToConn(conn, RPL.ENDOFWHO, [channelName, ":End of /WHO list"]);
  }

  QUIT(conn: ServerConn, reason = "User has exited server") {
    if (conn.nickname) {
      this._conns.delete(conn.nickname);
    }

    if (conn.id) {
      this._conns.delete(conn.id);
    }

    for (const [name, channel] of conn.joinedChannels) {
      channel.leaveChannel(conn);
      for (const userConn of channel.users) {
        this._sendMsg(userConn, conn.nickname, "PART", [name]);
      }
    }
    for (const [name, userConn] of this._conns) {
      this._sendMsg(userConn, conn.nickname, "QUIT", [`:Quit: ${reason}`]);
    }
  }

  MODE(conn: ServerConn, target: string) {
    if (target.startsWith("#") || target.startsWith("&")) {
      const channel = this._channels.get(target);
      if (!channel) {
        this._replyToConn(conn, ERR.NOSUCHCHANNEL, [":No such channel"]);
        return;
      }

      this._replyToConn(conn, RPL.CHANNELMODEIS, [
        target,
        `+c${channel.modes.join("")}`
      ]);
    } else {
      // TODO
    }
  }

  PING(conn: ServerConn) {
    this._replyToConn(conn, "PONG", []);
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

function parseCSV(input: string) {
  return input ? input.split(",").filter(channel => channel !== "") : [];
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
  public joinedChannels: Map<string, Channel> = new Map();
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
    return this._conn.write(encoded);
  }

  /** Flushes buffered writes into underlying connection */
  flush() {
    return this._writer.flush();
  }

  close() {
    this._conn.close();
  }

  get addr() {
    return this._conn.remoteAddr;
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
  public topic: string;

  private _modes: Set<ChannelMode> = new Set();
  private _ops: Set<ServerConn> = new Set();
  private _users: Set<ServerConn> = new Set();

  constructor(name: string) {
    this.name = name;
  }

  joinChannel(conn: ServerConn) {
    if (this._users.size === 0) {
      this._ops.add(conn);
    }
    this._users.add(conn);
    conn.joinedChannels.set(this.name, this);
  }

  leaveChannel(conn: ServerConn) {
    this._users.delete(conn);
    conn.joinedChannels.delete(this.name);
    if (this._users.size === 0) {
      this._ops.delete(conn);
    }
  }

  get users() {
    return Array.from(this._users);
  }

  get ops() {
    return Array.from(this._ops);
  }

  get modes() {
    return Array.from(this._modes);
  }
}
