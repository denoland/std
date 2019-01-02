// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { Channel } from "./channel.ts";
import { User } from "./user.ts";
import { MessageData } from "./parser.ts";
import { generateID } from "./util.ts";

export class IrcDatabase {
  private _channels: Map<string, Channel> = new Map();

  // maps usernames to user objects
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
