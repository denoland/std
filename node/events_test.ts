import { assert } from "../testing/asserts.ts";
import { EventEmitter, getEventListeners, on, once } from "./events.ts";
import type { EventListenerT } from "./events.ts";
import { expectType } from "https://raw.githubusercontent.com/TypeStrong/ts-expect/736658bd9f1c23ad9e2676c27e9bdc9297309ae9/src/index.ts";
import type {
  TypeEqual,
} from "https://raw.githubusercontent.com/TypeStrong/ts-expect/736658bd9f1c23ad9e2676c27e9bdc9297309ae9/src/index.ts";

// TODO: 1. Those tests doesn't do anything, just fail at compile-time when types are broken
//          maybe exclude it to separate task taking <filename>_test_types.ts?
// TODO: 2. Create a module in Deno.test for expecting types:
//          Issue link https://github.com/denoland/deno_std/issues/2145
// TODO: 3. Not sure if NodeEventTarget and EventTarget should be tested if they aren't exported - not sure about their use-case

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
    this.emit("connection", "ws", "url", 3); // OK
    // @ts-expect-error: test typeguard
    this.emit("connection", "asd"); // Not enough args
    // @ts-expect-error: test typeguard
    this.emit("connection"); // Not enough args

    this.emit("error", new Error("Message"));
    // @ts-expect-error: test typeguard
    this.emit("error"); // Not enough args

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
    expectType<
      TypeEqual<Promise<Parameters<EventListenerT>>, typeof _>
    >(true);
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
    expectType<
      TypeEqual<Promise<Parameters<EventListenerT>>, typeof _>
    >(true);
  }
});

Deno.test("[node/EventEmitter/typings] EventEmitter.addListener", () => {
  {
    assert(withMapping === withMapping.addListener("connection", () => {}));
    assert(
      withMapping === withMapping.addListener("connection", (a, b, c) => {
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
      withMapping === withMapping.on("connection", (a, b, c) => {
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
      withoutMapping === withoutMapping.on("doesntexist", (a, b, c) => {
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
      withMapping === withMapping.once("connection", (a, b, c) => {
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
      withoutMapping === withoutMapping.once("doesntexist", (a, b, c) => {
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
      withMapping === withMapping.removeListener("connection", (a, b, c) => {
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
      withMapping === withMapping.off("connection", (a, b, c) => {
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
      withoutMapping === withoutMapping.off("doesntexist", (a, b, c) => {
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
    getEventListeners(withMapping, "doesntexist");
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
