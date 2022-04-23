import { assert } from "../testing/asserts.ts";
import { EventEmitter, getEventListeners, on } from "./events.ts";
import type { EventListenerType } from "./events.ts";
import { expectType } from "https://raw.githubusercontent.com/TypeStrong/ts-expect/736658bd9f1c23ad9e2676c27e9bdc9297309ae9/src/index.ts";
import type {
  TypeEqual,
} from "https://raw.githubusercontent.com/TypeStrong/ts-expect/736658bd9f1c23ad9e2676c27e9bdc9297309ae9/src/index.ts";

// TODO: 1. Those tests doesn't do anything, just fail at compile-time when types are broken
//          maybe exclude it to separate task taking <filename>_test_types.ts?
// TODO: 2. Create a module in Deno.text for expecting types:
//          something like this: https://github.com/TypeStrong/ts-expect/blob/736658bd9f1c23ad9e2676c27e9bdc9297309ae9/src/index.ts

type ListenerMap = {
  connection: (ws: "ws", url: "url", count: number) => void;
  error: (err: Error) => void;
  close: (reason?: string) => void;
};

class EventEmitterWithMapping extends EventEmitter<ListenerMap> {
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

class EventEmitterWithoutMapping extends EventEmitter {
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

const withMapping = new EventEmitter<ListenerMap>();
const withoutMapping = new EventEmitter();
const extendedWithMapping = new EventEmitterWithMapping();
const extendedWithoutMapping = new EventEmitterWithoutMapping();

Deno.test("[node/EventEmitter/typings] EventEmitter API", () => {
  assert(withMapping, "Process typings for withMapping");
  assert(withoutMapping, "Process typings for withoutMapping");
});

Deno.test("[node/EventEmitter/typings] module.getEventListeners", () => {
  {
    const _existing = getEventListeners(withMapping, "connection");
    expectType<TypeEqual<ListenerMap["connection"][], typeof _existing>>(true);
    // @ts-expect-error: typeguard test
    const _nonexisting = getEventListeners(withMapping, "doesntexist");
  }

  {
    const _ = getEventListeners(withoutMapping, "doesntexist");
    expectType<TypeEqual<EventListenerType[], typeof _>>(true);
  }

  {
    const _existing = getEventListeners(extendedWithMapping, "connection");
    expectType<TypeEqual<ListenerMap["connection"][], typeof _existing>>(true);
    // @ts-expect-error: typeguard test
    const _nonexisting = getEventListeners(extendedWithMapping, "doesntexist");
  }

  {
    const _ = getEventListeners(extendedWithoutMapping, "doesntexist");
    expectType<TypeEqual<EventListenerType[], typeof _>>(true);
  }
});

Deno.test("[node/EventEmitter/typings] module.on", () => {
  {
    const _existing = on(withMapping, "connection");
    expectType<
      TypeEqual<
        AsyncIterableIterator<Parameters<ListenerMap["connection"]>>,
        typeof _existing
      >
    >(true);
    // @ts-expect-error: typeguard test
    const _nonexisting = on(withMapping, "doesntexist");
  }

  {
    const _ = on(withoutMapping, "doesntexist");
    expectType<
      TypeEqual<AsyncIterableIterator<Parameters<EventListenerType>>, typeof _>
    >(true);
  }

  {
    const _existing = on(extendedWithMapping, "connection");
    expectType<
      TypeEqual<
        AsyncIterableIterator<Parameters<ListenerMap["connection"]>>,
        typeof _existing
      >
    >(true);
    // @ts-expect-error: typeguard test
    const _nonexisting = on(extendedWithMapping, "doesntexist");
  }

  {
    const _ = on(extendedWithoutMapping, "doesntexist");
    expectType<
      TypeEqual<AsyncIterableIterator<Parameters<EventListenerType>>, typeof _>
    >(true);
  }
});
