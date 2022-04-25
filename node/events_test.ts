import { assert } from "../testing/asserts.ts";
import { EventEmitter, getEventListeners, on, once } from "./events.ts";
import { assertCallbackErrorUncaught } from "./_utils.ts";
import type { EventListenerT } from "./events.ts";
import { expectType } from "https://raw.githubusercontent.com/TypeStrong/ts-expect/736658bd9f1c23ad9e2676c27e9bdc9297309ae9/src/index.ts";
import type { TypeEqual } from "https://raw.githubusercontent.com/TypeStrong/ts-expect/736658bd9f1c23ad9e2676c27e9bdc9297309ae9/src/index.ts";

// TODO: 1. Those tests don't do much while running tests, they aren't testing the implementation but types added on top
//          of mjs code, so their focus is to fail at compile-time when types are invalid
//          Maybe exclude it to separate task taking <filename>_test_types.ts?
// TODO: 2. Create a module in Deno.test for expecting types:
//          Issue link https://github.com/denoland/deno_std/issues/2145
// TODO: 3. Not sure if NodeEventTarget and EventTarget should be tested if they aren't exported - not sure about their use-case

type ListenerMap = {
  connection: (ws: "ws", url: "url", count: number) => void;
  error: (err: Error) => void;
  close: (reason?: string) => void;
};

class EventEmitterWithMapping extends EventEmitter<ListenerMap> {
  async test() {
    // @ts-expect-error: test typeguard
    this.on("asd", () => {}); // TypeError - "asd" is not defined in ListenerMap

    this.on("connection", () => {}); // OK
    this.emit("connection", "ws", "url", 3); // OK
    // @ts-expect-error: test typeguard
    this.emit("connection", "asd"); // Not enough args
    // @ts-expect-error: test typeguard
    this.emit("connection"); // Not enough args

    await assertCallbackErrorUncaught({
      invocation: `this.emit("error", new Error("Message"))`,
    });
    // @ts-expect-error: test typeguard
    this.emit("error"); // Not enough args

    this.emit("close", "Reason"); // OK
    this.emit("close"); // OK
  }
}

class EventEmitterWithoutMapping extends EventEmitter {
  async test() {
    // Everything is OK - fallback to unsafe listener map
    this.on("asd", () => {});
    this.on("connection", () => {});
    this.emit("connection", "ws", "someurl", 3);
    this.emit("connection", "asd");
    this.emit("connection");

    await assertCallbackErrorUncaught({
      invocation: `this.emit("error", new Error("Message"))`,
    });
    this.emit("error");

    this.emit("close", "Reason");
    this.emit("close");
  }
}

const withMapping = new EventEmitter<ListenerMap>();
withMapping.setMaxListeners(1000);
const withoutMapping = new EventEmitter();
withoutMapping.setMaxListeners(1000);
const extendedWithMapping = new EventEmitterWithMapping();
extendedWithMapping.setMaxListeners(1000);
const extendedWithoutMapping = new EventEmitterWithoutMapping();
extendedWithoutMapping.setMaxListeners(1000);

Deno.test("[node/EventEmitter/typings] EventEmitter API", () => {
  assert(withMapping, "Process typings for withMapping");
  assert(withoutMapping, "Process typings for withoutMapping");
});

Deno.test("[node/EventEmitter/typings] module.getEventListeners", () => {
  {
    const _existing = getEventListeners(withMapping, "connection");
    expectType<TypeEqual<ListenerMap["connection"][], typeof _existing>>(true);
    // @ts-expect-error: typeguard test
    getEventListeners(withMapping, "doesntexist");
  }

  {
    const _ = getEventListeners(withoutMapping, "doesntexist");
    expectType<TypeEqual<EventListenerT[], typeof _>>(true);
  }

  {
    const _existing = getEventListeners(extendedWithMapping, "connection");
    expectType<TypeEqual<ListenerMap["connection"][], typeof _existing>>(true);
    // @ts-expect-error: typeguard test
    getEventListeners(extendedWithMapping, "doesntexist");
  }

  {
    const _ = getEventListeners(extendedWithoutMapping, "doesntexist");
    expectType<TypeEqual<EventListenerT[], typeof _>>(true);
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
    on(withMapping, "doesntexist");
  }

  {
    const _ = on(withoutMapping, "doesntexist");
    expectType<
      TypeEqual<AsyncIterableIterator<Parameters<EventListenerT>>, typeof _>
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
    on(extendedWithMapping, "doesntexist");
  }

  {
    const _ = on(extendedWithoutMapping, "doesntexist");
    expectType<
      TypeEqual<AsyncIterableIterator<Parameters<EventListenerT>>, typeof _>
    >(true);
  }
});

Deno.test("[node/EventEmitter/typings] module.once", () => {
  {
    const _existing = once(withMapping, "connection");
    expectType<
      TypeEqual<
        Promise<Parameters<ListenerMap["connection"]>>,
        typeof _existing
      >
    >(true);
    // @ts-expect-error: typeguard test
    once(withMapping, "doesntexist");
  }

  {
    const _ = once(withoutMapping, "doesntexist");
    expectType<TypeEqual<Promise<Parameters<EventListenerT>>, typeof _>>(true);
  }

  {
    const _existing = once(extendedWithMapping, "connection");
    expectType<
      TypeEqual<
        Promise<Parameters<ListenerMap["connection"]>>,
        typeof _existing
      >
    >(true);
    // @ts-expect-error: typeguard test
    once(extendedWithMapping, "doesntexist");
  }

  {
    const _ = once(extendedWithoutMapping, "doesntexist");
    expectType<TypeEqual<Promise<Parameters<EventListenerT>>, typeof _>>(true);
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.addListener", () => {
  {
    assert(withMapping === withMapping.addListener("connection", () => {}));
    assert(
      withMapping ===
        withMapping.addListener("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    // @ts-expect-error: typeguard test
    withMapping.addListener("connection", (ws, url, count, doesntexist) => {
      [ws, url, count, doesntexist];
    });

    // @ts-expect-error: typeguard test
    withMapping.addListener("doesntexist", () => {});
  }

  {
    assert(
      withoutMapping === withoutMapping.addListener("doesntexist", () => {}),
    );
    assert(
      withoutMapping ===
        withoutMapping.addListener("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      withoutMapping ===
        withoutMapping.addListener(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }

  {
    assert(
      extendedWithMapping ===
        extendedWithMapping.addListener("connection", () => {}),
    );
    assert(
      extendedWithMapping ===
        extendedWithMapping.addListener("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    extendedWithMapping.addListener(
      "connection",
      // @ts-expect-error: typeguard test
      (ws, url, count, doesntexist) => {
        [ws, url, count, doesntexist];
      },
    );

    // @ts-expect-error: typeguard test
    extendedWithMapping.addListener("doesntexist", () => {});
  }

  {
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.addListener("doesntexist", () => {}),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.addListener("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.addListener(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.on", () => {
  {
    assert(withMapping === withMapping.on("connection", () => {}));
    assert(
      withMapping ===
        withMapping.on("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    // @ts-expect-error: typeguard test
    withMapping.on("connection", (ws, url, count, doesntexist) => {
      [ws, url, count, doesntexist];
    });

    // @ts-expect-error: typeguard test
    withMapping.on("doesntexist", () => {});
  }

  {
    assert(withoutMapping === withoutMapping.on("doesntexist", () => {}));
    assert(
      withoutMapping ===
        withoutMapping.on("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      withoutMapping ===
        withoutMapping.on("doesntexist", (ws, url, count, doesntexist) => {
          [ws, url, count, doesntexist];
        }),
    );
  }

  {
    assert(
      extendedWithMapping === extendedWithMapping.on("connection", () => {}),
    );
    assert(
      extendedWithMapping ===
        extendedWithMapping.on("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    // @ts-expect-error: typeguard test
    extendedWithMapping.on("connection", (ws, url, count, doesntexist) => {
      [ws, url, count, doesntexist];
    });

    // @ts-expect-error: typeguard test
    extendedWithMapping.on("doesntexist", () => {});
  }

  {
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.on("doesntexist", () => {}),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.on("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.on(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.once", () => {
  {
    assert(withMapping === withMapping.once("connection", () => {}));
    assert(
      withMapping ===
        withMapping.once("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    // @ts-expect-error: typeguard test
    withMapping.once("connection", (ws, url, count, doesntexist) => {
      [ws, url, count, doesntexist];
    });

    // @ts-expect-error: typeguard test
    withMapping.once("doesntexist", () => {});
  }

  {
    assert(withoutMapping === withoutMapping.once("doesntexist", () => {}));
    assert(
      withoutMapping ===
        withoutMapping.once("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      withoutMapping ===
        withoutMapping.once("doesntexist", (ws, url, count, doesntexist) => {
          [ws, url, count, doesntexist];
        }),
    );
  }

  {
    assert(
      extendedWithMapping === extendedWithMapping.once("connection", () => {}),
    );
    assert(
      extendedWithMapping ===
        extendedWithMapping.once("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    // @ts-expect-error: typeguard test
    extendedWithMapping.once("connection", (ws, url, count, doesntexist) => {
      [ws, url, count, doesntexist];
    });

    // @ts-expect-error: typeguard test
    extendedWithMapping.once("doesntexist", () => {});
  }

  {
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.once("doesntexist", () => {}),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.once("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.once(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.removeListener", () => {
  {
    assert(withMapping === withMapping.removeListener("connection", () => {}));
    assert(
      withMapping ===
        withMapping.removeListener("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    withMapping.removeListener(
      "connection",
      // @ts-expect-error: typeguard test
      (ws, url, count, doesntexist) => {
        [ws, url, count, doesntexist];
      },
    );

    // @ts-expect-error: typeguard test
    withMapping.removeListener("doesntexist", () => {});
  }

  {
    assert(
      withoutMapping === withoutMapping.removeListener("doesntexist", () => {}),
    );
    assert(
      withoutMapping ===
        withoutMapping.removeListener("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      withoutMapping ===
        withoutMapping.removeListener(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }

  {
    assert(
      extendedWithMapping ===
        extendedWithMapping.removeListener("connection", () => {}),
    );
    assert(
      extendedWithMapping ===
        extendedWithMapping.removeListener("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    extendedWithMapping.removeListener(
      "connection",
      // @ts-expect-error: typeguard test
      (ws, url, count, doesntexist) => {
        [ws, url, count, doesntexist];
      },
    );

    // @ts-expect-error: typeguard test
    extendedWithMapping.removeListener("doesntexist", () => {});
  }

  {
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.removeListener("doesntexist", () => {}),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.removeListener("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.removeListener(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.off", () => {
  {
    assert(withMapping === withMapping.off("connection", () => {}));
    assert(
      withMapping ===
        withMapping.off("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    // @ts-expect-error: typeguard test
    withMapping.off("connection", (ws, url, count, doesntexist) => {
      [ws, url, count, doesntexist];
    });

    // @ts-expect-error: typeguard test
    withMapping.off("doesntexist", () => {});
  }

  {
    assert(withoutMapping === withoutMapping.off("doesntexist", () => {}));
    assert(
      withoutMapping ===
        withoutMapping.off("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      withoutMapping ===
        withoutMapping.off("doesntexist", (ws, url, count, doesntexist) => {
          [ws, url, count, doesntexist];
        }),
    );
  }

  {
    assert(
      extendedWithMapping === extendedWithMapping.off("connection", () => {}),
    );
    assert(
      extendedWithMapping ===
        extendedWithMapping.off("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    // @ts-expect-error: typeguard test
    extendedWithMapping.off("connection", (ws, url, count, doesntexist) => {
      [ws, url, count, doesntexist];
    });

    // @ts-expect-error: typeguard test
    extendedWithMapping.off("doesntexist", () => {});
  }

  {
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.off("doesntexist", () => {}),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.off("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.off(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.removeAllListeners", () => {
  {
    assert(withMapping === withMapping.removeAllListeners("connection"));

    // @ts-expect-error: typeguard test
    withMapping.removeAllListeners("doesntexist");
  }

  {
    assert(withoutMapping === withoutMapping.removeAllListeners("doesntexist"));
  }

  {
    assert(
      extendedWithMapping ===
        extendedWithMapping.removeAllListeners("connection"),
    );

    // @ts-expect-error: typeguard test
    extendedWithMapping.removeAllListeners("doesntexist");
  }

  {
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.removeAllListeners("doesntexist"),
    );
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.setMaxListeners", () => {
  {
    assert(withMapping === withMapping.setMaxListeners(99));
  }

  {
    assert(withoutMapping === withoutMapping.setMaxListeners(99));
  }

  {
    assert(extendedWithMapping === extendedWithMapping.setMaxListeners(99));
  }

  {
    assert(
      extendedWithoutMapping === extendedWithoutMapping.setMaxListeners(99),
    );
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.getMaxListeners", () => {
  {
    assert(!!withMapping.getMaxListeners());
  }

  {
    assert(!!withoutMapping.getMaxListeners());
  }

  {
    assert(!!extendedWithMapping.getMaxListeners());
  }

  {
    assert(!!extendedWithoutMapping.getMaxListeners());
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.listeners", () => {
  {
    const _ = withMapping.listeners("connection");
    expectType<TypeEqual<ListenerMap["connection"][], typeof _>>(true);

    const __ = withMapping.listeners("error");
    expectType<TypeEqual<ListenerMap["error"][], typeof __>>(true);

    // @ts-expect-error: typeguard test
    withMapping.listeners(withMapping, "doesntexist");
  }

  {
    const _ = withoutMapping.listeners("doesntexist");
    expectType<TypeEqual<EventListenerT[], typeof _>>(true);
  }

  {
    const _ = extendedWithMapping.listeners("connection");
    expectType<TypeEqual<ListenerMap["connection"][], typeof _>>(true);

    const __ = extendedWithMapping.listeners("error");
    expectType<TypeEqual<ListenerMap["error"][], typeof __>>(true);

    // @ts-expect-error: typeguard test
    extendedWithMapping.listeners("doesntexist");
  }

  {
    const _ = extendedWithoutMapping.listeners("doesntexist");
    expectType<TypeEqual<EventListenerT[], typeof _>>(true);
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.rawListeners", () => {
  {
    const _ = withMapping.rawListeners("connection");
    expectType<TypeEqual<ListenerMap["connection"][], typeof _>>(true);

    const __ = withMapping.rawListeners("error");
    expectType<TypeEqual<ListenerMap["error"][], typeof __>>(true);

    // @ts-expect-error: typeguard test
    withMapping.rawListeners(withMapping, "doesntexist");
  }

  {
    const _ = withoutMapping.rawListeners("doesntexist");
    expectType<TypeEqual<EventListenerT[], typeof _>>(true);
  }

  {
    const _ = extendedWithMapping.rawListeners("connection");
    expectType<TypeEqual<ListenerMap["connection"][], typeof _>>(true);

    const __ = extendedWithMapping.rawListeners("error");
    expectType<TypeEqual<ListenerMap["error"][], typeof __>>(true);

    // @ts-expect-error: typeguard test
    extendedWithMapping.rawListeners("doesntexist");
  }

  {
    const _ = extendedWithoutMapping.rawListeners("doesntexist");
    expectType<TypeEqual<EventListenerT[], typeof _>>(true);
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.emit", () => {
  withMapping.emit("connection", "ws", "url", 3);

  // TODO: Figure out how to do this properly
  // await assertCallbackErrorUncaught({
  //    invocation: `withMapping.emit("error", new Error("Message"));`,
  // });
  withMapping.emit("close", "reason");
  withMapping.emit("close");

  // @ts-expect-error: typeguard test
  withMapping.emit("connection", "ws", "url", 2, "too much");
  // @ts-expect-error: typeguard test
  withMapping.emit("connection", "wrong type");

  withoutMapping.emit("whatever", "wild");
  withoutMapping.emit("");
  // @ts-expect-error: typeguard test
  withoutMapping.emit([]);

  extendedWithMapping.emit("connection", "ws", "url", 3);

  // TODO: Figure out how to do this properly
  // await assertCallbackErrorUncaught({
  //   invocation: `extendedWithMapping.emit("error", new Error("Message"));`,
  // });
  extendedWithMapping.emit("close", "reason");
  extendedWithMapping.emit("close");

  // @ts-expect-error: typeguard test
  extendedWithMapping.emit("connection", "ws", "url", 2, "too much");
  // @ts-expect-error: typeguard test
  extendedWithMapping.emit("connection", "wrong type");

  extendedWithoutMapping.emit("whatever", "wild");
  extendedWithoutMapping.emit("");
  // @ts-expect-error: typeguard test
  extendedWithoutMapping.emit([]);

  assert(true);
});

Deno.test("[node/EventEmitter/typings] EventEmitter.listenerCount", () => {
  withMapping.listenerCount("connection");
  // @ts-expect-error: typeguard test
  withMapping.listenerCount("doesntexist");

  withoutMapping.listenerCount("whatever");
  // @ts-expect-error: typeguard test
  withoutMapping.listenerCount([]);

  extendedWithMapping.listenerCount("connection");
  // @ts-expect-error: typeguard test
  extendedWithMapping.listenerCount([]);

  extendedWithoutMapping.listenerCount("whatever");
  // @ts-expect-error: typeguard test
  extendedWithoutMapping.listenerCount([]);

  assert(true);
});

Deno.test("[node/EventEmitter/typings] EventEmitter.prependListener", () => {
  {
    assert(withMapping === withMapping.prependListener("connection", () => {}));
    assert(
      withMapping ===
        withMapping.prependListener("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    // @ts-expect-error: typeguard test
    withMapping.prependListener("connection", (ws, url, count, doesntexist) => {
      [ws, url, count, doesntexist];
    });

    // @ts-expect-error: typeguard test
    withMapping.prependListener("doesntexist", () => {});
  }

  {
    assert(
      withoutMapping ===
        withoutMapping.prependListener("doesntexist", () => {}),
    );
    assert(
      withoutMapping ===
        withoutMapping.prependListener("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      withoutMapping ===
        withoutMapping.prependListener(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }

  {
    assert(
      extendedWithMapping ===
        extendedWithMapping.prependListener("connection", () => {}),
    );
    assert(
      extendedWithMapping ===
        extendedWithMapping.prependListener("connection", (a, b, c) => {
          [a, b, c];
        }),
    );

    extendedWithMapping.prependListener(
      "connection",
      // @ts-expect-error: typeguard test
      (ws, url, count, doesntexist) => {
        [ws, url, count, doesntexist];
      },
    );

    // @ts-expect-error: typeguard test
    extendedWithMapping.prependListener("doesntexist", () => {});
  }

  {
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.prependListener("doesntexist", () => {}),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.prependListener("doesntexist", (a, b, c) => {
          [a, b, c];
        }),
    );
    assert(
      extendedWithoutMapping ===
        extendedWithoutMapping.prependListener(
          "doesntexist",
          (ws, url, count, doesntexist) => {
            [ws, url, count, doesntexist];
          },
        ),
    );
  }
});

Deno.test(
  "[node/EventEmitter/typings] EventEmitter.prependOnceListener",
  () => {
    {
      assert(
        withMapping === withMapping.prependOnceListener("connection", () => {}),
      );
      assert(
        withMapping ===
          withMapping.prependOnceListener("connection", (a, b, c) => {
            [a, b, c];
          }),
      );

      withMapping.prependOnceListener(
        "connection",
        // @ts-expect-error: typeguard test
        (ws, url, count, doesntexist) => {
          [ws, url, count, doesntexist];
        },
      );

      // @ts-expect-error: typeguard test
      withMapping.prependOnceListener("doesntexist", () => {});
    }

    {
      assert(
        withoutMapping ===
          withoutMapping.prependOnceListener("doesntexist", () => {}),
      );
      assert(
        withoutMapping ===
          withoutMapping.prependOnceListener("doesntexist", (a, b, c) => {
            [a, b, c];
          }),
      );
      assert(
        withoutMapping ===
          withoutMapping.prependOnceListener(
            "doesntexist",
            (ws, url, count, doesntexist) => {
              [ws, url, count, doesntexist];
            },
          ),
      );
    }

    {
      assert(
        extendedWithMapping ===
          extendedWithMapping.prependOnceListener("connection", () => {}),
      );
      assert(
        extendedWithMapping ===
          extendedWithMapping.prependOnceListener("connection", (a, b, c) => {
            [a, b, c];
          }),
      );

      extendedWithMapping.prependOnceListener(
        "connection",
        // @ts-expect-error: typeguard test
        (ws, url, count, doesntexist) => {
          [ws, url, count, doesntexist];
        },
      );

      // @ts-expect-error: typeguard test
      extendedWithMapping.prependOnceListener("doesntexist", () => {});
    }

    {
      assert(
        extendedWithoutMapping ===
          extendedWithoutMapping.prependOnceListener("doesntexist", () => {}),
      );
      assert(
        extendedWithoutMapping ===
          extendedWithoutMapping.prependOnceListener(
            "doesntexist",
            (a, b, c) => {
              [a, b, c];
            },
          ),
      );
      assert(
        extendedWithoutMapping ===
          extendedWithoutMapping.prependOnceListener(
            "doesntexist",
            (ws, url, count, doesntexist) => {
              [ws, url, count, doesntexist];
            },
          ),
      );
    }
  },
);

Deno.test("[node/EventEmitter/typings] EventEmitter.eventNames", () => {
  {
    const _ = withMapping.eventNames();
    expectType<TypeEqual<(keyof ListenerMap)[], typeof _>>(true);
  }

  {
    const _ = withoutMapping.eventNames();
    expectType<TypeEqual<(string | symbol)[], typeof _>>(true);
  }

  {
    const _ = extendedWithMapping.eventNames();
    expectType<TypeEqual<(keyof ListenerMap)[], typeof _>>(true);
  }

  {
    const _ = extendedWithoutMapping.eventNames();
    expectType<TypeEqual<(string | symbol)[], typeof _>>(true);
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.once static", () => {
  {
    const _existing = EventEmitter.once(withMapping, "connection");
    expectType<
      TypeEqual<
        Promise<Parameters<ListenerMap["connection"]>>,
        typeof _existing
      >
    >(true);
    // @ts-expect-error: typeguard test
    EventEmitter.once(withMapping, "doesntexist");
  }

  {
    const _ = EventEmitter.once(withoutMapping, "doesntexist");
    expectType<TypeEqual<Promise<Parameters<EventListenerT>>, typeof _>>(true);
  }

  {
    const _existing = EventEmitter.once(extendedWithMapping, "connection");
    expectType<
      TypeEqual<
        Promise<Parameters<ListenerMap["connection"]>>,
        typeof _existing
      >
    >(true);
    // @ts-expect-error: typeguard test
    EventEmitter.once(extendedWithMapping, "doesntexist");
  }

  {
    const _ = EventEmitter.once(extendedWithoutMapping, "doesntexist");
    expectType<TypeEqual<Promise<Parameters<EventListenerT>>, typeof _>>(true);
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.on static", () => {
  {
    const _existing = EventEmitter.on(withMapping, "connection");
    expectType<
      TypeEqual<
        AsyncIterableIterator<Parameters<ListenerMap["connection"]>>,
        typeof _existing
      >
    >(true);
    // @ts-expect-error: typeguard test
    EventEmitter.on(withMapping, "doesntexist");
  }

  {
    const _ = EventEmitter.on(withoutMapping, "doesntexist");
    expectType<
      TypeEqual<AsyncIterableIterator<Parameters<EventListenerT>>, typeof _>
    >(true);
  }

  {
    const _existing = EventEmitter.on(extendedWithMapping, "connection");
    expectType<
      TypeEqual<
        AsyncIterableIterator<Parameters<ListenerMap["connection"]>>,
        typeof _existing
      >
    >(true);
    // @ts-expect-error: typeguard test
    EventEmitter.on(extendedWithMapping, "doesntexist");
  }

  {
    const _ = EventEmitter.on(extendedWithoutMapping, "doesntexist");
    expectType<
      TypeEqual<AsyncIterableIterator<Parameters<EventListenerT>>, typeof _>
    >(true);
  }
});

Deno.test(
  "[node/EventEmitter/typings] EventEmitter.listenerCount static",
  () => {
    EventEmitter.listenerCount(withMapping, "connection");
    // @ts-expect-error: typeguard test
    EventEmitter.listenerCount(withMapping, "doesntexist");

    EventEmitter.listenerCount(withoutMapping, "whatever");
    // @ts-expect-error: typeguard test
    EventEmitter.listenerCount(withoutMapping, []);

    EventEmitter.listenerCount(extendedWithMapping, "connection");
    // @ts-expect-error: typeguard test
    EventEmitter.listenerCount(extendedWithMapping, []);

    EventEmitter.listenerCount(extendedWithoutMapping, "whatever");
    // @ts-expect-error: typeguard test
    EventEmitter.listenerCount(extendedWithoutMapping, []);

    assert(true);
  },
);

Deno.test(
  "[node/EventEmitter/typings] EventEmitter.getEventListeners static",
  () => {
    {
      const _existing = EventEmitter.getEventListeners(
        withMapping,
        "connection",
      );
      expectType<TypeEqual<ListenerMap["connection"][], typeof _existing>>(
        true,
      );
      // @ts-expect-error: typeguard test
      EventEmitter.getEventListeners(withMapping, "doesntexist");
    }

    {
      const _ = EventEmitter.getEventListeners(withoutMapping, "doesntexist");
      expectType<TypeEqual<EventListenerT[], typeof _>>(true);
    }

    {
      const _existing = EventEmitter.getEventListeners(
        extendedWithMapping,
        "connection",
      );
      expectType<TypeEqual<ListenerMap["connection"][], typeof _existing>>(
        true,
      );
      // @ts-expect-error: typeguard test
      EventEmitter.getEventListeners(extendedWithMapping, "doesntexist");
    }

    {
      const _ = EventEmitter.getEventListeners(
        extendedWithoutMapping,
        "doesntexist",
      );
      expectType<TypeEqual<EventListenerT[], typeof _>>(true);
    }
  },
);
