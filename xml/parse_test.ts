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
// Processing Instructions in the Tree
// =============================================================================

Deno.test("parse() includes processing instructions in the tree", () => {
  const doc = parse("<?pi content?><root><?another pi?></root>");

  assertEquals(doc.prolog, [
    { type: "processing_instruction", target: "pi", content: "content" },
  ]);
  assertEquals(doc.root.children, [
    { type: "processing_instruction", target: "another", content: "pi" },
  ]);
});

Deno.test("parse() excludes processing instructions when ignoreProcessingInstructions is true", () => {
  const doc = parse("<?pi content?><root><?another pi?></root><?trailing?>", {
    ignoreProcessingInstructions: true,
  });

  assertEquals(doc.prolog, undefined);
  assertEquals(doc.root.children.length, 0);
  assertEquals(doc.epilog, undefined);
});

Deno.test("parse() places processing instructions after the root in epilog", () => {
  const doc = parse(`<root/><?xml-stylesheet href="style.css"?>`);

  assertEquals(doc.epilog, [{
    type: "processing_instruction",
    target: "xml-stylesheet",
    content: `href="style.css"`,
  }]);
});

Deno.test("parse() places comments outside the root in prolog and epilog", () => {
  const doc = parse("<!-- license --><root/><!-- trailer -->");

  assertEquals(doc.prolog, [{ type: "comment", text: " license " }]);
  assertEquals(doc.epilog, [{ type: "comment", text: " trailer " }]);
});

Deno.test("parse() omits prolog and epilog when empty", () => {
  const doc = parse("<root/>");

  assertEquals("prolog" in doc, false);
  assertEquals("epilog" in doc, false);
});

Deno.test("parse() excludes prolog comments when ignoreComments is true", () => {
  const doc = parse("<!-- a --><?pi?><root/>", { ignoreComments: true });

  assertEquals(doc.prolog, [
    { type: "processing_instruction", target: "pi", content: "" },
  ]);
});

Deno.test("parse() keeps prolog nodes in document order", () => {
  const doc = parse("<?first?><!-- second --><?third x?><root/>");

  assertEquals(doc.prolog, [
    { type: "processing_instruction", target: "first", content: "" },
    { type: "comment", text: " second " },
    { type: "processing_instruction", target: "third", content: "x" },
  ]);
});

Deno.test("parse() does not store whitespace-only text in prolog or epilog", () => {
  const doc = parse("\n<?pi?>\n<root/>\n");

  assertEquals(doc.prolog, [
    { type: "processing_instruction", target: "pi", content: "" },
  ]);
  assertEquals(doc.epilog, undefined);
});

Deno.test("parse() does not include processing instructions from DTD internal subset", () => {
  const doc = parse(`<!DOCTYPE root [<?dtd-pi content?>]><root/>`, {
    disallowDoctype: false,
  });

  assertEquals(doc.prolog, undefined);
  assertEquals(doc.root.children.length, 0);
});

// =============================================================================
// XML 1.1 Support
// =============================================================================

Deno.test("parse() xml11 accepts C0 control char refs", () => {
  const doc = parse("<root>&#x1;&#x2;</root>", { xmlVersion: "1.1" });
  assertEquals(doc.root.children.length, 1);
  const text = doc.root.children[0]!;
  assertEquals(text.type, "text");
  if (text.type === "text") {
    assertEquals(text.text, "\x01\x02");
  }
});

Deno.test("parse() xml10 rejects C0 control char refs", () => {
  assertThrows(
    () => parse("<root>&#x2;</root>"),
    Error,
    "Invalid character reference",
  );
});

Deno.test("parse() xml11 rejects NULL char ref", () => {
  assertThrows(
    () => parse("<root>&#x0;</root>", { xmlVersion: "1.1" }),
    Error,
    "Invalid character reference",
  );
});

Deno.test("parse() xml11 rejects literal C0 controls", () => {
  assertThrows(
    () => parse("<root>\x01</root>", { xmlVersion: "1.1" }),
    SyntaxError,
    "Illegal XML character",
  );
});

Deno.test("parse() xml11 rejects literal C1 controls", () => {
  assertThrows(
    () => parse("<root>\x80</root>", { xmlVersion: "1.1" }),
    SyntaxError,
    "Illegal XML character",
  );
});

Deno.test("parse() xml11 normalizes NEL line endings", () => {
  const doc = parse("<root>line1\x85line2</root>", { xmlVersion: "1.1" });
  const text = doc.root.children[0]!;
  if (text.type === "text") {
    assertEquals(text.text, "line1\nline2");
  }
});

Deno.test("parse() xml11 normalizes LS (U+2028) line endings", () => {
  const doc = parse("<root>line1\u2028line2</root>", { xmlVersion: "1.1" });
  const text = doc.root.children[0]!;
  if (text.type === "text") {
    assertEquals(text.text, "line1\nline2");
  }
});

Deno.test("parse() xml11 allows namespace prefix unbinding", () => {
  const doc = parse(
    '<root xmlns:ns="http://example.com"><child xmlns:ns="" /></root>',
    { xmlVersion: "1.1" },
  );
  assertEquals(doc.root.name.local, "root");
});

Deno.test("parse() xml10 rejects namespace prefix unbinding", () => {
  assertThrows(
    () =>
      parse(
        '<root xmlns:ns="http://example.com"><child xmlns:ns="" /></root>',
      ),
    SyntaxError,
    "Cannot unbind namespace prefix",
  );
});

Deno.test("parse() xml11 accepts C0 char refs in attributes", () => {
  const doc = parse('<root attr="&#x2;"/>', { xmlVersion: "1.1" });
  assertEquals(doc.root.attributes["attr"], "\x02");
});

Deno.test("parse() xml11 version declaration is reported", () => {
  const doc = parse(
    '<?xml version="1.1"?><root/>',
    { xmlVersion: "1.1" },
  );
  assertEquals(doc.declaration?.version, "1.1");
});
