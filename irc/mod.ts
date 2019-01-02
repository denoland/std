// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { listen, Listener, Conn } from "deno";
import { User } from "./user.ts";
import { parse, MessageData } from "./parser.ts";
import { IrcDatabase } from "./db.ts";

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
