// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { EventEmitter } from "./events.ts";
import { notImplemented } from "./_utils.ts";

const connectionSymbol = Symbol("connectionProperty");
const messageCallbacksSymbol = Symbol("messageCallbacks");
const nextIdSymbol = Symbol("nextId");
const onMessageSymbol = Symbol("onMessage");

class Session extends EventEmitter {
  [connectionSymbol]: null;
  [nextIdSymbol]: number;
  [messageCallbacksSymbol]: Map<string, (e: Error) => void>;

  constructor() {
    super();
    notImplemented();
  }

  /** Connects the session to the inspector back-end. */
  connect() {
    notImplemented();
  }

  /** Connects the session to the main thread
   * inspector back-end. */
  connectToMainThread() {
    notImplemented();
  }

  [onMessageSymbol](_message: string) {
    notImplemented();
  }

  /** Posts a message to the inspector back-end. */
  post(
    _method: string,
    _params?: Record<string, unknown>,
    _callback?: (...args: unknown[]) => void,
  ): void {
    notImplemented();
  }

  /** Immediately closes the session, all pending
   * message callbacks will be called with an
   * error.
   */
  disconnect() {
    notImplemented();
  }
}

/** Activates inspector on host and port.
 * See https://nodejs.org/api/inspector.html#inspectoropenport-host-wait */
function open(_port?: number, _host?: string, _wait?: boolean): void {
  notImplemented();
}

/** Deactivate the inspector. Blocks until there are no active connections.
 * See https://nodejs.org/api/inspector.html#inspectorclose */
function close() {
  notImplemented();
}

/** Return the URL of the active inspector, or undefined if there is none.
 * See https://nodejs.org/api/inspector.html#inspectorurl */
function url() {
  // TODO(kt3k): returns undefined for now, which means the inspector is not activated.
  return undefined;
}

/** Blocks until a client (existing or connected later) has sent Runtime.runIfWaitingForDebugger command.
 * See https://nodejs.org/api/inspector.html#inspectorwaitfordebugger */
function waitForDebugger() {
  notImplemented();
}

const console = globalThis.console;

export { close, console, open, Session, url, waitForDebugger };

export default {
  close,
  console,
  open,
  Session,
  url,
  waitForDebugger,
};
