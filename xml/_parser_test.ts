// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { parseTokensToEvents } from "./_parser.ts";
import { tokenize } from "./_tokenizer.ts";
import type { ParseStreamOptions, XmlEvent } from "./types.ts";
import { XmlSyntaxError } from "./types.ts";

/** Helper to collect all events from parsing an XML string (flattens batches). */
async function collectEvents(
  xml: string,
  options?: ParseStreamOptions,
): Promise<XmlEvent[]> {
  async function* stringSource(): AsyncIterable<string> {
    yield xml;
  }
  const tokens = tokenize(stringSource());
  const events: XmlEvent[] = [];
  for await (const batch of parseTokensToEvents(tokens, options)) {
    events.push(...batch);
  }
  return events;
}

// =============================================================================
// Namespace Prefix Parsing (Parser-specific)
// =============================================================================

Deno.test("parse() extracts namespace prefix from element name", async () => {
  const events = await collectEvents("<ns:element></ns:element>");

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.name.prefix, "ns");
    assertEquals(events[0]!.name.local, "element");
  }
});

Deno.test("parse() extracts namespace prefix from attribute name", async () => {
  const events = await collectEvents('<root xml:lang="en"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes.length, 1);
    assertEquals(events[0]!.attributes[0]!.name.prefix, "xml");
    assertEquals(events[0]!.attributes[0]!.name.local, "lang");
    assertEquals(events[0]!.attributes[0]!.value, "en");
  }
});

Deno.test("parse() handles element without prefix", async () => {
  const events = await collectEvents("<element/>");

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.name.prefix, undefined);
    assertEquals(events[0]!.name.local, "element");
  }
});

// =============================================================================
// Entity Decoding (Parser-specific)
// =============================================================================

Deno.test("parse() decodes entities in attribute values", async () => {
  const events = await collectEvents('<item name="Tom &amp; Jerry"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "Tom & Jerry");
  }
});

Deno.test("parse() decodes character references in attribute values", async () => {
  const events = await collectEvents('<item char="&#60;&#62;"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "<>");
  }
});

Deno.test("parse() decodes entities in text content", async () => {
  const events = await collectEvents("<root>&lt;script&gt;</root>");

  assertEquals(events[1]!.type, "text");
  if (events[1]!.type === "text") {
    assertEquals(events[1]!.text, "<script>");
  }
});

Deno.test("parse() decodes all predefined entities in text", async () => {
  const events = await collectEvents(
    "<root>&lt;&gt;&amp;&apos;&quot;</root>",
  );

  assertEquals(events[1]!.type, "text");
  if (events[1]!.type === "text") {
    assertEquals(events[1]!.text, "<>&'\"");
  }
});

Deno.test("parse() handles hex character references", async () => {
  const events = await collectEvents("<root>&#x3C;&#x3E;</root>");

  assertEquals(events[1]!.type, "text");
  if (events[1]!.type === "text") {
    assertEquals(events[1]!.text, "<>");
  }
});

Deno.test("parse() handles Unicode in text", async () => {
  const events = await collectEvents("<root>日本語 🎉 émoji</root>");

  assertEquals(events[1]!.type, "text");
  if (events[1]!.type === "text") {
    assertEquals(events[1]!.text, "日本語 🎉 émoji");
  }
});

// =============================================================================
// Attribute Value Normalization (§3.3.3, Parser-specific)
// =============================================================================

Deno.test("parse() normalizes literal tab in attribute value to space", async () => {
  const events = await collectEvents('<item value="a\tb"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "a b");
  }
});

Deno.test("parse() normalizes literal newline in attribute value to space", async () => {
  const events = await collectEvents('<item value="a\nb"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "a b");
  }
});

Deno.test("parse() preserves character reference to newline in attribute value", async () => {
  const events = await collectEvents('<item value="a&#10;b"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "a\nb");
  }
});

Deno.test("parse() preserves character reference to tab in attribute value", async () => {
  const events = await collectEvents('<item value="a&#9;b"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "a\tb");
  }
});

Deno.test("parse() preserves character reference to CR in attribute value", async () => {
  const events = await collectEvents('<item value="a&#13;b"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "a\rb");
  }
});

Deno.test("parse() normalizes mixed literal and reference whitespace correctly", async () => {
  const events = await collectEvents('<item value="a\t&#10;b"/>');

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.attributes[0]!.value, "a \nb");
  }
});

// =============================================================================
// CDATA Handling (Parser-specific)
// =============================================================================

Deno.test("parse() does not decode entities in CDATA", async () => {
  const events = await collectEvents(
    "<root><![CDATA[&amp; stays &amp;]]></root>",
  );

  assertEquals(events[1]!.type, "cdata");
  if (events[1]!.type === "cdata") {
    assertEquals(events[1]!.text, "&amp; stays &amp;");
  }
});

Deno.test("parse() coerces CDATA to text when option is set", async () => {
  const events = await collectEvents(
    "<root><![CDATA[content]]></root>",
    { coerceCDataToText: true },
  );

  assertEquals(events[1]!.type, "text");
  if (events[1]!.type === "text") {
    assertEquals(events[1]!.text, "content");
  }
});

// =============================================================================
// Filtering Options (Parser-specific)
// =============================================================================

Deno.test("parse() filters comments when ignoreComments is true", async () => {
  const events = await collectEvents(
    "<root><!-- comment -->text</root>",
    { ignoreComments: true },
  );

  assertEquals(events.length, 3);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "text");
  assertEquals(events[2]!.type, "end_element");
});

Deno.test("parse() filters PIs when ignoreProcessingInstructions is true", async () => {
  const events = await collectEvents(
    "<?pi content?><root/>",
    { ignoreProcessingInstructions: true },
  );

  assertEquals(events.length, 2);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "end_element");
});

Deno.test("parse() ignores whitespace-only text when option is set", async () => {
  const events = await collectEvents(
    "<root>  \n  </root>",
    { ignoreWhitespace: true },
  );

  assertEquals(events.length, 2);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "end_element");
});

Deno.test("parse() preserves whitespace by default", async () => {
  const events = await collectEvents("<root>  \n  </root>");

  assertEquals(events.length, 3);
  assertEquals(events[1]!.type, "text");
  if (events[1]!.type === "text") {
    assertEquals(events[1]!.text, "  \n  ");
  }
});

Deno.test("parse() preserves text with whitespace and content", async () => {
  const events = await collectEvents(
    "<root>  hello  </root>",
    { ignoreWhitespace: true },
  );

  assertEquals(events.length, 3);
  assertEquals(events[1]!.type, "text");
  if (events[1]!.type === "text") {
    assertEquals(events[1]!.text, "  hello  ");
  }
});

Deno.test("parse() handles multiple options together", async () => {
  const events = await collectEvents(
    `<?pi data?>
<root>
  <!-- comment -->
  <![CDATA[cdata]]>
</root>`,
    {
      ignoreWhitespace: true,
      ignoreComments: true,
      ignoreProcessingInstructions: true,
      coerceCDataToText: true,
    },
  );

  assertEquals(events.length, 3);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "text");
  assertEquals(events[2]!.type, "end_element");
});

// =============================================================================
// Well-formedness Validation (Parser-specific)
// =============================================================================

Deno.test("parse() throws on mismatched closing tag", async () => {
  await assertRejects(
    () => collectEvents("<root></wrong>"),
    XmlSyntaxError,
    "Mismatched closing tag: expected </root> but found </wrong>",
  );
});

Deno.test("parse() throws on unexpected closing tag", async () => {
  await assertRejects(
    () => collectEvents("</orphan>"),
    XmlSyntaxError,
    "Unexpected closing tag </orphan> with no matching opening tag",
  );
});

Deno.test("parse() throws on unclosed element", async () => {
  await assertRejects(
    () => collectEvents("<root>"),
    XmlSyntaxError,
    "Unclosed element <root>",
  );
});

Deno.test("parse() throws on deeply nested unclosed element", async () => {
  await assertRejects(
    () => collectEvents("<root><child><grandchild></grandchild></child>"),
    XmlSyntaxError,
    "Unclosed element <root>",
  );
});

Deno.test("parse() throws on multiple top-level elements after self-closing", async () => {
  await assertRejects(
    () => collectEvents("<root/></extra>"),
    XmlSyntaxError,
    "Unexpected closing tag </extra>",
  );
});

// =============================================================================
// Position Tracking (Parser-specific - verifies propagation)
// =============================================================================

Deno.test("parse() tracks position for start elements", async () => {
  const events = await collectEvents("<root/>");

  assertEquals(events[0]!.type, "start_element");
  if (events[0]!.type === "start_element") {
    assertEquals(events[0]!.line, 1);
    assertEquals(events[0]!.column, 1);
    assertEquals(events[0]!.offset, 0);
  }
});

Deno.test("parse() tracks position on multiple lines", async () => {
  const events = await collectEvents("<root>\n  <child/>\n</root>");

  const child = events.find(
    (e) => e.type === "start_element" && e.name.local === "child",
  );
  assertEquals(child!.type, "start_element");
  if (child!.type === "start_element") {
    assertEquals(child!.line, 2);
    assertEquals(child!.column, 3);
  }
});

Deno.test("parse() tracks position for declaration", async () => {
  const events = await collectEvents('<?xml version="1.0"?><root/>');

  assertEquals(events[0]!.type, "declaration");
  if (events[0]!.type === "declaration") {
    assertEquals(events[0]!.line, 1);
    assertEquals(events[0]!.column, 1);
    assertEquals(events[0]!.offset, 0);
  }
});

// =============================================================================
// Additional coverage: Declaration with encoding and standalone
// =============================================================================

Deno.test("parse() propagates declaration encoding", async () => {
  const events = await collectEvents(
    '<?xml version="1.0" encoding="UTF-8"?><root/>',
  );

  assertEquals(events[0]!.type, "declaration");
  if (events[0]!.type === "declaration") {
    assertEquals(events[0]!.encoding, "UTF-8");
  }
});

Deno.test("parse() propagates declaration standalone", async () => {
  const events = await collectEvents(
    '<?xml version="1.0" standalone="yes"?><root/>',
  );

  assertEquals(events[0]!.type, "declaration");
  if (events[0]!.type === "declaration") {
    assertEquals(events[0]!.standalone, "yes");
  }
});

// =============================================================================
// Additional coverage: Processing instruction events (not filtered)
// =============================================================================

Deno.test("parse() emits processing instruction events by default", async () => {
  const events = await collectEvents(
    '<?xml-stylesheet href="style.xsl"?><root/>',
  );

  assertEquals(events[0]!.type, "processing_instruction");
  if (events[0]!.type === "processing_instruction") {
    assertEquals(events[0]!.target, "xml-stylesheet");
    assertEquals(events[0]!.content, 'href="style.xsl"');
    assertEquals(events[0]!.line, 1);
    assertEquals(events[0]!.column, 1);
    assertEquals(events[0]!.offset, 0);
  }
});

Deno.test("parse() emits multiple processing instructions", async () => {
  const events = await collectEvents(
    "<?pi1 data1?><?pi2 data2?><root/>",
  );

  const pis = events.filter((e) => e.type === "processing_instruction");
  assertEquals(pis.length, 2);
});

// =============================================================================
// Additional coverage: DOCTYPE handling
// =============================================================================

Deno.test("parse() silently consumes DOCTYPE", async () => {
  const events = await collectEvents("<!DOCTYPE html><root/>");

  // DOCTYPE should not appear in events - only start_element and end_element
  assertEquals(events.length, 2);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "end_element");
});
