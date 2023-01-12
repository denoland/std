// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import assert from "../assert.mjs";
import { _createSocketHandle } from "../dgram.ts";
import type { Message, Worker } from "./types.ts";

// deno-lint-ignore no-var no-explicit-any
var SharedHandle: any;

// Lazily initializes the actual SharedHandle class.
// This trick is necessary for avoiding circular dependencies between
// net and cluster modules.
// deno-lint-ignore no-explicit-any
export function initSharedHandle(_createServerHandle: any) {
  if (SharedHandle) {
    return;
  }

  SharedHandle = class SharedHandle {
    key: string;
    workers: Map<number, Worker>;
    // deno-lint-ignore no-explicit-any
    handle: any = null;
    errno = 0;

    constructor(
      key: string,
      address: string,
      { port, addressType, fd, flags }: Message,
    ) {
      this.key = key;
      this.workers = new Map();
      this.handle = null;
      this.errno = 0;

      let rval;

      if (addressType === "udp4" || addressType === "udp6") {
        rval = _createSocketHandle(address, port!, addressType, fd!, flags!);
      } else {
        rval = _createServerHandle(
          address,
          port!,
          addressType as number,
          fd,
          flags,
        );
      }

      if (typeof rval === "number") {
        this.errno = rval;
      } else {
        this.handle = rval;
      }
    }

    add(
      worker: Worker,
      send: (
        errno: number,
        reply: Record<string, unknown> | null,
        // deno-lint-ignore no-explicit-any
        handle: any,
      ) => void,
    ) {
      assert(!this.workers.has(worker.id));
      this.workers.set(worker.id, worker);
      send(this.errno, null, this.handle!);
    }

    remove(worker: Worker) {
      if (!this.workers.has(worker.id)) {
        return false;
      }

      this.workers.delete(worker.id);

      if (this.workers.size !== 0) {
        return false;
      }

      this.handle!.close();
      this.handle = null;

      return true;
    }
  };
}

export { SharedHandle as default };
