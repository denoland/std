import { assert } from "../testing/asserts.ts";
import { EventEmitter } from "./events.ts";

type ListenerMap = {
  connection: (ws: string, url: string, count: number) => void;
  error: (err: Error) => void;
  close: (reason?: string) => void;
};

class A extends EventEmitter<ListenerMap> {
  test() {
    // @ts-expect-error: test typeguard
    this.on("asd", () => {}); // TypeError - "asd" is not defined in ListenerMap

    this.on("connection", () => {}); // OK
    this.emit("connection", "ws", "someurl", 3); // OK
    this.emit("connection", "asd"); // Deprecated
    this.emit("connection"); // Deprecated

    this.emit("error", new Error("Message"));
    this.emit("error"); // Deprecated

    this.emit("close", "Reason"); // OK
    this.emit("close"); // OK
  }
}

class B extends EventEmitter {
  test() {
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

Deno.test("[node/EventEmitter/typings]", () => {
  assert(new A(), "Process typings for A");
  assert(new B(), "Process typings for B");
});
