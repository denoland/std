// Copyright 2018-2025 the Deno authors. MIT license.

import { checkLicense, type Config } from "license-checker";

export const LICENSE = "Copyright 2018-2025 the Deno authors. MIT license.";

const json: Config = {
  config: [["**/*.{mjs,js,ts,rs}", LICENSE]],
  "ignore": [
    "_tools/node_test_runner/node_modules",
    "_tools\\node_test_runner/node_modules",
    "cli/testdata/",
    "cli\\testdata\\",
    "dotenv/testdata/",
    "dotenv\\testdata\\",
    "fs/testdata/",
    "fs\\testdata\\",
    "http/testdata/",
    "http\\testdata\\",
    "crypto/_wasm/target/",
    "crypto\\_wasm\\target\\",
    "crypto/_wasm/lib/",
    "crypto\\_wasm\\lib\\",
    ".git",
    "docs/**",
    "docs\\**",
    "_tmp/",
    "_tmp\\",
  ],
};

const result = await checkLicense([json], { quiet: true });
if (!result) Deno.exit(1);
