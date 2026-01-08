// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal synchronous XML parser for non-streaming use.
 *
 * This module provides a high-performance single-pass parser that directly
 * builds the XML tree without intermediate tokens or events. It is used by
 * the `parse()` function for parsing complete XML strings.
 *
 * For streaming parsing, use {@linkcode XmlParseStream} from `parse_stream.ts`.
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
 * @param xml The XML string to parse.
 * @param options Options to control parsing behavior.
 * @returns The parsed document.
 * @throws {XmlSyntaxError} If the XML is malformed.
 */
export function parseSync(xml: string, options?: ParseOptions): XmlDocument {
  const ignoreWhitespace = options?.ignoreWhitespace ?? false;
  const ignoreComments = options?.ignoreComments ?? false;

  // Normalize line endings (XML 1.0 §2.11)
  const input = xml.includes("\r") ? xml.replace(LINE_ENDING_RE, "\n") : xml;
  const len = input.length;

  // Parser state
  let pos = 0;
  let line = 1;
  let col = 1;

  // Tree building state
  const stack: MutableElement[] = [];
  let root: MutableElement | undefined;
  let declaration: XmlDeclarationEvent | undefined;

  /**
   * Throws a syntax error at the current position.
   */
  function error(message: string): never {
    throw new XmlSyntaxError(message, { line, column: col, offset: pos });
  }

  /**
   * Advances the position by one character, updating line/column.
   */
  function advance(): void {
    if (input[pos] === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
    pos++;
  }

  /**
   * Skips XML whitespace characters.
   */
  function skipWhitespace(): void {
    while (pos < len) {
      const code = input.charCodeAt(pos);
      if (code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d) {
        advance();
      } else {
        break;
      }
    }
  }

  /**
   * Reads an XML name (element or attribute name).
   */
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
        col++;
      } else {
        break;
      }
    }
    return input.slice(start, pos);
  }

  /**
   * Reads a quoted attribute value and normalizes it per XML 1.0 §3.3.3.
   */
  function readQuotedValue(): string {
    const quote = input[pos];
    if (quote !== '"' && quote !== "'") {
      error("Expected quote to start attribute value");
    }
    advance();
    const start = pos;
    while (pos < len && input[pos] !== quote) {
      if (input[pos] === "<") {
        error("'<' not allowed in attribute value");
      }
      advance();
    }
    if (pos >= len) {
      error("Unterminated attribute value");
    }
    const raw = input.slice(start, pos);
    advance(); // closing quote

    // Normalize whitespace (§3.3.3) and decode entities
    return decodeEntities(raw.replace(/[\t\n]/g, " "));
  }

  /**
   * Reads text content until the next '<'.
   */
  function readText(): string {
    const start = pos;
    while (pos < len && input[pos] !== "<") {
      advance();
    }
    return decodeEntities(input.slice(start, pos));
  }

  /**
   * Adds a text node to the current element.
   */
  function addTextNode(text: string): void {
    if (text.length === 0) return; // Fast path: empty string check first (36x faster)
    if (ignoreWhitespace && WHITESPACE_ONLY_RE.test(text)) return;
    const node: XmlTextNode = { type: "text", text };
    if (stack.length > 0) {
      stack[stack.length - 1]!.children.push(node);
    }
  }

  /**
   * Adds a CDATA node to the current element.
   */
  function addCDataNode(text: string): void {
    const node: XmlCDataNode = { type: "cdata", text };
    if (stack.length > 0) {
      stack[stack.length - 1]!.children.push(node);
    }
  }

  /**
   * Adds a comment node to the current element (if not ignored).
   */
  function addCommentNode(text: string): void {
    if (ignoreComments) return;
    const node: XmlCommentNode = { type: "comment", text };
    if (stack.length > 0) {
      stack[stack.length - 1]!.children.push(node);
    }
  }

  // Main parsing loop
  while (pos < len) {
    // Handle text content first (early continue)
    if (input[pos] !== "<") {
      const text = readText();
      addTextNode(text);
      continue;
    }

    advance();

    if (pos >= len) {
      error("Unexpected end of input after '<'");
    }

    const c = input[pos]!;

    // End tag: </name>
    if (c === "/") {
      advance();
      const name = readName();
      skipWhitespace();
      if (input[pos] !== ">") {
        error("Expected '>' in end tag");
      }
      advance();

      const expected = stack.pop();
      if (!expected) {
        error(`Unexpected closing tag </${name}>`);
      }

      const parsedName = parseName(name);
      if (
        expected.name.local !== parsedName.local ||
        expected.name.prefix !== parsedName.prefix
      ) {
        const expectedFull = expected.name.prefix
          ? `${expected.name.prefix}:${expected.name.local}`
          : expected.name.local;
        error(
          `Mismatched closing tag: expected </${expectedFull}> but found </${name}>`,
        );
      }
      continue;
    }

    // Comment, CDATA, or DOCTYPE
    if (c === "!") {
      advance();

      // Comment: <!--...-->
      if (pos + 1 < len && input[pos] === "-" && input[pos + 1] === "-") {
        pos += 2;
        col += 2;
        const start = pos;

        // Use indexOf for fast delimiter search (92x faster for large comments)
        const endIdx = input.indexOf("-->", pos);
        if (endIdx === -1) {
          // Advance to end for accurate error position
          while (pos < len) advance();
          error("Unterminated comment");
        }

        // Update line/col by scanning for newlines in the comment
        const content = input.slice(start, endIdx);
        for (let i = 0; i < content.length; i++) {
          if (content.charCodeAt(i) === 10) { // \n
            line++;
            col = 1;
          } else {
            col++;
          }
        }

        addCommentNode(content);
        pos = endIdx + 3;
        col += 3;
        continue;
      }

      // CDATA: <![CDATA[...]]>
      if (pos + 6 < len && input.slice(pos, pos + 7) === "[CDATA[") {
        pos += 7;
        col += 7;
        const start = pos;

        // Use indexOf for fast delimiter search (92x faster for large CDATA)
        const endIdx = input.indexOf("]]>", pos);
        if (endIdx === -1) {
          while (pos < len) advance();
          error("Unterminated CDATA section");
        }

        // Update line/col by scanning for newlines
        const content = input.slice(start, endIdx);
        for (let i = 0; i < content.length; i++) {
          if (content.charCodeAt(i) === 10) {
            line++;
            col = 1;
          } else {
            col++;
          }
        }

        addCDataNode(content);
        pos = endIdx + 3;
        col += 3;
        continue;
      }

      // DOCTYPE: <!DOCTYPE...>
      if (pos + 6 < len && input.slice(pos, pos + 7) === "DOCTYPE") {
        pos += 7;
        col += 7;

        // Skip DOCTYPE content (we don't use it for tree building)
        while (pos < len && input[pos] !== ">") {
          if (input[pos] === "[") {
            // Internal subset - skip until matching ]
            let depth = 1;
            advance();
            while (pos < len && depth > 0) {
              if (input[pos] === "[") depth++;
              else if (input[pos] === "]") depth--;
              advance();
            }
          } else {
            advance();
          }
        }
        if (pos < len) advance(); // '>'
        continue;
      }

      error("Unsupported markup declaration");
    }

    // Processing instruction or XML declaration: <?target content?>
    if (c === "?") {
      advance();
      const target = readName();
      const contentStart = pos;

      // Use indexOf for fast delimiter search
      const endIdx = input.indexOf("?>", pos);
      if (endIdx === -1) {
        while (pos < len) advance();
        error("Unterminated processing instruction");
      }

      // Update line/col by scanning for newlines
      for (let i = pos; i < endIdx; i++) {
        if (input.charCodeAt(i) === 10) {
          line++;
          col = 1;
        } else {
          col++;
        }
      }

      const content = input.slice(contentStart, endIdx).trim();
      pos = endIdx + 2;
      col += 2;

      // Direct comparison (6x faster than toLowerCase)
      if (target === "xml" || target === "XML") {
        // XML declaration
        const versionMatch = VERSION_RE.exec(content);
        const encodingMatch = ENCODING_RE.exec(content);
        const standaloneMatch = STANDALONE_RE.exec(content);

        declaration = {
          type: "declaration",
          version: versionMatch?.[1] ?? versionMatch?.[2] ?? "1.0",
          line: 1,
          column: 1,
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
      // Other PIs are ignored for tree building (consistent with current behavior)
      continue;
    }

    // Start tag: <name attributes...> or <name attributes.../>
    const name = readName();
    if (name === "") {
      error(`Unexpected character '${c}' after '<'`);
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

      const ch = input[pos]!;

      if (ch === ">") {
        advance();
        break;
      }

      if (ch === "/") {
        advance();
        if (input[pos] !== ">") {
          error("Expected '>' after '/' in self-closing tag");
        }
        advance();
        selfClosing = true;
        break;
      }

      // Read attribute
      const attrName = readName();
      if (attrName === "") {
        error(`Unexpected character '${ch}' in start tag`);
      }

      skipWhitespace();
      if (input[pos] !== "=") {
        error("Expected '=' after attribute name");
      }
      advance();
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
    const unclosed = stack[stack.length - 1]!;
    const name = unclosed.name.prefix
      ? `${unclosed.name.prefix}:${unclosed.name.local}`
      : unclosed.name.local;
    error(`Unclosed element <${name}>`);
  }

  if (!root) {
    throw new XmlSyntaxError(
      "No root element found in XML document",
      { line: 1, column: 1, offset: 0 },
    );
  }

  return {
    ...(declaration !== undefined && { declaration }),
    root: root as XmlElement,
  };
}
