// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import * as net from "./net.ts";
import { assertEquals } from "../testing/asserts.ts";
import { deferred } from "../async/deferred.ts";

Deno.test("[node/net] close event emits after error event", async () => {
  const socket = net.createConnection(27009, "doesnotexist");
  const events: ("error" | "close")[] = [];
  const errorEmitted = deferred();
  const closeEmitted = deferred();
  socket.once("error", () => {
    events.push("error");
    errorEmitted.resolve();
  });
  socket.once("close", () => {
    events.push("close");
    closeEmitted.resolve();
  });
  await Promise.all([errorEmitted, closeEmitted]);

  // `error` happens before `close`
  assertEquals(events, ["error", "close"]);
});
