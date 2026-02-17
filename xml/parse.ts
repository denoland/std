// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Builds an in-memory XML document tree from a string.
 *
 * @module
 */

import type { ParseOptions, XmlDocument } from "./types.ts";
import { parseSync } from "./_parse_sync.ts";

export type { ParseOptions } from "./types.ts";

/**
 * Parses an XML string into a document tree.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@std/xml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const doc = parse(`<root id="1"><child/></root>`);
 * assertEquals(doc.root.name.local, "root");
 * assertEquals(doc.root.attributes["id"], "1");
 * ```
 *
 * @returns The parsed document.
 * @throws {XmlSyntaxError} If the XML is malformed or has no root element.
 */
export function parse(xml: string, options?: ParseOptions): XmlDocument {
  return parseSync(xml, options);
}
