// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Builds an in-memory XML document tree from a string.
 *
 * @module
 */

import type { ParseOptions, XmlDocument, XmlElement } from "./types.ts";
import { parseSync } from "./_parse_sync.ts";

export type { ParseOptions } from "./types.ts";

/**
 * Parses an XML string into a document tree.
 *
 * @example Basic usage
 * ```ts
 * import { parse } from "@std/xml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = `<product id="123"><name>Widget</name></product>`;
 * const doc = parse(xml);
 *
 * assertEquals(doc.root.name.local, "product");
 * assertEquals(doc.root.attributes["id"], "123");
 * ```
 *
 * @example With nested elements
 * ```ts
 * import { parse } from "@std/xml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = `<root><child>text</child></root>`;
 * const doc = parse(xml);
 *
 * assertEquals(doc.root.children.length, 1);
 * if (doc.root.children[0]?.type === "element") {
 *   assertEquals(doc.root.children[0].name.local, "child");
 * }
 * ```
 *
 * @example Ignoring whitespace
 * ```ts
 * import { parse } from "@std/xml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const xml = `<root>
 *   <item/>
 * </root>`;
 * const doc = parse(xml, { ignoreWhitespace: true });
 *
 * // Whitespace-only text nodes are removed
 * assertEquals(doc.root.children.length, 1);
 * ```
 *
 * @param xml The XML string to parse.
 * @param options Options to control parsing behavior.
 * @returns The parsed document.
 * @throws {XmlSyntaxError} If the XML is malformed or has no root element.
 */
export function parse(xml: string, options?: ParseOptions): XmlDocument {
  return parseSync(xml, options);
}

/**
 * Finds the first child element with the given local name.
 *
 * @example Usage
 * ```ts
 * import { parse, findElement } from "@std/xml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const doc = parse("<root><item id='1'/><item id='2'/></root>");
 * const item = findElement(doc.root, "item");
 * assertEquals(item?.attributes["id"], "1");
 * ```
 *
 * @param element The parent element to search within.
 * @param name The local name to search for.
 * @returns The first matching element, or undefined if not found.
 */
export function findElement(
  element: XmlElement,
  name: string,
): XmlElement | undefined {
  for (const child of element.children) {
    if (child.type === "element" && child.name.local === name) {
      return child;
    }
  }
  return undefined;
}

/**
 * Finds all child elements with the given local name.
 *
 * @example Usage
 * ```ts
 * import { parse, findElements } from "@std/xml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const doc = parse("<root><item/><item/><other/></root>");
 * const items = findElements(doc.root, "item");
 * assertEquals(items.length, 2);
 * ```
 *
 * @param element The parent element to search within.
 * @param name The local name to search for.
 * @returns An array of matching elements.
 */
export function findElements(
  element: XmlElement,
  name: string,
): readonly XmlElement[] {
  return element.children.filter(
    (child): child is XmlElement =>
      child.type === "element" && child.name.local === name,
  );
}

/**
 * Gets the concatenated text content of an element (recursive).
 *
 * Includes text from nested elements, text nodes, and CDATA sections.
 *
 * @example Usage
 * ```ts
 * import { parse, getText } from "@std/xml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const doc = parse("<root>Hello <b>World</b>!</root>");
 * assertEquals(getText(doc.root), "Hello World!");
 * ```
 *
 * @param element The element to get text content from.
 * @returns The concatenated text content.
 */
export function getText(element: XmlElement): string {
  let result = "";
  for (const child of element.children) {
    if (child.type === "text" || child.type === "cdata") {
      result += child.text;
    } else if (child.type === "element") {
      result += getText(child);
    }
  }
  return result;
}

/**
 * Gets an attribute value from an element by local name.
 *
 * @example Usage
 * ```ts
 * import { parse, getAttribute } from "@std/xml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const doc = parse('<root id="123" class="main"/>');
 * assertEquals(getAttribute(doc.root, "id"), "123");
 * assertEquals(getAttribute(doc.root, "missing"), undefined);
 * ```
 *
 * @param element The element to get the attribute from.
 * @param name The local name of the attribute.
 * @returns The attribute value, or undefined if not found.
 */
export function getAttribute(
  element: XmlElement,
  name: string,
): string | undefined {
  return element.attributes[name];
}
