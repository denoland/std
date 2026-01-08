// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import {
  findElement,
  findElements,
  getAttribute,
  getText,
  parse,
} from "./parse.ts";

// =============================================================================
// DOM Tree Structure (Unique to parse())
// =============================================================================

Deno.test("parse() stores attributes by local name", () => {
  const doc = parse('<root xml:lang="en"/>');

  // Attribute is stored by local name only
  assertEquals(doc.root.attributes["lang"], "en");
});

Deno.test("parse() parses mixed content into tree", () => {
  const doc = parse("<root>text<child/>more</root>");

  assertEquals(doc.root.children.length, 3);
  assertEquals(doc.root.children[0]!.type, "text");
  assertEquals(doc.root.children[1]!.type, "element");
  assertEquals(doc.root.children[2]!.type, "text");
});

Deno.test("parse() handles document without declaration", () => {
  const doc = parse("<root/>");

  assertEquals(doc.declaration, undefined);
});

Deno.test("parse() handles empty text with siblings", () => {
  const doc = parse("<root><a/><b/></root>");

  assertEquals(doc.root.children.length, 2);
  assertEquals(doc.root.children[0]!.type, "element");
  assertEquals(doc.root.children[1]!.type, "element");
});

// =============================================================================
// Error Handling (Unique to parse())
// =============================================================================

Deno.test("parse() throws on empty document", () => {
  assertThrows(
    () => parse(""),
    Error,
    "No root element",
  );
});

// =============================================================================
// findElement()
// =============================================================================

Deno.test("findElement() finds first matching element", () => {
  const doc = parse('<root><item id="1"/><item id="2"/></root>');
  const item = findElement(doc.root, "item");

  assertEquals(item?.name.local, "item");
  assertEquals(item?.attributes["id"], "1");
});

Deno.test("findElement() returns undefined if not found", () => {
  const doc = parse("<root><other/></root>");
  const item = findElement(doc.root, "item");

  assertEquals(item, undefined);
});

Deno.test("findElement() only searches direct children", () => {
  const doc = parse("<root><wrapper><item/></wrapper></root>");
  const item = findElement(doc.root, "item");

  // item is nested, not a direct child
  assertEquals(item, undefined);
});

// =============================================================================
// findElements()
// =============================================================================

Deno.test("findElements() finds all matching elements", () => {
  const doc = parse("<root><item/><item/><other/><item/></root>");
  const items = findElements(doc.root, "item");

  assertEquals(items.length, 3);
});

Deno.test("findElements() returns empty array if none found", () => {
  const doc = parse("<root><other/></root>");
  const items = findElements(doc.root, "item");

  assertEquals(items.length, 0);
});

// =============================================================================
// getText()
// =============================================================================

Deno.test("getText() gets text content", () => {
  const doc = parse("<root>Hello World</root>");
  const text = getText(doc.root);

  assertEquals(text, "Hello World");
});

Deno.test("getText() concatenates nested text", () => {
  const doc = parse("<root>Hello <b>World</b>!</root>");
  const text = getText(doc.root);

  assertEquals(text, "Hello World!");
});

Deno.test("getText() includes CDATA content", () => {
  const doc = parse("<root>text<![CDATA[cdata]]>more</root>");
  const text = getText(doc.root);

  assertEquals(text, "textcdatamore");
});

Deno.test("getText() returns empty string for empty element", () => {
  const doc = parse("<root/>");
  const text = getText(doc.root);

  assertEquals(text, "");
});

// =============================================================================
// getAttribute()
// =============================================================================

Deno.test("getAttribute() gets attribute value", () => {
  const doc = parse('<root id="123"/>');
  const value = getAttribute(doc.root, "id");

  assertEquals(value, "123");
});

Deno.test("getAttribute() returns undefined for missing attribute", () => {
  const doc = parse("<root/>");
  const value = getAttribute(doc.root, "missing");

  assertEquals(value, undefined);
});

// =============================================================================
// Complex Documents (Integration)
// =============================================================================

Deno.test("parse() handles complex document", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <product id="1">
    <name>Widget</name>
    <price currency="USD">19.99</price>
  </product>
  <product id="2">
    <name>Gadget</name>
    <price currency="EUR">29.99</price>
  </product>
</catalog>`;

  const doc = parse(xml, { ignoreWhitespace: true });

  assertEquals(doc.root.name.local, "catalog");
  const products = findElements(doc.root, "product");
  assertEquals(products.length, 2);

  const firstProduct = products[0]!;
  assertEquals(getAttribute(firstProduct, "id"), "1");

  const name = findElement(firstProduct, "name");
  assertEquals(getText(name!), "Widget");
});

Deno.test("parse() handles RSS-like feed", () => {
  const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <item>
      <title>Article 1</title>
    </item>
    <item>
      <title>Article 2</title>
    </item>
  </channel>
</rss>`;

  const doc = parse(xml, { ignoreWhitespace: true });

  assertEquals(doc.root.name.local, "rss");
  assertEquals(getAttribute(doc.root, "version"), "2.0");

  const channel = findElement(doc.root, "channel");
  const title = findElement(channel!, "title");
  assertEquals(getText(title!), "Example Feed");

  const items = findElements(channel!, "item");
  assertEquals(items.length, 2);
});

// =============================================================================
// Additional coverage: CDATA in tree
// =============================================================================

Deno.test("parse() includes CDATA nodes in tree", () => {
  const doc = parse("<root><![CDATA[<script>]]></root>");

  assertEquals(doc.root.children.length, 1);
  assertEquals(doc.root.children[0]!.type, "cdata");
  if (doc.root.children[0]!.type === "cdata") {
    assertEquals(doc.root.children[0]!.text, "<script>");
  }
});

// =============================================================================
// Additional coverage: Comment in tree
// =============================================================================

Deno.test("parse() includes comment nodes in tree", () => {
  const doc = parse("<root><!-- comment --></root>");

  assertEquals(doc.root.children.length, 1);
  assertEquals(doc.root.children[0]!.type, "comment");
  if (doc.root.children[0]!.type === "comment") {
    assertEquals(doc.root.children[0]!.text, " comment ");
  }
});

Deno.test("parse() excludes comments when ignoreComments is true", () => {
  const doc = parse("<root><!-- comment --><item/></root>", {
    ignoreComments: true,
  });

  // Only the <item/> element should be in children
  assertEquals(doc.root.children.length, 1);
  assertEquals(doc.root.children[0]!.type, "element");
});

// =============================================================================
// Additional coverage: Processing instructions not in tree
// =============================================================================

Deno.test("parse() excludes processing instructions from tree", () => {
  const doc = parse("<?pi content?><root><?another pi?></root>");

  // PIs are not included in the tree - root should have no children
  assertEquals(doc.root.children.length, 0);
});
