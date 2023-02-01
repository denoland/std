// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals, assertObjectMatch } from "../testing/asserts.ts";
import { fromFileUrl, relative } from "../path/mod.ts";
import { EventEmitter, once } from "./events.ts";
import * as workerThreads from "./worker_threads.ts";

Deno.test({
  name: "[worker_threads] isMainThread",
  ignore: true,
  fn() {
    assertEquals(workerThreads.isMainThread, true);
  },
});

Deno.test({
  name: "[worker_threads] threadId",
  ignore: true,
  fn() {
    assertEquals(workerThreads.threadId, 0);
  },
});

Deno.test({
  name: "[worker_threads] resourceLimits",
  ignore: true,
  fn() {
    assertObjectMatch(workerThreads.resourceLimits, {});
  },
});

Deno.test({
  name: "[worker_threads] parentPort",
  ignore: true,
  fn() {
    assertEquals(workerThreads.parentPort, null);
  },
});

Deno.test({
  name: "[worker_threads] workerData",
  ignore: true,
  fn() {
    assertEquals(workerThreads.workerData, null);
  },
});

Deno.test({
  name: "[worker_threads] setEnvironmentData / getEnvironmentData",
  ignore: true,
  fn() {
    workerThreads.setEnvironmentData("test", "test");
    assertEquals(workerThreads.getEnvironmentData("test"), "test");
    // delete
    workerThreads.setEnvironmentData("test");
    assertEquals(workerThreads.getEnvironmentData("test"), undefined);
  },
});

Deno.test({
  name: "[worker_threads] Worker threadId",
  ignore: true,
  async fn() {
    const worker = new workerThreads.Worker(
      new URL("./testdata/worker_threads.ts", import.meta.url),
    );
    worker.postMessage("Hello, how are you my thread?");
    await once(worker, "message");
    assertEquals((await once(worker, "message"))[0].threadId, 1);
    worker.terminate();

    const worker1 = new workerThreads.Worker(
      new URL("./testdata/worker_threads.ts", import.meta.url),
    );
    worker1.postMessage("Hello, how are you my thread?");
    await once(worker1, "message");
    assertEquals((await once(worker1, "message"))[0].threadId, 2);
    worker1.terminate();
  },
});

Deno.test({
  name: "[worker_threads] Worker basics",
  ignore: true,
  async fn() {
    workerThreads.setEnvironmentData("test", "test");
    workerThreads.setEnvironmentData(1, {
      test: "random",
      random: "test",
    });
    const { port1 } = new MessageChannel();
    const worker = new workerThreads.Worker(
      new URL("./testdata/worker_threads.ts", import.meta.url),
      {
        workerData: ["hey", true, false, 2, port1],
        transferList: [port1],
      },
    );
    worker.postMessage("Hello, how are you my thread?");
    assertEquals((await once(worker, "message"))[0], "I'm fine!");
    const data = (await once(worker, "message"))[0];
    // data.threadId can be 1 when this test is runned individually
    if (data.threadId === 1) data.threadId = 3;
    assertObjectMatch(data, {
      isMainThread: false,
      threadId: 3,
      workerData: ["hey", true, false, 2],
      envData: ["test", { test: "random", random: "test" }],
    });
    worker.terminate();
  },
  sanitizeResources: false,
});

const workerThreadsURL = JSON.stringify(
  new URL("./worker_threads.ts", import.meta.url).toString(),
);

Deno.test({
  name: "[worker_threads] Worker eval",
  ignore: true,
  async fn() {
    const worker = new workerThreads.Worker(
      `
      import { parentPort } from ${workerThreadsURL};
      parentPort.postMessage("It works!");
      `,
      {
        eval: true,
      },
    );
    assertEquals((await once(worker, "message"))[0], "It works!");
    worker.terminate();
  },
});

Deno.test({
  name: "[worker_threads] inheritences",
  ignore: true,
  async fn() {
    const eventsURL = JSON.stringify(
      new URL("./events.ts", import.meta.url).toString(),
    );

    const worker = new workerThreads.Worker(
      `
      import { EventEmitter } from ${eventsURL};
      import { parentPort } from ${workerThreadsURL};
      parentPort.postMessage(parentPort instanceof EventTarget);
      parentPort.postMessage(parentPort instanceof EventEmitter);
      `,
      {
        eval: true,
      },
    );
    assertEquals((await once(worker, "message"))[0], true);
    assertEquals((await once(worker, "message"))[0], false);
    assert(worker instanceof EventEmitter);
    assert(!(worker instanceof EventTarget));
    worker.terminate();
  },
});

Deno.test({
  name: "[worker_threads] Worker workerData",
  ignore: true,
  async fn() {
    const worker = new workerThreads.Worker(
      new URL("./testdata/worker_threads.ts", import.meta.url),
      {
        workerData: null,
      },
    );
    worker.postMessage("Hello, how are you my thread?");
    await once(worker, "message");
    assertEquals((await once(worker, "message"))[0].workerData, null);
    worker.terminate();

    const worker1 = new workerThreads.Worker(
      new URL("./testdata/worker_threads.ts", import.meta.url),
    );
    worker1.postMessage("Hello, how are you my thread?");
    await once(worker1, "message");
    assertEquals((await once(worker1, "message"))[0].workerData, undefined);
    worker1.terminate();
  },
});

Deno.test({
  name: "[worker_threads] Worker with relative path",
  ignore: true,
  async fn() {
    const worker = new workerThreads.Worker(relative(
      Deno.cwd(),
      fromFileUrl(new URL("./testdata/worker_threads.ts", import.meta.url)),
    ));
    worker.postMessage("Hello, how are you my thread?");
    assertEquals((await once(worker, "message"))[0], "I'm fine!");
    worker.terminate();
  },
});
