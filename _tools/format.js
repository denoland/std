#!/usr/bin/env -S deno run --no-check
import * as semver from "https://deno.land/x/semver@v1.0.0/mod.ts";
if (semver.lt(Deno.version.deno, "1.18.0")) {
  console.log("This script is deprecated. Upgrade to the latest Deno and run `deno fmt` command directly");
} else {
  console.log("This script is deprecated. Run `deno fmt` command directly");
}
