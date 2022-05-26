// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import type { Worker as IWorker, WorkerOptions } from "./types.ts";
import { EventEmitter } from "../../events.ts";
import { ChildProcess } from "../child_process.ts";
import { Process } from "../../process.ts";
import { notImplemented } from "../../_utils.ts";

// Common Worker implementation shared between the cluster primary and workers.
export class Worker extends EventEmitter implements IWorker {
  state: string;
  id: number;
  process!: ChildProcess | Process;
  exitedAfterDisconnect?: boolean;

  destroy!: (signal?: string) => void;
  disconnect!: () => void;

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
      this.process.on("error", (code, signal) =>
        this.emit("error", code, signal)
      );
      this.process.on("message", (message, handle) =>
        this.emit("message", message, handle)
      );
    }
  }

  kill(): void {
    return Reflect.apply(this.destroy, this, arguments);
  }

  send(): boolean {
    notImplemented("cluster.Worker.prototype.send");
    // ChildProcess send method not yet implemented.
    // return Reflect.apply(this.process.send, this.process, arguments);
  }

  isDead(): boolean {
    return (
      this.process.exitCode != null ||
      (this.process as ChildProcess).signalCode != null
    );
  }

  isConnected(): boolean {
    notImplemented("cluster.Worker.prototype.isConnected");
    // ChildProcess connection property not yet implemented.
    // return this.process.connected;
  }
}

export default Worker;
