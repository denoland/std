// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Parser } from "./_create_extractor.ts";
import type { Extractor } from "./types.ts";

export type { Extractor };

/**
 * Extracts and parses {@link https://www.json.org/ | JSON } from the metadata
 * of front matter content.
 */
export const extract: Extractor = createExtractor({
  json: JSON.parse as Parser,
});
