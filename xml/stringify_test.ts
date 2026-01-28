// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { stringify } from "./stringify.ts";
import type { XmlDocument, XmlElement } from "./types.ts";

// =============================================================================
// Basic Elements
// =============================================================================

Deno.test("stringify() serializes empty element", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [],
  };

  assertEquals(stringify(element), "<root/>");
});

Deno.test("stringify() serializes element with text content", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "greeting", local: "greeting" },
    attributes: {},
    children: [{ type: "text", text: "Hello!" }],
  };

  assertEquals(stringify(element), "<greeting>Hello!</greeting>");
});

Deno.test("stringify() serializes nested elements", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [
      {
        type: "element",
        name: { raw: "child", local: "child" },
        attributes: {},
        children: [],
      },
    ],
  };

  assertEquals(stringify(element), "<root><child/></root>");
});

// =============================================================================
// Namespace Prefixes
// =============================================================================

Deno.test("stringify() includes namespace prefix in tag name", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "ns:element", prefix: "ns", local: "element" },
    attributes: {},
    children: [],
  };

  assertEquals(stringify(element), "<ns:element/>");
});

// =============================================================================
// Attributes
// =============================================================================

Deno.test("stringify() serializes single attribute", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "item", local: "item" },
    attributes: { id: "123" },
    children: [],
  };

  assertEquals(stringify(element), '<item id="123"/>');
});

Deno.test("stringify() serializes multiple attributes", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "item", local: "item" },
    attributes: { id: "1", class: "main" },
    children: [],
  };

  assertEquals(stringify(element), '<item id="1" class="main"/>');
});

Deno.test("stringify() encodes special characters in attributes", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "item", local: "item" },
    attributes: { name: 'Tom & "Jerry"' },
    children: [],
  };

  assertEquals(
    stringify(element),
    '<item name="Tom &amp; &quot;Jerry&quot;"/>',
  );
});

Deno.test("stringify() encodes whitespace in attributes", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "item", local: "item" },
    attributes: { data: "line1\nline2\ttab" },
    children: [],
  };

  assertEquals(stringify(element), '<item data="line1&#10;line2&#9;tab"/>');
});

// =============================================================================
// Text Content
// =============================================================================

Deno.test("stringify() encodes special characters in text", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "text", text: "<script>&</script>" }],
  };

  assertEquals(
    stringify(element),
    "<root>&lt;script&gt;&amp;&lt;/script&gt;</root>",
  );
});

Deno.test("stringify() preserves whitespace in text", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "text", text: "  spaces  " }],
  };

  assertEquals(stringify(element), "<root>  spaces  </root>");
});

// =============================================================================
// CDATA Sections
// =============================================================================

Deno.test("stringify() serializes CDATA section", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "cdata", text: "<not>xml</not>" }],
  };

  assertEquals(stringify(element), "<root><![CDATA[<not>xml</not>]]></root>");
});

Deno.test("stringify() does not encode entities in CDATA", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "cdata", text: "&amp; stays &amp;" }],
  };

  assertEquals(
    stringify(element),
    "<root><![CDATA[&amp; stays &amp;]]></root>",
  );
});

// =============================================================================
// Comments
// =============================================================================

Deno.test("stringify() serializes comments", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "comment", text: " comment " }],
  };

  assertEquals(stringify(element), "<root><!-- comment --></root>");
});

// =============================================================================
// Mixed Content
// =============================================================================

Deno.test("stringify() serializes mixed content", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [
      { type: "text", text: "text" },
      {
        type: "element",
        name: { raw: "child", local: "child" },
        attributes: {},
        children: [],
      },
      { type: "text", text: "more" },
    ],
  };

  assertEquals(stringify(element), "<root>text<child/>more</root>");
});

// =============================================================================
// XML Declaration
// =============================================================================

Deno.test("stringify() includes XML declaration from document", () => {
  const doc: XmlDocument = {
    declaration: {
      type: "declaration",
      version: "1.0",
      line: 1,
      column: 1,
      offset: 0,
    },
    root: {
      type: "element",
      name: { raw: "root", local: "root" },
      attributes: {},
      children: [],
    },
  };

  assertEquals(stringify(doc), '<?xml version="1.0"?><root/>');
});

Deno.test("stringify() includes encoding in declaration", () => {
  const doc: XmlDocument = {
    declaration: {
      type: "declaration",
      version: "1.0",
      encoding: "UTF-8",
      line: 1,
      column: 1,
      offset: 0,
    },
    root: {
      type: "element",
      name: { raw: "root", local: "root" },
      attributes: {},
      children: [],
    },
  };

  assertEquals(stringify(doc), '<?xml version="1.0" encoding="UTF-8"?><root/>');
});

Deno.test("stringify() includes standalone in declaration", () => {
  const doc: XmlDocument = {
    declaration: {
      type: "declaration",
      version: "1.0",
      standalone: "yes",
      line: 1,
      column: 1,
      offset: 0,
    },
    root: {
      type: "element",
      name: { raw: "root", local: "root" },
      attributes: {},
      children: [],
    },
  };

  assertEquals(stringify(doc), '<?xml version="1.0" standalone="yes"?><root/>');
});

Deno.test("stringify() omits declaration when option is false", () => {
  const doc: XmlDocument = {
    declaration: {
      type: "declaration",
      version: "1.0",
      line: 1,
      column: 1,
      offset: 0,
    },
    root: {
      type: "element",
      name: { raw: "root", local: "root" },
      attributes: {},
      children: [],
    },
  };

  assertEquals(stringify(doc, { declaration: false }), "<root/>");
});

Deno.test("stringify() handles document without declaration", () => {
  const doc: XmlDocument = {
    root: {
      type: "element",
      name: { raw: "root", local: "root" },
      attributes: {},
      children: [],
    },
  };

  assertEquals(stringify(doc), "<root/>");
});

// =============================================================================
// Pretty Printing
// =============================================================================

Deno.test("stringify() pretty-prints with indent option", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [
      {
        type: "element",
        name: { raw: "child", local: "child" },
        attributes: {},
        children: [],
      },
    ],
  };

  assertEquals(
    stringify(element, { indent: "  " }),
    "<root>\n  <child/>\n</root>",
  );
});

Deno.test("stringify() pretty-prints deeply nested elements", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "a", local: "a" },
    attributes: {},
    children: [
      {
        type: "element",
        name: { raw: "b", local: "b" },
        attributes: {},
        children: [
          {
            type: "element",
            name: { raw: "c", local: "c" },
            attributes: {},
            children: [],
          },
        ],
      },
    ],
  };

  assertEquals(
    stringify(element, { indent: "  " }),
    "<a>\n  <b>\n    <c/>\n  </b>\n</a>",
  );
});

Deno.test("stringify() keeps text content inline when pretty-printing", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "p", local: "p" },
    attributes: {},
    children: [{ type: "text", text: "Hello World" }],
  };

  assertEquals(stringify(element, { indent: "  " }), "<p>Hello World</p>");
});

Deno.test("stringify() pretty-prints declaration on separate line", () => {
  const doc: XmlDocument = {
    declaration: {
      type: "declaration",
      version: "1.0",
      line: 1,
      column: 1,
      offset: 0,
    },
    root: {
      type: "element",
      name: { raw: "root", local: "root" },
      attributes: {},
      children: [],
    },
  };

  assertEquals(
    stringify(doc, { indent: "  " }),
    '<?xml version="1.0"?>\n<root/>',
  );
});

Deno.test("stringify() pretty-prints comments", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [
      { type: "comment", text: " comment " },
      {
        type: "element",
        name: { raw: "child", local: "child" },
        attributes: {},
        children: [],
      },
    ],
  };

  assertEquals(
    stringify(element, { indent: "  " }),
    "<root>\n  <!-- comment -->\n  <child/>\n</root>",
  );
});

// =============================================================================
// Complex Documents
// =============================================================================

Deno.test("stringify() handles complex document", () => {
  const doc: XmlDocument = {
    declaration: {
      type: "declaration",
      version: "1.0",
      encoding: "UTF-8",
      line: 1,
      column: 1,
      offset: 0,
    },
    root: {
      type: "element",
      name: { raw: "catalog", local: "catalog" },
      attributes: {},
      children: [
        {
          type: "element",
          name: { raw: "product", local: "product" },
          attributes: { id: "1" },
          children: [
            {
              type: "element",
              name: { raw: "name", local: "name" },
              attributes: {},
              children: [{ type: "text", text: "Widget" }],
            },
          ],
        },
      ],
    },
  };

  const expected = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    "<catalog>\n" +
    '  <product id="1">\n' +
    "    <name>Widget</name>\n" +
    "  </product>\n" +
    "</catalog>";

  assertEquals(stringify(doc, { indent: "  " }), expected);
});

// =============================================================================
// Edge Cases
// =============================================================================

Deno.test("stringify() handles Unicode content", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "text", text: "日本語 🎉 émoji" }],
  };

  assertEquals(stringify(element), "<root>日本語 🎉 émoji</root>");
});

Deno.test("stringify() handles empty string attribute", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "item", local: "item" },
    attributes: { value: "" },
    children: [],
  };

  assertEquals(stringify(element), '<item value=""/>');
});

// =============================================================================
// CDATA Edge Cases (XML 1.0 §2.7)
// =============================================================================

Deno.test("stringify() escapes ]]> in CDATA by splitting", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "cdata", text: "contains ]]> sequence" }],
  };

  assertEquals(
    stringify(element),
    "<root><![CDATA[contains ]]]]><![CDATA[> sequence]]></root>",
  );
});

Deno.test("stringify() escapes multiple ]]> in CDATA", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "cdata", text: "a]]>b]]>c" }],
  };

  assertEquals(
    stringify(element),
    "<root><![CDATA[a]]]]><![CDATA[>b]]]]><![CDATA[>c]]></root>",
  );
});

Deno.test("stringify() handles ]]> at start of CDATA", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "cdata", text: "]]>text" }],
  };

  assertEquals(
    stringify(element),
    "<root><![CDATA[]]]]><![CDATA[>text]]></root>",
  );
});

Deno.test("stringify() handles ]]> at end of CDATA", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "cdata", text: "text]]>" }],
  };

  assertEquals(
    stringify(element),
    "<root><![CDATA[text]]]]><![CDATA[>]]></root>",
  );
});

// =============================================================================
// Comment Edge Cases (XML 1.0 §2.5)
// =============================================================================

Deno.test("stringify() throws for -- in comment", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "comment", text: "contains -- sequence" }],
  };

  assertThrows(
    () => stringify(element),
    TypeError,
    'contains "--"',
  );
});

Deno.test("stringify() throws for comment ending with -", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "comment", text: "ends with hyphen-" }],
  };

  assertThrows(
    () => stringify(element),
    TypeError,
    'ends with "-"',
  );
});

Deno.test("stringify() allows single hyphen in comment", () => {
  const element: XmlElement = {
    type: "element",
    name: { raw: "root", local: "root" },
    attributes: {},
    children: [{ type: "comment", text: " single-hyphen is fine " }],
  };

  assertEquals(
    stringify(element),
    "<root><!-- single-hyphen is fine --></root>",
  );
});
