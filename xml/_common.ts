// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal shared utilities for the XML module.
 *
 * @module
 */

import type { XmlName } from "./types.ts";

/**
 * Line ending normalization pattern per XML 1.0 §2.11.
 * Converts \r\n and standalone \r to \n.
 */
export const LINE_ENDING_RE = /\r\n?/g;

/**
 * Whitespace-only test per XML 1.0 §2.3.
 * Uses explicit [ \t\r\n] instead of \s to match XML spec exactly:
 *   S ::= (#x20 | #x9 | #xD | #xA)+
 */
export const WHITESPACE_ONLY_RE = /^[ \t\r\n]*$/;

/**
 * XML declaration version attribute pattern.
 * Matches both single and double quoted values.
 */
export const VERSION_RE = /version\s*=\s*(?:"([^"]+)"|'([^']+)')/;

/**
 * XML declaration encoding attribute pattern.
 * Matches both single and double quoted values.
 */
export const ENCODING_RE = /encoding\s*=\s*(?:"([^"]+)"|'([^']+)')/;

/**
 * XML declaration standalone attribute pattern.
 * Matches both single and double quoted values, restricted to "yes" or "no".
 */
export const STANDALONE_RE = /standalone\s*=\s*(?:"(yes|no)"|'(yes|no)')/;

/**
 * Parses a qualified XML name into its prefix and local parts.
 *
 * @example Usage
 * ```ts
 * import { parseName } from "./_common.ts";
 *
 * parseName("ns:element"); // { prefix: "ns", local: "element" }
 * parseName("element");    // { local: "element" }
 * ```
 *
 * @param name The raw name string (e.g., "ns:element" or "element")
 * @returns An XmlName object with local and optional prefix
 */
export function parseName(name: string): XmlName {
  const colonIndex = name.indexOf(":");
  if (colonIndex === -1) {
    return { local: name };
  }
  return {
    prefix: name.slice(0, colonIndex),
    local: name.slice(colonIndex + 1),
  };
}
