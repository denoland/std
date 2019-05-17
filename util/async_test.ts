// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, runIfMain } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { Channel, deferred } from "./async.ts";

test(async function asyncDeferred(): Promise<void> {
  const d = deferred<number>();
  d.resolve(12);
});

async function send3(channel: Channel<number>): Promise<void> {
  await channel.send(1);
  await channel.send(2);
  await channel.send(3);
}

test(async function asyncChannel(): Promise<void> {
  const channel = new Channel<number>();
  send3(channel);

  assertEquals(1, await channel.recv());
  assertEquals(2, await channel.recv());
  assertEquals(3, await channel.recv());
  let _lastPromise = channel.recv();
});

runIfMain(import.meta);
