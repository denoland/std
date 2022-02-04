#!/usr/bin/env -S deno run --no-check --allow-read --allow-run
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import * as semver from "https://deno.land/x/semver@v1.0.0/mod.ts";
if (semver.lt(Deno.version.deno, "1.18.0")) {
  console.log(
    "This script is deprecated. Upgrade to the latest Deno and run `deno lint` command directly",
  );
} else {
  console.log("This script is deprecated. Run `deno lint` command directly");
}
const p = Deno.run({ cmd: [Deno.execPath(), "lint", "--config", "deno.json"] });
const status = await p.status();
Deno.exit(status.code);
