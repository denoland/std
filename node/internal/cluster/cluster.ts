// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import process from "../../process.ts";
import childCluster from "./child.ts";
import primaryCluster from "./primary.ts";

const cluster = process.env.NODE_UNIQUE_ID !== undefined
  ? childCluster
  : primaryCluster;

export { cluster };
