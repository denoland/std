// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// @deno-types="./_events.d.ts"
export {
  captureRejectionSymbol,
  default,
  defaultMaxListeners,
  errorMonitor,
  EventEmitter,
  getEventListeners,
  on,
  once,
} from "./_events.mjs";

/*

import { EventEmitter } from "./_events.mjs";

type ListenerMap = {
  connection: (ws: string, url: string, count: number) => void;
  error: (err: Error) => void;
  close: (reason?: string) => void;
};

class A extends EventEmitter<ListenerMap> {
  test () {
    this.on("asd", () => {}); // TypeError - "asd" is not defined in ListenerMap

    this.on("connection", () => {}); // OK
    this.emit("connection", "ws", "someurl", 3); // OK
    this.emit("connection", "asd"); // Error
    this.emit("connection"); // Error

    this.emit("error", new Error("Message"));
    this.emit("error"); // Error
    
    this.emit("close", "Reason"); // OK
    this.emit("close"); // OK
  }
}

class B extends EventEmitter {
  test () {
    // Everything is OK - fallback to unsafe listener map
    this.on("asd", () => {});

    this.on("connection", () => {});
    this.emit("connection", "ws", "someurl", 3);
    this.emit("connection", "asd");
    this.emit("connection");

    this.emit("error", new Error("Message"));
    this.emit("error");
    
    this.emit("close", "Reason");
    this.emit("close");
  }
}
*/
