// Copyright 2018-2025 the Deno authors. MIT license.

import { Deno, testDefinitions } from "@deno/shim-deno-test";
import { register } from "node:module";

register(new URL("deno_compat_hooks.mjs", import.meta.url));

globalThis.Deno = Deno;
globalThis.testDefinitions = testDefinitions;
