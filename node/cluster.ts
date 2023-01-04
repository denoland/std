// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { initRoundRobinHandle } from "./internal/cluster/round_robin_handle.ts";
import { initSharedHandle } from "./internal/cluster/shared_handle.ts";
import { cluster } from "./internal/cluster/cluster.ts";
import { _createServerHandle, createServer } from "./net.ts";

// Lazily initializes the cluster *Handle classes.
// This trick is necessary for avoiding circular dependencies between
// net and cluster modules.
initRoundRobinHandle(createServer);
initSharedHandle(_createServerHandle);

export { cluster };

export default { cluster };
