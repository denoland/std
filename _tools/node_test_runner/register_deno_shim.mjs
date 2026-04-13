// Copyright 2018-2026 the Deno authors. MIT license.

import { Deno, testDefinitions } from "@deno/shim-deno-test";
import { register } from "node:module";

register(new URL("deno_compat_hooks.mjs", import.meta.url));

// Caches @std/path module before polyfilling globalThis.Deno
await import("@std/path");

globalThis.Deno = Deno;
globalThis.testDefinitions = testDefinitions;
