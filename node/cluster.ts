// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import process from "./process.ts";
import childCluster from "./internal/cluster/child.ts";
import primaryCluster from "./internal/cluster/primary.ts";

const cluster = "NODE_UNIQUE_ID" in process.env ? childCluster : primaryCluster;

export default cluster;
