// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { parse } from "./parse.ts";

// =============================================================================
// DOM Tree Structure (Unique to parse())
// =============================================================================

Deno.test("parse() stores attributes by full name", () => {
  const doc = parse('<root xml:lang="en"/>');

  // Attribute is stored by full name (with namespace prefix)
  assertEquals(doc.root.attributes["xml:lang"], "en");
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

  // Filter products manually
  const products = doc.root.children.filter(
    (child) => child.type === "element" && child.name.local === "product",
  );
  assertEquals(products.length, 2);

  const firstProduct = products[0]!;
  if (firstProduct.type === "element") {
    assertEquals(firstProduct.attributes["id"], "1");

    // Find name element
    const name = firstProduct.children.find(
      (child) => child.type === "element" && child.name.local === "name",
    );
    if (name?.type === "element" && name.children[0]?.type === "text") {
      assertEquals(name.children[0].text, "Widget");
    }
  }
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
  assertEquals(doc.root.attributes["version"], "2.0");

  const channel = doc.root.children.find(
    (child) => child.type === "element" && child.name.local === "channel",
  );
  if (channel?.type === "element") {
    const title = channel.children.find(
      (child) => child.type === "element" && child.name.local === "title",
    );
    if (title?.type === "element" && title.children[0]?.type === "text") {
      assertEquals(title.children[0].text, "Example Feed");
    }

    const items = channel.children.filter(
      (child) => child.type === "element" && child.name.local === "item",
    );
    assertEquals(items.length, 2);
  }
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
