// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  createExtractor,
  type Extractor,
  type Parser,
} from "./_create_extractor.ts";

/**
 * Extracts and parses {@link https://www.json.org/ | JSON } from the metadata
 * of front matter content.
 */
export const extract: Extractor = createExtractor({
  json: JSON.parse as Parser,
});
