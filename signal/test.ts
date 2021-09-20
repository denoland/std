// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { delay } from "../async/delay.ts";
import { onSignal, signal } from "./mod.ts";
import { isWindows } from "../_util/os.ts";

Deno.test({
  name: "signal() throws when called with empty signals",
  ignore: isWindows,
  fn() {
    assertThrows(
      () => {
        // deno-lint-ignore no-explicit-any
        (signal as any)();
      },
      Error,
      "No signals are given. You need to specify at least one signal to create a signal stream.",
    );
  },
});

Deno.test({
  name: "signal() iterates for multiple signals",
  ignore: isWindows,
  fn: async () => {
    // This prevents the program from exiting.
    const t = setInterval(() => {}, 1000);

    let c = 0;
    const sig = signal(
      "SIGUSR1",
      "SIGUSR2",
      "SIGINT",
    );

    setTimeout(async () => {
      await delay(20);
      Deno.kill(Deno.pid, "SIGINT");
      await delay(20);
      Deno.kill(Deno.pid, "SIGUSR2");
      await delay(20);
      Deno.kill(Deno.pid, "SIGUSR1");
      await delay(20);
      Deno.kill(Deno.pid, "SIGUSR2");
      await delay(20);
      Deno.kill(Deno.pid, "SIGUSR1");
      await delay(20);
      Deno.kill(Deno.pid, "SIGINT");
      await delay(20);
      sig.dispose();
    });

    for await (const _ of sig) {
      c += 1;
    }

    assertEquals(c, 6);

    clearTimeout(t);
  },
});

Deno.test({
  name: "onSignal() registers and disposes of event handler",
  ignore: isWindows,
  async fn() {
    // This prevents the program from exiting.
    const t = setInterval(() => {}, 1000);

    let calledCount = 0;
    const handle = onSignal("SIGINT", () => {
      calledCount++;
    });

    await delay(20);
    Deno.kill(Deno.pid, "SIGINT");
    await delay(20);
    Deno.kill(Deno.pid, "SIGINT");
    await delay(20);
    Deno.kill(Deno.pid, "SIGUSR2");
    await delay(20);
    handle.dispose(); // stop monitoring SIGINT
    await delay(20);
    Deno.kill(Deno.pid, "SIGUSR1");
    await delay(20);
    Deno.kill(Deno.pid, "SIGINT");
    await delay(20);
    assertEquals(calledCount, 2);

    clearTimeout(t);
  },
});
