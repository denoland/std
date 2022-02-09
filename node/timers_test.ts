// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import timers from "./timers.ts";

Deno.test("[node/timers setTimeout]", () => {
  {
    const { clearTimeout, setTimeout } = timers;
    const id = setTimeout(() => {});
    clearTimeout(id);
  }

  {
    const id = timers.setTimeout(() => {});
    timers.clearTimeout(id);
  }
});

Deno.test("[node/timers setInterval]", () => {
  {
    const { clearInterval, setInterval } = timers;
    const id = setInterval(() => {});
    clearInterval(id);
  }

  {
    const id = timers.setInterval(() => {});
    timers.clearInterval(id);
  }
});

Deno.test("[node/timers setImmediate]", () => {
  {
    const { clearImmediate, setImmediate } = timers;
    const id = setImmediate(() => {});
    clearImmediate(id);
  }

  {
    const id = timers.setImmediate(() => {});
    timers.clearImmediate(id);
  }
});
