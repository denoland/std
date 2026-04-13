// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { XmlEventParser } from "./_parser.ts";
import { XmlTokenizer } from "./_tokenizer.ts";
import type {
  ParseStreamOptions,
  XmlAttributeIterator,
  XmlEventCallbacks,
  XmlName,
} from "./types.ts";
import { XmlSyntaxError } from "./types.ts";

/** Event type for testing - recreates event structure for assertions. */
interface XmlEvent {
  type: string;
  name?: XmlName;
  attributes?: Array<{ name: XmlName; value: string }>;
  selfClosing?: boolean;
  text?: string;
  target?: string;
  content?: string;
  version?: string;
  encoding?: string;
  standalone?: "yes" | "no";
  line?: number;
  column?: number;
  offset?: number;
}

/** Parses a qualified name string into an XmlName object. */
function parseName(
  raw: string,
  colonIndex: number,
  uri?: string,
): XmlName {
  if (colonIndex === -1) {
    return { raw, local: raw };
  }
  return {
    raw,
    local: raw.slice(colonIndex + 1),
    prefix: raw.slice(0, colonIndex),
    ...(uri !== undefined && { uri }),
  };
}

/** Creates callbacks that collect events into an array. */
function createEventCollector(): {
  events: XmlEvent[];
  callbacks: XmlEventCallbacks;
} {
  const events: XmlEvent[] = [];
  const callbacks: XmlEventCallbacks = {
    onDeclaration(version, encoding, standalone, line, column, offset) {
      events.push({
        type: "declaration",
        version,
        ...(encoding !== undefined ? { encoding } : {}),
        ...(standalone !== undefined ? { standalone } : {}),
        line,
        column,
        offset,
      } as XmlEvent);
    },
    onStartElement(
      name,
      colonIndex,
      uri,
      attributes: XmlAttributeIterator,
      selfClosing,
      line,
      column,
      offset,
    ) {
      const attrs: Array<{ name: XmlName; value: string }> = [];
      for (let i = 0; i < attributes.count; i++) {
        const attrName = attributes.getName(i);
        const attrColonIndex = attributes.getColonIndex(i);
        const attrUri = attributes.getUri(i);
        attrs.push({
          name: parseName(attrName, attrColonIndex, attrUri),
          value: attributes.getValue(i),
        });
      }
      events.push({
        type: "start_element",
        name: parseName(name, colonIndex, uri),
        attributes: attrs,
        selfClosing,
        line,
        column,
        offset,
      });
    },
    onEndElement(name, colonIndex, uri, line, column, offset) {
      events.push({
        type: "end_element",
        name: parseName(name, colonIndex, uri),
        line,
        column,
        offset,
      });
    },
    onText(text, line, column, offset) {
      events.push({ type: "text", text, line, column, offset });
    },
    onCData(text, line, column, offset) {
      events.push({ type: "cdata", text, line, column, offset });
    },
    onComment(text, line, column, offset) {
      events.push({ type: "comment", text, line, column, offset });
    },
    onProcessingInstruction(target, content, line, column, offset) {
      events.push({
        type: "processing_instruction",
        target,
        content,
        line,
        column,
        offset,
      });
    },
  };
  return { events, callbacks };
}

/** Helper to collect all events from parsing an XML string synchronously. */
function collectEvents(xml: string, options?: ParseStreamOptions): XmlEvent[] {
  const tokenizer = new XmlTokenizer();
  const { events, callbacks } = createEventCollector();
  const parser = new XmlEventParser(callbacks, options);
  tokenizer.process(xml, parser);
  tokenizer.finalize(parser);
  parser.finalize();
  return events;
}

// =============================================================================
// Namespace Prefix Parsing (Parser-specific)
// =============================================================================

Deno.test("XmlEventParser.process() extracts namespace prefix from element name", () => {
  const events = collectEvents(
    '<ns:element xmlns:ns="http://example.com"></ns:element>',
  );

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.name?.prefix, "ns");
  assertEquals(events[0]!.name?.local, "element");
});

Deno.test("XmlEventParser.process() resolves namespace URI for element name", () => {
  const events = collectEvents(
    '<ns:element xmlns:ns="http://example.com"></ns:element>',
  );

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.name?.uri, "http://example.com");
  // End element should also have the URI
  assertEquals(events[1]!.type, "end_element");
  assertEquals(events[1]!.name?.uri, "http://example.com");
});

Deno.test("XmlEventParser.process() resolves xml namespace URI for xml: prefix", () => {
  const events = collectEvents('<root xml:lang="en"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.name.prefix, "xml");
  assertEquals(
    events[0]!.attributes?.[0]?.name.uri,
    "http://www.w3.org/XML/1998/namespace",
  );
});

Deno.test("XmlEventParser.process() extracts namespace prefix from attribute name", () => {
  const events = collectEvents('<root xml:lang="en"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.length, 1);
  assertEquals(events[0]!.attributes?.[0]?.name.prefix, "xml");
  assertEquals(events[0]!.attributes?.[0]?.name.local, "lang");
  assertEquals(events[0]!.attributes?.[0]?.value, "en");
});

Deno.test("XmlEventParser.process() resolves namespace URI for prefixed attributes", () => {
  const events = collectEvents(
    '<root xmlns:ns="http://example.com" ns:attr="value"/>',
  );

  assertEquals(events[0]!.type, "start_element");
  // Find the ns:attr attribute (not the xmlns:ns declaration)
  const nsAttr = events[0]!.attributes?.find((a) => a.name.prefix === "ns");
  assertEquals(nsAttr?.name.local, "attr");
  assertEquals(nsAttr?.name.uri, "http://example.com");
});

Deno.test("XmlEventParser.process() does not assign URI to xmlns: declarations", () => {
  const events = collectEvents(
    '<root xmlns:ns="http://example.com"/>',
  );

  assertEquals(events[0]!.type, "start_element");
  const xmlnsAttr = events[0]!.attributes?.find((a) =>
    a.name.raw === "xmlns:ns"
  );
  assertEquals(xmlnsAttr?.name.uri, undefined);
});

Deno.test("XmlEventParser.process() handles element without prefix", () => {
  const events = collectEvents("<element/>");

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.name?.prefix, undefined);
  assertEquals(events[0]!.name?.local, "element");
  assertEquals(events[0]!.name?.uri, undefined);
});

// =============================================================================
// Entity Decoding (Parser-specific)
// =============================================================================

Deno.test("XmlEventParser.process() decodes entities in attribute values", () => {
  const events = collectEvents('<item name="Tom &amp; Jerry"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.value, "Tom & Jerry");
});

Deno.test("XmlEventParser.process() decodes character references in attribute values", () => {
  const events = collectEvents('<item char="&#60;&#62;"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.value, "<>");
});

Deno.test("XmlEventParser.process() decodes entities in text content", () => {
  const events = collectEvents("<root>&lt;script&gt;</root>");

  assertEquals(events[1]!.type, "text");
  assertEquals(events[1]!.text, "<script>");
});

Deno.test("XmlEventParser.process() decodes all predefined entities in text", () => {
  const events = collectEvents(
    "<root>&lt;&gt;&amp;&apos;&quot;</root>",
  );

  assertEquals(events[1]!.type, "text");
  assertEquals(events[1]!.text, "<>&'\"");
});

Deno.test("XmlEventParser.process() handles hex character references", () => {
  const events = collectEvents("<root>&#x3C;&#x3E;</root>");

  assertEquals(events[1]!.type, "text");
  assertEquals(events[1]!.text, "<>");
});

Deno.test("XmlEventParser.process() handles Unicode in text", () => {
  const events = collectEvents("<root>日本語 🎉 émoji</root>");

  assertEquals(events[1]!.type, "text");
  assertEquals(events[1]!.text, "日本語 🎉 émoji");
});

// =============================================================================
// Attribute Value Normalization (§3.3.3, Parser-specific)
// =============================================================================

Deno.test("XmlEventParser.process() normalizes literal tab in attribute value to space", () => {
  const events = collectEvents('<item value="a\tb"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.value, "a b");
});

Deno.test("XmlEventParser.process() normalizes literal newline in attribute value to space", () => {
  const events = collectEvents('<item value="a\nb"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.value, "a b");
});

Deno.test("XmlEventParser.process() preserves character reference to newline in attribute value", () => {
  const events = collectEvents('<item value="a&#10;b"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.value, "a\nb");
});

Deno.test("XmlEventParser.process() preserves character reference to tab in attribute value", () => {
  const events = collectEvents('<item value="a&#9;b"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.value, "a\tb");
});

Deno.test("XmlEventParser.process() preserves character reference to CR in attribute value", () => {
  const events = collectEvents('<item value="a&#13;b"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.value, "a\rb");
});

Deno.test("XmlEventParser.process() normalizes mixed literal and reference whitespace correctly", () => {
  const events = collectEvents('<item value="a\t&#10;b"/>');

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.attributes?.[0]?.value, "a \nb");
});

// =============================================================================
// CDATA Handling (Parser-specific)
// =============================================================================

Deno.test("XmlEventParser.process() does not decode entities in CDATA", () => {
  const events = collectEvents(
    "<root><![CDATA[&amp; stays &amp;]]></root>",
  );

  assertEquals(events[1]!.type, "cdata");
  assertEquals(events[1]!.text, "&amp; stays &amp;");
});

Deno.test("XmlEventParser.process() coerces CDATA to text when option is set", () => {
  const events = collectEvents(
    "<root><![CDATA[content]]></root>",
    { coerceCDataToText: true },
  );

  assertEquals(events[1]!.type, "text");
  assertEquals(events[1]!.text, "content");
});

// =============================================================================
// Filtering Options (Parser-specific)
// =============================================================================

Deno.test("XmlEventParser.process() filters comments when ignoreComments is true", () => {
  const events = collectEvents(
    "<root><!-- comment -->text</root>",
    { ignoreComments: true },
  );

  assertEquals(events.length, 3);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "text");
  assertEquals(events[2]!.type, "end_element");
});

Deno.test("XmlEventParser.process() filters PIs when ignoreProcessingInstructions is true", () => {
  const events = collectEvents(
    "<?pi content?><root/>",
    { ignoreProcessingInstructions: true },
  );

  assertEquals(events.length, 2);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "end_element");
});

Deno.test("XmlEventParser.process() ignores whitespace-only text when option is set", () => {
  const events = collectEvents(
    "<root>  \n  </root>",
    { ignoreWhitespace: true },
  );

  assertEquals(events.length, 2);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "end_element");
});

Deno.test("XmlEventParser.process() preserves whitespace by default", () => {
  const events = collectEvents("<root>  \n  </root>");

  assertEquals(events.length, 3);
  assertEquals(events[1]!.type, "text");
  assertEquals(events[1]!.text, "  \n  ");
});

Deno.test("XmlEventParser.process() preserves text with whitespace and content", () => {
  const events = collectEvents(
    "<root>  hello  </root>",
    { ignoreWhitespace: true },
  );

  assertEquals(events.length, 3);
  assertEquals(events[1]!.type, "text");
  assertEquals(events[1]!.text, "  hello  ");
});

Deno.test("XmlEventParser.process() handles multiple options together", () => {
  const events = collectEvents(
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

Deno.test("XmlEventParser.process() throws on mismatched closing tag", () => {
  assertThrows(
    () => collectEvents("<root></wrong>"),
    XmlSyntaxError,
    "Mismatched closing tag: expected </root> but found </wrong>",
  );
});

Deno.test("XmlEventParser.process() throws on unexpected closing tag", () => {
  assertThrows(
    () => collectEvents("</orphan>"),
    XmlSyntaxError,
    "Unexpected closing tag </orphan> with no matching opening tag",
  );
});

Deno.test("XmlEventParser.process() throws on unclosed element", () => {
  assertThrows(
    () => collectEvents("<root>"),
    XmlSyntaxError,
    "Unclosed element <root>",
  );
});

Deno.test("XmlEventParser.process() throws on deeply nested unclosed element", () => {
  assertThrows(
    () => collectEvents("<root><child><grandchild></grandchild></child>"),
    XmlSyntaxError,
    "Unclosed element <root>",
  );
});

Deno.test("XmlEventParser.process() throws on multiple top-level elements after self-closing", () => {
  assertThrows(
    () => collectEvents("<root/></extra>"),
    XmlSyntaxError,
    "Unexpected closing tag </extra>",
  );
});

// =============================================================================
// Position Tracking (Parser-specific - verifies propagation)
// =============================================================================

Deno.test("XmlEventParser.process() tracks position for start elements", () => {
  const events = collectEvents("<root/>");

  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[0]!.line, 1);
  assertEquals(events[0]!.column, 1);
  assertEquals(events[0]!.offset, 0);
});

Deno.test("XmlEventParser.process() tracks position on multiple lines", () => {
  const events = collectEvents("<root>\n  <child/>\n</root>");

  const child = events.find(
    (e) => e.type === "start_element" && e.name?.local === "child",
  );
  assertEquals(child?.line, 2);
  assertEquals(child?.column, 3);
});

Deno.test("XmlEventParser.process() tracks position for declaration", () => {
  const events = collectEvents('<?xml version="1.0"?><root/>');

  assertEquals(events[0]!.type, "declaration");
  assertEquals(events[0]!.line, 1);
  assertEquals(events[0]!.column, 1);
  assertEquals(events[0]!.offset, 0);
});

// =============================================================================
// Additional coverage: Declaration with encoding and standalone
// =============================================================================

Deno.test("XmlEventParser.process() propagates declaration encoding", () => {
  const events = collectEvents(
    '<?xml version="1.0" encoding="UTF-8"?><root/>',
  );

  assertEquals(events[0]!.type, "declaration");
  assertEquals(events[0]!.encoding, "UTF-8");
});

Deno.test("XmlEventParser.process() propagates declaration standalone", () => {
  const events = collectEvents(
    '<?xml version="1.0" standalone="yes"?><root/>',
  );

  assertEquals(events[0]!.type, "declaration");
  assertEquals(events[0]!.standalone, "yes");
});

// =============================================================================
// Additional coverage: Processing instruction events (not filtered)
// =============================================================================

Deno.test("XmlEventParser.process() emits processing instruction events by default", () => {
  const events = collectEvents(
    '<?xml-stylesheet href="style.xsl"?><root/>',
  );

  assertEquals(events[0]!.type, "processing_instruction");
  assertEquals(events[0]!.target, "xml-stylesheet");
  assertEquals(events[0]!.content, 'href="style.xsl"');
  assertEquals(events[0]!.line, 1);
  assertEquals(events[0]!.column, 1);
  assertEquals(events[0]!.offset, 0);
});

Deno.test("XmlEventParser.process() emits multiple processing instructions", () => {
  const events = collectEvents(
    "<?pi1 data1?><?pi2 data2?><root/>",
  );

  const pis = events.filter((e) => e.type === "processing_instruction");
  assertEquals(pis.length, 2);
});

// =============================================================================
// Additional coverage: DOCTYPE handling
// =============================================================================

Deno.test("XmlEventParser.process() silently consumes DOCTYPE", () => {
  const events = collectEvents("<!DOCTYPE html><root/>");

  // DOCTYPE should not appear in events - only start_element and end_element
  assertEquals(events.length, 2);
  assertEquals(events[0]!.type, "start_element");
  assertEquals(events[1]!.type, "end_element");
});

// =============================================================================
// Resource exhaustion limits: maxDepth / maxAttributes
// =============================================================================

Deno.test("XmlEventParser.process() throws when nesting exceeds maxDepth", () => {
  assertThrows(
    () => collectEvents("<a><b><c></c></b></a>", { maxDepth: 2 }),
    XmlSyntaxError,
    "Element nesting depth exceeds limit of 2",
  );
});

Deno.test("XmlEventParser.process() allows nesting within maxDepth", () => {
  const events = collectEvents("<a><b><c/></b></a>", { maxDepth: 3 });
  assertEquals(events.filter((e) => e.type === "start_element").length, 3);
});

Deno.test("XmlEventParser.process() throws when attributes exceed maxAttributes", () => {
  assertThrows(
    () => collectEvents('<root a="1" b="2" c="3"/>', { maxAttributes: 2 }),
    XmlSyntaxError,
    "Attribute count exceeds limit of 2",
  );
});

Deno.test("XmlEventParser.process() allows attributes within maxAttributes", () => {
  const events = collectEvents('<root a="1" b="2"/>', { maxAttributes: 2 });
  assertEquals(events[0]!.attributes?.length, 2);
});

// =============================================================================
// Attribute duplicate detection: Set-based path (32+ attributes)
// =============================================================================

Deno.test("XmlEventParser.process() detects duplicate among 32+ attributes", () => {
  const attrs = Array.from(
    { length: 33 },
    (_, i) => `a${i}="v"`,
  ).join(" ");
  // Duplicate the first attribute at the end
  const xml = `<root ${attrs} a0="dup"/>`;
  assertThrows(
    () => collectEvents(xml),
    XmlSyntaxError,
    "Duplicate attribute 'a0'",
  );
});

Deno.test("XmlEventParser.process() parses 33 unique attributes", () => {
  const attrs = Array.from(
    { length: 33 },
    (_, i) => `a${i}="v${i}"`,
  ).join(" ");
  const xml = `<root ${attrs}/>`;
  const events = collectEvents(xml);
  assertEquals(events[0]!.attributes?.length, 33);
});

// =============================================================================
// PI target namespace constraint
// =============================================================================

Deno.test("XmlEventParser.process() throws on PI target with colon", () => {
  assertThrows(
    () => collectEvents("<?foo:bar data?><root/>"),
    XmlSyntaxError,
    "Cannot use ':' in processing instruction target",
  );
});

// =============================================================================
// Finalize without root element
// =============================================================================

Deno.test("XmlEventParser.process() throws on finalize with no root element", () => {
  assertThrows(
    () => collectEvents(""),
    XmlSyntaxError,
    "No root element found in XML document",
  );
});

// =============================================================================
// Namespace expanded-name: same local name, different URIs
// =============================================================================

Deno.test("XmlEventParser.process() allows same local name with different namespace URIs", () => {
  const xml =
    '<root xmlns:a="http://a.com" xmlns:b="http://b.com" a:x="1" b:x="2"/>';
  const events = collectEvents(xml);
  const attrs = events[0]!.attributes!;
  const aX = attrs.find((a) => a.name.raw === "a:x");
  const bX = attrs.find((a) => a.name.raw === "b:x");
  assertEquals(aX?.name.uri, "http://a.com");
  assertEquals(bX?.name.uri, "http://b.com");
});
