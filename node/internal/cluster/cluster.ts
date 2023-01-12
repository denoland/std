// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import process from "../../process.ts";
import childCluster from "./child.ts";
import primaryCluster from "./primary.ts";

export const cluster = "NODE_UNIQUE_ID" in process.env
  ? childCluster
  : primaryCluster;

initializeClusterIPC();

// TODO: migrate to process pre-execution module if/when ported.
// See https://github.com/nodejs/node/blob/main/lib/internal/process/pre_execution.js#L507.
function initializeClusterIPC() {
  if (process.env.NODE_UNIQUE_ID) {
    cluster._setupWorker!();
    // Make sure it's not accidentally inherited by child processes.
    delete process.env.NODE_UNIQUE_ID;
  }
}

export default cluster;
