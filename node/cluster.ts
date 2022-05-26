// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import process from "./process.ts";

const childOrPrimary = "NODE_UNIQUE_ID" in process.env ? "child" : "primary";

const exports = await import(`internal/cluster/${childOrPrimary}.ts`);

export default exports;
