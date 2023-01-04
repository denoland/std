// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { EventEmitter } from "../../events.ts";
import { ChildProcess } from "../child_process.ts";
import { Process } from "../../process.ts";
import type { Worker as IWorker, WorkerOptions } from "./types.ts";

// Common Worker implementation shared between the cluster primary and workers.
export class Worker extends EventEmitter implements IWorker {
  state: string;
  id: number;
  process!: ChildProcess | Process;
  exitedAfterDisconnect?: boolean;

  destroy(_signal?: string): void {}
  disconnect(): void {}

  constructor(options?: WorkerOptions | null) {
    super();

    if (options === null || typeof options !== "object") {
      options = {};
    }

    this.exitedAfterDisconnect = undefined;

    this.state = options.state || "none";
    this.id = options.id || 0;

    if (options.process) {
      this.process = options.process;
      this.process.on(
        "error",
        (code, signal) => {
          console.log("Worker process error", code);
          this.emit("error", code, signal);
        },
      );
      this.process.on(
        "message",
        (message, handle) => {
          console.log("Worker process message", message);
          this.emit("message", message, handle);
        },
      );
    }
  }

  kill(): void {
    return Reflect.apply(this.destroy, this, arguments);
  }

  send(): boolean {
    // TODO(cmorten): remove type cast once ChildProcess implements `send`
    // method.
    // deno-lint-ignore no-explicit-any
    return Reflect.apply((this.process as any).send, this.process, arguments);
  }

  isDead(): boolean {
    return (
      this.process.exitCode != null ||
      (this.process as ChildProcess).signalCode != null
    );
  }

  isConnected(): boolean {
    // TODO(cmorten): remove type cast once ChildProcess implements `connected`
    // property.
    // deno-lint-ignore no-explicit-any
    return (this.process as any).connected;
  }
}

export { Worker as default };
