// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal synchronous XML parser for non-streaming use.
 *
 * This module provides a high-performance single-pass parser that directly
 * builds the XML tree without intermediate tokens or events. It is used by
 * the `parse()` function for parsing complete XML strings.
 *
 * For streaming parsing, use {@linkcode parseXmlStream} from `parse_stream.ts`.
 *
 * @module
 */

import type {
  ParseOptions,
  XmlCDataNode,
  XmlCommentNode,
  XmlDeclarationEvent,
  XmlDocument,
  XmlElement,
  XmlName,
  XmlNode,
  XmlTextNode,
} from "./types.ts";
import { XmlSyntaxError } from "./types.ts";
import { decodeEntities } from "./_entities.ts";
import {
  ENCODING_RE,
  LINE_ENDING_RE,
  parseName,
  STANDALONE_RE,
  VERSION_RE,
  WHITESPACE_ONLY_RE,
} from "./_common.ts";

// Character codes for hot path optimization
const CC_LT = 60; // <
const CC_GT = 62; // >
const CC_SLASH = 47; // /
const CC_BANG = 33; // !
const CC_QUESTION = 63; // ?
const CC_EQ = 61; // =
const CC_DQUOTE = 34; // "
const CC_SQUOTE = 39; // '
const CC_LBRACKET = 91; // [
const CC_RBRACKET = 93; // ]
const CC_DASH = 45; // -

/** Internal mutable type for building the tree. */
type MutableElement = {
  type: "element";
  name: XmlName;
  attributes: Record<string, string>;
  children: XmlNode[];
};

/**
 * Synchronous single-pass XML parser.
 *
 * Directly builds the XML tree without intermediate tokens or events,
 * providing significant performance improvements over the streaming parser
 * for non-streaming use cases.
 *
 * Uses lazy position tracking: line/column are only computed when an error
 * occurs, eliminating tracking overhead during successful parsing.
 *
 * @param xml The XML string to parse.
 * @param options Options to control parsing behavior.
 * @returns The parsed document.
 * @throws {XmlSyntaxError} If the XML is malformed.
 */
export function parseSync(xml: string, options?: ParseOptions): XmlDocument {
  const ignoreWhitespace = options?.ignoreWhitespace ?? false;
  const ignoreComments = options?.ignoreComments ?? false;
  const trackPosition = options?.trackPosition ?? true;

  // Normalize line endings (XML 1.0 §2.11)
  const input = xml.includes("\r") ? xml.replace(LINE_ENDING_RE, "\n") : xml;
  const len = input.length;

  // Parser state - only track position offset, not line/column
  let pos = 0;

  // Tree building state
  const stack: MutableElement[] = [];
  let root: MutableElement | undefined;
  let declaration: XmlDeclarationEvent | undefined;

  /**
   * Compute line and column from offset on-demand (lazy position tracking).
   * Only called when an error occurs, avoiding overhead during successful parsing.
   */
  function computePosition(offset: number): {
    line: number;
    column: number;
    offset: number;
  } {
    if (!trackPosition) {
      return { line: 0, column: 0, offset: 0 };
    }
    let line = 1;
    let lastNlPos = -1;
    let searchStart = 0;
    while (true) {
      const nlPos = input.indexOf("\n", searchStart);
      if (nlPos === -1 || nlPos >= offset) break;
      line++;
      lastNlPos = nlPos;
      searchStart = nlPos + 1;
    }
    return {
      line,
      column: offset - lastNlPos,
      offset,
    };
  }

  function error(message: string): never {
    throw new XmlSyntaxError(message, computePosition(pos));
  }

  function errorUnterminated(message: string): never {
    pos = len;
    error(message);
  }

  function skipWhitespace(): void {
    while (pos < len) {
      const code = input.charCodeAt(pos);
      if (code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d) {
        pos++;
      } else {
        break;
      }
    }
  }

  function readName(): string {
    const start = pos;
    while (pos < len) {
      const code = input.charCodeAt(pos);
      // NameChar: a-z, A-Z, 0-9, _, :, ., -, or >127 (non-ASCII)
      if (
        (code >= 97 && code <= 122) || // a-z
        (code >= 65 && code <= 90) || // A-Z
        (code >= 48 && code <= 57) || // 0-9
        code === 95 || // _
        code === 58 || // :
        code === 46 || // .
        code === 45 || // -
        code > 127 // non-ASCII
      ) {
        pos++;
      } else {
        break;
      }
    }
    return input.slice(start, pos);
  }

  function readQuotedValue(): string {
    const quoteCode = input.charCodeAt(pos);
    if (quoteCode !== CC_DQUOTE && quoteCode !== CC_SQUOTE) {
      error("Expected quote to start attribute value");
    }
    const quoteChar = input[pos]!;
    const start = pos + 1;

    const closeIdx = input.indexOf(quoteChar, start);
    if (closeIdx === -1) {
      pos = len;
      error("Unterminated attribute value");
    }

    const raw = input.slice(start, closeIdx);

    // Validate: '<' not allowed in attribute values (XML 1.0 §3.1)
    if (raw.includes("<")) {
      // Find exact position for error reporting
      pos = start + raw.indexOf("<");
      error("'<' not allowed in attribute value");
    }

    pos = closeIdx + 1;

    // Normalize whitespace (§3.3.3) and decode entities
    return decodeEntities(raw.replace(/[\t\n]/g, " "));
  }

  function readText(): string {
    const start = pos;
    const idx = input.indexOf("<", pos);
    pos = idx === -1 ? len : idx;
    return decodeEntities(input.slice(start, pos));
  }

  function addNode(node: XmlTextNode | XmlCDataNode | XmlCommentNode): void {
    if (stack.length > 0) {
      stack[stack.length - 1]!.children.push(node);
    }
  }

  // Main parsing loop
  while (pos < len) {
    // Handle text content first (early continue)
    if (input.charCodeAt(pos) !== CC_LT) {
      const text = readText();
      if (!(ignoreWhitespace && WHITESPACE_ONLY_RE.test(text))) {
        addNode({ type: "text", text });
      }
      continue;
    }

    pos++; // Skip '<'

    if (pos >= len) {
      error("Unexpected end of input after '<'");
    }

    const code = input.charCodeAt(pos);

    // End tag: </name>
    if (code === CC_SLASH) {
      pos++; // Skip '/'
      const name = readName();
      skipWhitespace();
      if (input.charCodeAt(pos) !== CC_GT) {
        error("Expected '>' in end tag");
      }
      pos++; // Skip '>'

      const expected = stack.pop();
      if (!expected) {
        error(`Unexpected closing tag </${name}>`);
      }

      // Compare raw strings directly - equivalent to comparing prefix+local
      // since XmlName.raw preserves the exact input to parseName()
      if (expected.name.raw !== name) {
        error(
          `Mismatched closing tag: expected </${expected.name.raw}> but found </${name}>`,
        );
      }
      continue;
    }

    // Comment, CDATA, or DOCTYPE
    if (code === CC_BANG) {
      pos++; // Skip '!'

      // Comment: <!--...-->
      if (
        pos + 1 < len &&
        input.charCodeAt(pos) === CC_DASH &&
        input.charCodeAt(pos + 1) === CC_DASH
      ) {
        pos += 2; // Skip '--'
        const start = pos;

        const endIdx = input.indexOf("-->", pos);
        if (endIdx === -1) errorUnterminated("Unterminated comment");

        if (!ignoreComments) {
          addNode({ type: "comment", text: input.slice(start, endIdx) });
        }
        pos = endIdx + 3;
        continue;
      }

      // CDATA: <![CDATA[...]]>
      if (pos + 6 < len && input.slice(pos, pos + 7) === "[CDATA[") {
        pos += 7; // Skip '[CDATA['
        const start = pos;

        const endIdx = input.indexOf("]]>", pos);
        if (endIdx === -1) errorUnterminated("Unterminated CDATA section");

        addNode({ type: "cdata", text: input.slice(start, endIdx) });
        pos = endIdx + 3;
        continue;
      }

      // DOCTYPE: <!DOCTYPE...>
      if (pos + 6 < len && input.slice(pos, pos + 7) === "DOCTYPE") {
        pos += 7; // Skip 'DOCTYPE'

        // Skip DOCTYPE content (we don't use it for tree building)
        while (pos < len && input.charCodeAt(pos) !== CC_GT) {
          if (input.charCodeAt(pos) === CC_LBRACKET) {
            // Internal subset - skip until matching ]
            let depth = 1;
            pos++;
            while (pos < len && depth > 0) {
              const dc = input.charCodeAt(pos);
              if (dc === CC_LBRACKET) depth++;
              else if (dc === CC_RBRACKET) depth--;
              pos++;
            }
          } else {
            pos++;
          }
        }
        if (pos < len) pos++; // Skip '>'
        continue;
      }

      error("Unsupported markup declaration");
    }

    // Processing instruction or XML declaration: <?target content?>
    if (code === CC_QUESTION) {
      pos++; // Skip '?'
      const target = readName();
      const contentStart = pos;

      const endIdx = input.indexOf("?>", pos);
      if (endIdx === -1) {
        errorUnterminated("Unterminated processing instruction");
      }

      const content = input.slice(contentStart, endIdx).trim();
      pos = endIdx + 2;

      // Direct comparison (6x faster than toLowerCase)
      if (target === "xml" || target === "XML") {
        const versionMatch = VERSION_RE.exec(content);
        const encodingMatch = ENCODING_RE.exec(content);
        const standaloneMatch = STANDALONE_RE.exec(content);

        declaration = {
          type: "declaration",
          version: versionMatch?.[1] ?? versionMatch?.[2] ?? "1.0",
          line: trackPosition ? 1 : 0,
          column: trackPosition ? 1 : 0,
          offset: 0,
          ...(encodingMatch && {
            encoding: encodingMatch[1] ?? encodingMatch[2],
          }),
          ...(standaloneMatch && {
            standalone: (standaloneMatch[1] ?? standaloneMatch[2]) as
              | "yes"
              | "no",
          }),
        };
      }
      // Other PIs are ignored for tree building
      continue;
    }

    // Start tag: <name attributes...> or <name attributes.../>
    const name = readName();
    if (name === "") {
      error(`Unexpected character '${String.fromCharCode(code)}' after '<'`);
    }

    const elementName = parseName(name);
    const attributes: Record<string, string> = {};
    let selfClosing = false;

    // Read attributes
    while (true) {
      skipWhitespace();
      if (pos >= len) {
        error("Unexpected end of input in start tag");
      }

      const chCode = input.charCodeAt(pos);

      if (chCode === CC_GT) {
        pos++; // Skip '>'
        break;
      }

      if (chCode === CC_SLASH) {
        pos++; // Skip '/'
        if (input.charCodeAt(pos) !== CC_GT) {
          error("Expected '>' after '/' in self-closing tag");
        }
        pos++; // Skip '>'
        selfClosing = true;
        break;
      }

      // Read attribute
      const attrName = readName();
      if (attrName === "") {
        error(
          `Unexpected character '${String.fromCharCode(chCode)}' in start tag`,
        );
      }

      skipWhitespace();
      if (input.charCodeAt(pos) !== CC_EQ) {
        error("Expected '=' after attribute name");
      }
      pos++; // Skip '='
      skipWhitespace();

      const attrValue = readQuotedValue();
      const parsedAttrName = parseName(attrName);
      attributes[parsedAttrName.local] = attrValue;
    }

    // Create element
    const element: MutableElement = {
      type: "element",
      name: elementName,
      attributes,
      children: [],
    };

    if (stack.length > 0) {
      stack[stack.length - 1]!.children.push(element as XmlElement);
    } else if (!root) {
      root = element;
    }

    // Only push non-self-closing elements to stack
    if (!selfClosing) {
      stack.push(element);
    }
  }

  // Check for unclosed elements
  if (stack.length > 0) {
    error(`Unclosed element <${stack[stack.length - 1]!.name.raw}>`);
  }

  if (!root) {
    throw new XmlSyntaxError(
      "No root element found in XML document",
      trackPosition
        ? { line: 1, column: 1, offset: 0 }
        : { line: 0, column: 0, offset: 0 },
    );
  }

  return {
    ...(declaration !== undefined && { declaration }),
    root: root as XmlElement,
  };
}
