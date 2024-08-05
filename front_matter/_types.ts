// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Extract } from "./types.ts";

/**
 * Supported format for front matter. `"unknown"` is used when auto format
 * detection logic fails.
 */
export type Format = "yaml" | "toml" | "json";

/**
 * Type for function that accepts an input string and returns
 * {@linkcode Extract}.
 */
export type Extractor = <T = Record<string, unknown>>(
  str: string,
) => Extract<T>;
