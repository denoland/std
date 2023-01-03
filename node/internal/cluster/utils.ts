// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import type { Message, Worker } from "./types.ts";
import type { Handle } from "../../net.ts";
import type { UDP } from "../../internal_binding/udp_wrap.ts";
import { ChildProcess } from "../child_process.ts";
import { Process } from "../../process.ts";
import { notImplemented } from "../../_utils.ts";

const callbacks = new Map();
let seq = 0;

export function sendHelper(
  proc: ChildProcess | Process,
  message: Message,
  handle?: Handle | UDP | null,
  cb?: unknown,
) {
  // TODO(cmorten): implement required process properties and methods.
  notImplemented("process.connected, process.send");

  // TODO(cmorten): remove type cast once ChildProcess implements `connected`
  // property.
  // deno-lint-ignore no-explicit-any
  if (!(proc as any).connected) {
    return false;
  }

  // Mark message as internal. See INTERNAL_PREFIX
  // in lib/internal/child_process.js
  message = { cmd: "NODE_CLUSTER", ...message, seq };

  if (typeof cb === "function") {
    callbacks.set(seq, cb);
  }

  seq += 1;

  // TODO(cmorten): remove type cast once ChildProcess implements `send`
  // method.
  // deno-lint-ignore no-explicit-any
  return (proc as any).send(message, handle);
}

// Returns an internalMessage listener that hands off normal messages
// to the callback but intercepts and redirects ACK messages.
export function internal(
  worker: Worker,
  cb: (message: Message, handle: Handle | UDP) => void,
) {
  return function onInternalMessage(message: Message, _handle: Handle | UDP) {
    if (message.cmd !== "NODE_CLUSTER") {
      return;
    }

    let fn = cb;

    if (message.ack !== undefined) {
      const callback = callbacks.get(message.ack);

      if (callback !== undefined) {
        fn = callback;
        callbacks.delete(message.ack);
      }
    }

    Reflect.apply(fn, worker, arguments);
  };
}

export default {
  sendHelper,
  internal,
};
