// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * XML serialization module.
 *
 * @module
 */

import type {
  StringifyOptions,
  XmlDeclarationEvent,
  XmlDocument,
  XmlElement,
  XmlNode,
} from "./types.ts";
import { encodeAttributeValue, encodeEntities } from "./_entities.ts";

export type { StringifyOptions } from "./types.ts";

/**
 * Converts an XML document or element to an XML string.
 *
 * @example Usage
 * ```ts
 * import { stringify } from "@std/xml/stringify";
 * import { assertEquals } from "@std/assert";
 *
 * const element = {
 *   type: "element" as const,
 *   name: { raw: "root", local: "root" },
 *   attributes: {},
 *   children: [{ type: "text" as const, text: "Hello!" }],
 * };
 *
 * assertEquals(stringify(element), "<root>Hello!</root>");
 * ```
 *
 * @param node The XML document or element to serialize.
 * @param options Options to control serialization behavior.
 * @returns The serialized XML string.
 */
export function stringify(
  node: XmlDocument | XmlElement,
  options?: StringifyOptions,
): string {
  const { indent, declaration = true } = options ?? {};

  // Check if it's a document (has 'root' property) or an element
  if ("root" in node) {
    let result = "";
    if (declaration && node.declaration) {
      result += serializeDeclaration(node.declaration);
      if (indent !== undefined) {
        result += "\n";
      }
    }
    result += serializeElement(node.root, indent, 0);
    return result;
  }

  // It's an element
  return serializeElement(node, indent, 0);
}

/** Serializes an XML declaration to a string. */
function serializeDeclaration(decl: XmlDeclarationEvent): string {
  const encoding = decl.encoding !== undefined
    ? ` encoding="${decl.encoding}"`
    : "";
  const standalone = decl.standalone !== undefined
    ? ` standalone="${decl.standalone}"`
    : "";
  return `<?xml version="${decl.version}"${encoding}${standalone}?>`;
}

/**
 * Creates a memoized indent getter to avoid recomputing indent.repeat(depth).
 */
function createIndentCache(
  indent: string | undefined,
): (depth: number) => string {
  if (indent === undefined) return () => "";
  const cache: string[] = [""];
  return (depth: number): string => (cache[depth] ??= indent.repeat(depth));
}

/**
 * Serializes an XML element and its children to a string.
 */
function serializeElement(
  element: XmlElement,
  indent: string | undefined,
  depth: number,
  getIndent?: (depth: number) => string,
): string {
  // Initialize indent cache on first call
  const indentFn = getIndent ?? createIndentCache(indent);
  const prefix = indentFn(depth);
  const newline = indent !== undefined ? "\n" : "";

  // Build tag name (with optional namespace prefix)
  const tagName = element.name.prefix
    ? `${element.name.prefix}:${element.name.local}`
    : element.name.local;

  // Build attributes string
  let attrsStr = "";
  for (const [name, value] of Object.entries(element.attributes)) {
    attrsStr += ` ${name}="${encodeAttributeValue(value)}"`;
  }

  // Self-closing tag if no children
  if (element.children.length === 0) {
    return `${prefix}<${tagName}${attrsStr}/>`;
  }

  // Check if all children are inline content (text or cdata only)
  const hasOnlyInlineContent = element.children.every(
    (child) => child.type === "text" || child.type === "cdata",
  );

  if (hasOnlyInlineContent) {
    // Inline: <tag>content</tag> (no indentation for content)
    const content = element.children
      .map((child) => serializeNode(child, undefined, 0, indentFn))
      .join("");
    return `${prefix}<${tagName}${attrsStr}>${content}</${tagName}>`;
  }

  // Block: children on separate lines (when indenting)
  const childContent = element.children
    .map((child) => serializeNode(child, indent, depth + 1, indentFn))
    .join(newline);

  return `${prefix}<${tagName}${attrsStr}>${newline}${childContent}${newline}${prefix}</${tagName}>`;
}

/**
 * Serializes any XML node to a string.
 */
function serializeNode(
  node: XmlNode,
  indent: string | undefined,
  depth: number,
  getIndent: (depth: number) => string,
): string {
  switch (node.type) {
    case "element":
      return serializeElement(node, indent, depth, getIndent);
    case "text":
      return encodeEntities(node.text);
    case "cdata":
      return serializeCData(node.text);
    case "comment": {
      const prefix = getIndent(depth);
      return `${prefix}<!--${validateCommentText(node.text)}-->`;
    }
  }
}

/**
 * Serializes CDATA content, escaping any `]]>` sequences.
 *
 * Per XML 1.0 §2.7, CDATA sections cannot contain `]]>`.
 * The standard approach is to split at each occurrence:
 * `a]]>b` becomes `<![CDATA[a]]]]><![CDATA[>b]]>`
 */
function serializeCData(text: string): string {
  // Fast path: no ]]> means no escaping needed
  if (!text.includes("]]>")) {
    return `<![CDATA[${text}]]>`;
  }

  // Replace each ]]> with ]]]]><![CDATA[>
  // This ends the current CDATA at ]] and starts a new one with >
  const escaped = text.replaceAll("]]>", "]]]]><![CDATA[>");
  return `<![CDATA[${escaped}]]>`;
}

/**
 * Validates comment text per XML 1.0 §2.5: cannot contain `--` or end with `-`.
 * @throws {TypeError} If the comment text contains invalid sequences.
 */
function validateCommentText(text: string): string {
  if (text.includes("--")) {
    throw new TypeError(
      `Invalid comment: contains "--" which is forbidden in XML comments`,
    );
  }
  if (text.endsWith("-")) {
    throw new TypeError(
      `Invalid comment: ends with "-" which would produce invalid "--->"`,
    );
  }
  return text;
}
