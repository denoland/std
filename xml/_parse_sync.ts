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
  isReservedPiTarget,
  LINE_ENDING_RE,
  parseName,
  validateNamespaceBinding,
  validateQName,
  validateXmlDeclaration,
  WHITESPACE_ONLY_RE,
  XML_NAMESPACE,
} from "./_common.ts";
import { isNameChar, isNameStartChar } from "./_name_chars.ts";

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

// =============================================================================
// XML 1.0 CHARACTER VALIDATION
// =============================================================================

/**
 * Lookup table for C0 control characters (0x00-0x1F).
 * Valid XML 1.0 Char in this range: #x9 (TAB), #xA (LF), #xD (CR)
 * All others are illegal.
 */
const C0_VALID = new Uint8Array(32);
C0_VALID[0x09] = 1; // TAB
C0_VALID[0x0A] = 1; // LF
C0_VALID[0x0D] = 1; // CR

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
  let rootClosed = false; // Track whether root element has been closed

  // Namespace tracking (lazy initialization for performance)
  // Only created when first namespace prefix is encountered
  // Using object wrapper to avoid TypeScript control flow narrowing issues with error()
  const ns: { bindings: Map<string, string> | null } = { bindings: null };
  // Stack of namespace bindings per element scope (array of [prefix, previousUri] tuples)
  // Used to restore bindings when element closes
  const nsStack: Array<Array<[string, string | undefined]>> = [];
  // Reusable empty array to avoid allocations for elements without namespace bindings
  const EMPTY_NS_SCOPE: Array<[string, string | undefined]> = [];

  /** Get or create namespace bindings map with xml prefix pre-bound */
  function getNsBindings(): Map<string, string> {
    if (!ns.bindings) {
      ns.bindings = new Map([["xml", XML_NAMESPACE]]);
    }
    return ns.bindings;
  }

  // Note: We do NOT expand custom entities from DTD.
  // We only support the 5 predefined XML entities: lt, gt, amp, apos, quot.
  // External entities (SYSTEM/PUBLIC) are also not supported.

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

  function isWhitespace(code: number): boolean {
    return code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
  }

  /**
   * Parse DTD internal subset with validation.
   * Validates whitespace requirements per XML 1.0 spec.
   */
  function parseDTDInternalSubset(): void {
    while (pos < len) {
      const code = input.charCodeAt(pos);

      if (code === CC_RBRACKET) {
        pos++;
        return; // End of internal subset
      }

      if (isWhitespace(code)) {
        // Batch-skip whitespace for better performance
        skipWhitespace();
        continue;
      }

      if (code === CC_LT) {
        pos++;
        if (pos >= len) {
          error("Unexpected end of input in DTD");
        }

        const nextCode = input.charCodeAt(pos);
        if (nextCode === CC_BANG) {
          pos++;
          parseDTDMarkupDeclaration();
        } else if (nextCode === CC_QUESTION) {
          pos++;
          // Processing instruction in DTD
          while (pos < len) {
            if (
              input.charCodeAt(pos) === CC_QUESTION &&
              pos + 1 < len &&
              input.charCodeAt(pos + 1) === CC_GT
            ) {
              pos += 2;
              break;
            }
            pos++;
          }
        } else {
          error(`Unexpected character '${input[pos]}' after '<' in DTD`);
        }
        continue;
      }

      if (code === CC_LBRACKET) {
        // Conditional sections are not allowed in internal subset
        error(
          "Conditional sections (INCLUDE/IGNORE) are not allowed in internal DTD subset",
        );
      }

      // Parameter entity reference: %name;
      // These are valid in internal subset and must be skipped
      if (code === 37) { // %
        pos++; // Skip %
        // Read the entity name
        while (pos < len) {
          const c = input.charCodeAt(pos);
          if (c === 59) { // ;
            pos++;
            break;
          }
          // Name characters
          if (
            (c >= 97 && c <= 122) || // a-z
            (c >= 65 && c <= 90) || // A-Z
            (c >= 48 && c <= 57) || // 0-9
            c === 95 || c === 58 || c === 46 || c === 45 || // _ : . -
            (c > 127 && isNameChar(c))
          ) {
            pos++;
            continue;
          }
          error("Invalid character in parameter entity reference");
        }
        continue;
      }

      error(`Unexpected character '${input[pos]}' in DTD internal subset`);
    }
    error("Unterminated DTD internal subset");
  }

  /**
   * Parse a DTD markup declaration (<!ENTITY, <!ELEMENT, <!ATTLIST, <!NOTATION, or comment).
   */
  function parseDTDMarkupDeclaration(): void {
    if (pos >= len) {
      error("Unexpected end of input in DTD declaration");
    }

    // Check for comment
    if (input.charCodeAt(pos) === CC_DASH) {
      pos++;
      if (pos >= len || input.charCodeAt(pos) !== CC_DASH) {
        error("Expected '--' to start comment in DTD");
      }
      pos++;
      // Skip comment content
      while (pos < len) {
        if (
          input.charCodeAt(pos) === CC_DASH &&
          pos + 1 < len &&
          input.charCodeAt(pos + 1) === CC_DASH
        ) {
          pos += 2;
          if (pos >= len || input.charCodeAt(pos) !== CC_GT) {
            error("'--' is not allowed within XML comments (XML 1.0 §2.5)");
          }
          pos++;
          return;
        }
        pos++;
      }
      error("Unterminated comment in DTD");
    }

    // Read declaration keyword (ENTITY, ELEMENT, ATTLIST, NOTATION)
    const kwStart = pos;
    while (
      pos < len &&
      ((input.charCodeAt(pos) >= 65 && input.charCodeAt(pos) <= 90) || // A-Z
        (input.charCodeAt(pos) >= 97 && input.charCodeAt(pos) <= 122)) // a-z
    ) {
      pos++;
    }
    const keyword = input.slice(kwStart, pos);

    if (
      keyword !== "ENTITY" && keyword !== "ELEMENT" &&
      keyword !== "ATTLIST" && keyword !== "NOTATION"
    ) {
      error(`Unknown DTD declaration type '<!${keyword}'`);
    }

    // Must have whitespace after keyword
    if (pos >= len || !isWhitespace(input.charCodeAt(pos))) {
      error(`Missing whitespace after '<!${keyword}'`);
    }

    // For ENTITY declarations, extract the entity name and value
    if (keyword === "ENTITY") {
      parseEntityDeclaration();
    } else {
      // Parse the rest of the declaration with whitespace validation
      parseDTDDeclarationContent();
    }
  }

  /**
   * Parse and validate an ENTITY declaration syntax.
   *
   * We do NOT expand custom entities from DTD
   * We only support the 5 predefined XML entities (lt, gt, amp, apos, quot).
   * External entities (SYSTEM/PUBLIC) are also not supported.
   *
   * This function validates syntax but does not store entity definitions.
   *
   * EntityDecl ::= GEDecl | PEDecl
   * GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'
   * PEDecl ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
   * EntityDef ::= EntityValue | (ExternalID NDataDecl?)
   * PEDef ::= EntityValue | ExternalID
   * ExternalID ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral
   * NDataDecl ::= S 'NDATA' S Name
   */
  function parseEntityDeclaration(): void {
    // Skip whitespace after ENTITY keyword (already validated by caller)
    skipWhitespace();

    // Check for parameter entity marker '%'
    const isParameterEntity = input.charCodeAt(pos) === 37; // %
    if (isParameterEntity) {
      pos++; // Skip '%'
      // Must have whitespace after '%'
      if (pos >= len || !isWhitespace(input.charCodeAt(pos))) {
        error("Missing whitespace after '%' in parameter entity declaration");
      }
      skipWhitespace();
    }

    // Read entity name
    const name = readName();
    if (name === "") {
      error("Missing entity name in ENTITY declaration");
    }

    // Must have whitespace after name
    if (pos >= len || !isWhitespace(input.charCodeAt(pos))) {
      error("Missing whitespace after entity name");
    }
    skipWhitespace();

    // Determine entity definition type
    const code = input.charCodeAt(pos);
    if (code === CC_DQUOTE || code === CC_SQUOTE) {
      // EntityValue - internal entity
      parseQuotedLiteral();

      // Check for SGML-style comment (-- after quoted value)
      skipWhitespace();
      if (
        pos + 1 < len &&
        input.charCodeAt(pos) === CC_DASH &&
        input.charCodeAt(pos + 1) === CC_DASH
      ) {
        error(
          "SGML-style comments (--) are not allowed in XML declarations",
        );
      }
    } else {
      // ExternalID - SYSTEM or PUBLIC
      const kwStart = pos;
      while (
        pos < len &&
        ((input.charCodeAt(pos) >= 65 && input.charCodeAt(pos) <= 90) || // A-Z
          (input.charCodeAt(pos) >= 97 && input.charCodeAt(pos) <= 122)) // a-z
      ) {
        pos++;
      }
      const keyword = input.slice(kwStart, pos);
      const keywordUpper = keyword.toUpperCase();

      // Check for case-sensitivity - must be uppercase
      if (keywordUpper === "SYSTEM" && keyword !== "SYSTEM") {
        error(`'${keyword}' must be uppercase 'SYSTEM'`);
      } else if (keywordUpper === "PUBLIC" && keyword !== "PUBLIC") {
        error(`'${keyword}' must be uppercase 'PUBLIC'`);
      }

      if (keyword === "SYSTEM") {
        // SYSTEM S SystemLiteral
        if (pos >= len || !isWhitespace(input.charCodeAt(pos))) {
          error("Missing whitespace after SYSTEM keyword");
        }
        skipWhitespace();
        parseQuotedLiteral();
      } else if (keyword === "PUBLIC") {
        // PUBLIC S PubidLiteral S SystemLiteral
        if (pos >= len || !isWhitespace(input.charCodeAt(pos))) {
          error("Missing whitespace after PUBLIC keyword");
        }
        skipWhitespace();
        parseQuotedLiteral(true); // PubidLiteral - validate characters

        // Must have whitespace before SystemLiteral
        if (pos >= len || !isWhitespace(input.charCodeAt(pos))) {
          error(
            "PUBLIC identifier requires both public ID and system ID literals",
          );
        }
        skipWhitespace();

        // SystemLiteral is required after PUBLIC
        const nextCode = input.charCodeAt(pos);
        if (nextCode !== CC_DQUOTE && nextCode !== CC_SQUOTE) {
          error(
            "PUBLIC identifier requires both public ID and system ID literals",
          );
        }
        parseQuotedLiteral();
      } else {
        error(
          `Expected SYSTEM, PUBLIC, or quoted string in ENTITY declaration, got '${
            keyword || input[pos]
          }'`,
        );
      }

      // Check for NDATA declaration (only for general entities, not parameter entities)
      skipWhitespace();
      if (pos < len && input.charCodeAt(pos) !== CC_GT) {
        // Check if we're about to see NDATA
        if (
          pos + 4 < len &&
          input.slice(pos, pos + 5) === "NDATA"
        ) {
          if (isParameterEntity) {
            error("Parameter entities cannot have NDATA declarations");
          }
          pos += 5; // Skip NDATA
          // Must have whitespace after NDATA
          if (pos >= len || !isWhitespace(input.charCodeAt(pos))) {
            error("Missing whitespace after NDATA keyword");
          }
          skipWhitespace();
          // Read notation name
          const notationName = readName();
          if (notationName === "") {
            error("Missing notation name after NDATA");
          }
        } else if (input.charCodeAt(pos) !== CC_GT) {
          // If not NDATA and not '>', check for missing whitespace before NDATA
          // This handles case like "foo.eps"NDATA (missing space)
          const remaining = input.slice(pos, Math.min(pos + 10, len));
          if (remaining.includes("NDATA")) {
            error("Missing whitespace before NDATA keyword");
          }
          error(`Unexpected content '${input[pos]}' in ENTITY declaration`);
        }
      }
    }

    // Skip optional trailing whitespace and expect '>'
    skipWhitespace();
    if (pos >= len || input.charCodeAt(pos) !== CC_GT) {
      error("Unterminated ENTITY declaration");
    }
    pos++; // Skip '>'
  }

  /**
   * Parse a quoted literal (single or double quoted).
   * @param validatePubid If true, validate as PubidLiteral per XML 1.0 §2.3
   */
  function parseQuotedLiteral(validatePubid = false): void {
    const quote = input.charCodeAt(pos);
    if (quote !== CC_DQUOTE && quote !== CC_SQUOTE) {
      error("Expected quoted string");
    }
    const quoteChar = String.fromCharCode(quote);
    pos++;
    const valueStart = pos;
    while (pos < len && input.charCodeAt(pos) !== quote) {
      pos++;
    }
    if (pos >= len) {
      error("Unterminated quoted string");
    }
    // Validate PubidLiteral if requested
    if (validatePubid) {
      validatePubidLiteral(input.slice(valueStart, pos), quoteChar);
    }
    pos++; // Skip closing quote
  }

  /**
   * Validates a PubidLiteral per XML 1.0 §2.3.
   * PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]
   *
   * Note: If quoted with ', the value cannot contain '.
   */
  function validatePubidLiteral(value: string, quoteChar: string): void {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const ch = value[i];
      // Valid PubidChar:
      // #x20 (space), #xD (CR), #xA (LF)
      // [a-zA-Z0-9]
      // [-'()+,./:=?;!*#@$_%]
      const isValid = code === 0x20 || // space
        code === 0x0D || // CR
        code === 0x0A || // LF
        (code >= 0x41 && code <= 0x5A) || // A-Z
        (code >= 0x61 && code <= 0x7A) || // a-z
        (code >= 0x30 && code <= 0x39) || // 0-9
        ch === "-" || ch === "(" || ch === ")" || ch === "+" ||
        ch === "," || ch === "." || ch === "/" || ch === ":" ||
        ch === "=" || ch === "?" || ch === ";" || ch === "!" ||
        ch === "*" || ch === "#" || ch === "@" || ch === "$" ||
        ch === "_" || ch === "%" ||
        (ch === "'" && quoteChar === '"'); // ' only allowed if quoted with "

      if (!isValid) {
        error(
          `Invalid character '${ch}' (U+${
            code.toString(16).toUpperCase().padStart(4, "0")
          }) in public ID literal`,
        );
      }
    }
  }

  /**
   * Parse DTD declaration content with whitespace validation.
   * Validates that quoted strings and parenthesized groups have proper whitespace.
   */
  function parseDTDDeclarationContent(): void {
    let sawWhitespace = true; // Start true since we just saw whitespace after keyword
    let parenDepth = 0;

    while (pos < len) {
      const code = input.charCodeAt(pos);

      if (code === CC_GT && parenDepth === 0) {
        pos++;
        return; // End of declaration
      }

      if (isWhitespace(code)) {
        sawWhitespace = true;
        pos++;
        continue;
      }

      if (code === CC_DQUOTE || code === CC_SQUOTE) {
        // Quoted string - must have whitespace before (unless inside parens)
        if (!sawWhitespace && parenDepth === 0) {
          error("Missing whitespace before quoted string in DTD declaration");
        }
        const quote = code;
        pos++;
        while (pos < len && input.charCodeAt(pos) !== quote) {
          pos++;
        }
        if (pos >= len) {
          error("Unterminated string in DTD declaration");
        }
        pos++; // Skip closing quote
        sawWhitespace = false;
        continue;
      }

      if (code === 40) { // (
        // Opening paren - must have whitespace before FIRST paren only
        // Nested parens like ((a|b)) are valid without whitespace between them
        if (!sawWhitespace && parenDepth === 0) {
          error("Missing whitespace before '(' in DTD declaration");
        }
        parenDepth++;
        sawWhitespace = false;
        pos++;
        continue;
      }

      if (code === 41) { // )
        if (parenDepth === 0) {
          error("Unexpected ')' in DTD declaration");
        }
        parenDepth--;
        sawWhitespace = false;
        pos++;
        continue;
      }

      if (code === 124) { // |
        sawWhitespace = false;
        pos++;
        continue;
      }

      if (code === 44) { // ,
        // Comma is valid in element content models (sequence operator)
        sawWhitespace = false;
        pos++;
        continue;
      }

      if (code === 35) { // #
        // #PCDATA, #IMPLIED, #REQUIRED, #FIXED - must have whitespace before
        if (!sawWhitespace && parenDepth === 0) {
          error("Missing whitespace before '#' in DTD declaration");
        }
        sawWhitespace = false;
        pos++;
        continue;
      }

      if (code === 37) { // %
        // Parameter entity reference
        sawWhitespace = false;
        pos++;
        continue;
      }

      if (code === 59) { // ;
        // End of entity reference
        sawWhitespace = false;
        pos++;
        continue;
      }

      // Name characters
      if (
        (code >= 97 && code <= 122) || // a-z
        (code >= 65 && code <= 90) || // A-Z
        (code >= 48 && code <= 57) || // 0-9
        code === 95 || // _
        code === 58 || // :
        code === 46 || // .
        code === 45 || // -
        (code > 127 && isNameChar(code))
      ) {
        sawWhitespace = false;
        pos++;
        continue;
      }

      if (code === CC_LBRACKET || code === CC_RBRACKET) {
        sawWhitespace = false;
        pos++;
        continue;
      }

      // Content model operators: *, +, ?
      if (code === 42 || code === 43 || code === 63) { // * + ?
        sawWhitespace = false;
        pos++;
        continue;
      }

      error(
        `Unexpected character '${input[pos]}' in DTD declaration`,
      );
    }
    error("Unterminated DTD declaration");
  }

  function readName(): string {
    const start = pos;

    // First character must be NameStartChar
    if (pos < len) {
      const firstCode = input.charCodeAt(pos);
      // Fast ASCII NameStartChar check
      if (
        (firstCode >= 97 && firstCode <= 122) || // a-z
        (firstCode >= 65 && firstCode <= 90) || // A-Z
        firstCode === 95 || // _
        firstCode === 58 // :
      ) {
        pos++;
      } else if (firstCode > 127) {
        // Non-ASCII: use codePointAt for proper surrogate pair handling
        // Astral plane characters (U+10000+) are represented as surrogate pairs
        const codePoint = input.codePointAt(pos)!;
        if (isNameStartChar(codePoint)) {
          // Advance by 1 for BMP chars, 2 for astral plane (surrogate pairs)
          pos += codePoint > 0xFFFF ? 2 : 1;
        } else {
          // Not a valid name start character
          return "";
        }
      } else {
        // Not a valid name start character
        return "";
      }
    }

    // Remaining characters: NameChar
    while (pos < len) {
      const code = input.charCodeAt(pos);
      // Fast ASCII NameChar check (inline for performance)
      if (
        (code >= 97 && code <= 122) || // a-z
        (code >= 65 && code <= 90) || // A-Z
        (code >= 48 && code <= 57) || // 0-9
        code === 95 || // _
        code === 58 || // :
        code === 46 || // .
        code === 45 // -
      ) {
        pos++;
        continue;
      }
      // Non-ASCII: use codePointAt for proper surrogate pair handling
      if (code > 127) {
        const codePoint = input.codePointAt(pos)!;
        if (isNameChar(codePoint)) {
          // Advance by 1 for BMP chars, 2 for astral plane (surrogate pairs)
          pos += codePoint > 0xFFFF ? 2 : 1;
          continue;
        }
      }
      break;
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
    // Note: Only predefined entities are expanded
    return decodeEntities(raw.replace(/[\t\n]/g, " "));
  }

  function readText(): string {
    const start = pos;
    const idx = input.indexOf("<", pos);
    const end = idx === -1 ? len : idx;

    // XML 1.0 §2.2: Validate characters are legal XML Char
    // Only check C0 control characters (0x00-0x1F) as they're the common issue
    // and checking every character would be too expensive
    for (let i = start; i < end; i++) {
      const code = input.charCodeAt(i);
      if (code < 0x20 && C0_VALID[code] !== 1) {
        pos = i;
        error(
          `Illegal XML character U+${
            code.toString(16).toUpperCase().padStart(4, "0")
          } (XML 1.0 §2.2)`,
        );
      }
    }

    pos = end;

    // Slice text once (reused for ]]> check and entity decoding)
    const text = input.slice(start, end);

    // XML 1.0 §2.4: "]]>" is not allowed in text content
    if (text.includes("]]>")) {
      pos = start + text.indexOf("]]>");
      error("']]>' is not allowed in text content (XML 1.0 §2.4)");
    }

    // Note: Only predefined entities are expanded
    return decodeEntities(text);
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
      const textStart = pos;
      const text = readText();
      const textEnd = pos;

      // XML 1.0 §2.8: Prolog and epilog only allow Misc, where:
      // Misc ::= Comment | PI | S
      // S is LITERAL whitespace only, not character/entity references
      const outsideRoot = !root || rootClosed;
      if (outsideRoot) {
        // Check raw text for any entity/character references
        const rawText = input.slice(textStart, textEnd);
        if (rawText.includes("&")) {
          pos = textStart + rawText.indexOf("&");
          error(
            "Character/entity references are not allowed in prolog/epilog (XML 1.0 §2.8)",
          );
        }
        // Check for non-whitespace content
        if (!WHITESPACE_ONLY_RE.test(text)) {
          pos = textStart;
          if (!root) {
            error(
              "Content is not allowed before the root element (XML 1.0 §2.8)",
            );
          } else {
            error(
              "Content is not allowed after the root element (XML 1.0 §2.8)",
            );
          }
        }
      }

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
      if (name === "") {
        error("Invalid character in end tag name");
      }
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

      // Restore namespace bindings from this element's scope
      const elementBindings = nsStack.pop();
      if (elementBindings && ns.bindings) {
        const bindings = ns.bindings; // Capture for TypeScript narrowing
        for (const [prefix, previousUri] of elementBindings) {
          if (previousUri === undefined) {
            bindings.delete(prefix);
          } else {
            bindings.set(prefix, previousUri);
          }
        }
      }

      // Track when root element closes
      if (stack.length === 0 && root) {
        rootClosed = true;
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

        const content = input.slice(start, endIdx);
        // XML 1.0 §2.5: "--" is not permitted within comments
        // Also, a single "-" cannot appear immediately before "-->"
        // (grammar: Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->')
        if (content.includes("--")) {
          pos = start + content.indexOf("--");
          error("'--' is not permitted within comments (XML 1.0 §2.5)");
        }
        // Check trailing dash before --> (e.g., "<!--->" or "<!-- comment --->")
        if (
          content.length > 0 &&
          content.charCodeAt(content.length - 1) === CC_DASH
        ) {
          pos = endIdx - 1; // Point to the trailing dash
          error("'-' is not permitted immediately before '-->' (XML 1.0 §2.5)");
        }

        // XML 1.0 §2.2: Validate characters are legal XML Char
        for (let i = start; i < endIdx; i++) {
          const charCode = input.charCodeAt(i);
          if (charCode < 0x20 && C0_VALID[charCode] !== 1) {
            pos = i;
            error(
              `Illegal XML character U+${
                charCode.toString(16).toUpperCase().padStart(4, "0")
              } (XML 1.0 §2.2)`,
            );
          }
        }

        if (!ignoreComments) {
          addNode({ type: "comment", text: content });
        }
        pos = endIdx + 3;
        continue;
      }

      // CDATA: <![CDATA[...]]>
      if (pos + 6 < len && input.slice(pos, pos + 7) === "[CDATA[") {
        // XML 1.0 §2.8: CDATA sections are only allowed within elements
        if (!root) {
          pos -= 2; // Point back to '<!'
          error(
            "CDATA section is not allowed before the root element (XML 1.0 §2.8)",
          );
        }
        if (rootClosed) {
          pos -= 2; // Point back to '<!'
          error(
            "CDATA section is not allowed after the root element (XML 1.0 §2.8)",
          );
        }

        pos += 7; // Skip '[CDATA['
        const start = pos;

        const endIdx = input.indexOf("]]>", pos);
        if (endIdx === -1) errorUnterminated("Unterminated CDATA section");

        // XML 1.0 §2.2: Validate characters are legal XML Char
        for (let i = start; i < endIdx; i++) {
          const charCode = input.charCodeAt(i);
          if (charCode < 0x20 && C0_VALID[charCode] !== 1) {
            pos = i;
            error(
              `Illegal XML character U+${
                charCode.toString(16).toUpperCase().padStart(4, "0")
              } (XML 1.0 §2.2)`,
            );
          }
        }

        addNode({ type: "cdata", text: input.slice(start, endIdx) });
        pos = endIdx + 3;
        continue;
      }

      // DOCTYPE: <!DOCTYPE...>
      if (pos + 6 < len && input.slice(pos, pos + 7) === "DOCTYPE") {
        pos += 7; // Skip 'DOCTYPE'

        // Skip whitespace before name (required)
        const wsBeforeName = pos;
        while (pos < len && isWhitespace(input.charCodeAt(pos))) pos++;
        if (pos === wsBeforeName) {
          error("Expected whitespace after DOCTYPE");
        }

        // Read DOCTYPE name (required)
        const nameStart = pos;
        while (pos < len) {
          const dc = input.charCodeAt(pos);
          if (isWhitespace(dc) || dc === CC_GT || dc === CC_LBRACKET) break;
          pos++;
        }
        if (pos === nameStart) {
          error("Missing name in DOCTYPE declaration");
        }

        // Skip whitespace and handle PUBLIC/SYSTEM or internal subset
        let expectPubidLiteral = false;
        let sawExternalIdKeyword = false; // Track if we've seen PUBLIC or SYSTEM
        while (pos < len && input.charCodeAt(pos) !== CC_GT) {
          const dc = input.charCodeAt(pos);

          if (isWhitespace(dc)) {
            pos++;
          } else if (dc === CC_LBRACKET) {
            // Internal subset - parse with validation
            pos++;
            parseDTDInternalSubset();
            expectPubidLiteral = false;
            sawExternalIdKeyword = false;
          } else if (dc === CC_DQUOTE || dc === CC_SQUOTE) {
            // Quoted string (public/system ID) - only allowed after PUBLIC/SYSTEM
            if (!sawExternalIdKeyword) {
              error(
                "Unexpected quoted string in DOCTYPE - expected PUBLIC or SYSTEM",
              );
            }
            const quote = dc;
            const quoteChar = String.fromCharCode(quote);
            pos++;
            const valueStart = pos;
            while (pos < len && input.charCodeAt(pos) !== quote) pos++;
            if (pos >= len) {
              error("Unterminated quoted string in DOCTYPE");
            }
            // Validate PubidLiteral if this is a PUBLIC ID
            if (expectPubidLiteral) {
              validatePubidLiteral(input.slice(valueStart, pos), quoteChar);
              expectPubidLiteral = false;
            }
            pos++; // Skip closing quote
          } else if (
            input.slice(pos, pos + 6) === "PUBLIC" &&
            (pos + 6 >= len || isWhitespace(input.charCodeAt(pos + 6)))
          ) {
            pos += 6;
            expectPubidLiteral = true;
            sawExternalIdKeyword = true;
          } else if (
            input.slice(pos, pos + 6) === "SYSTEM" &&
            (pos + 6 >= len || isWhitespace(input.charCodeAt(pos + 6)))
          ) {
            pos += 6;
            // SystemLiteral follows, but we don't need to validate it
            sawExternalIdKeyword = true;
          } else if (
            input.slice(pos, pos + 6).toUpperCase() === "PUBLIC" &&
            (pos + 6 >= len || isWhitespace(input.charCodeAt(pos + 6)))
          ) {
            // Case-insensitive match but wrong case
            error(
              `'${input.slice(pos, pos + 6)}' must be uppercase 'PUBLIC'`,
            );
          } else if (
            input.slice(pos, pos + 6).toUpperCase() === "SYSTEM" &&
            (pos + 6 >= len || isWhitespace(input.charCodeAt(pos + 6)))
          ) {
            // Case-insensitive match but wrong case
            error(
              `'${input.slice(pos, pos + 6)}' must be uppercase 'SYSTEM'`,
            );
          } else {
            // Other content
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
      // Save position of '<' for XML declaration position check
      // pos is currently pointing at '?', so '<' was at pos-1
      const ltPos = pos - 1;
      pos++; // Skip '?'
      const target = readName();
      if (target === "") {
        error("Invalid character in processing instruction target");
      }

      // XML Namespaces §3: PI targets must not contain colons
      if (target.includes(":")) {
        pos = ltPos + 2; // Point to start of target
        error(
          "Processing instruction target must not contain ':' (Namespaces §3)",
        );
      }

      // XML 1.0 §2.6: After PI target, must be whitespace, '?', or end
      // This catches invalid targets like "pitarget+++" where '+' is not a NameChar
      if (pos < len) {
        const afterTargetCode = input.charCodeAt(pos);
        if (
          afterTargetCode !== CC_QUESTION && // Not ?
          !isWhitespace(afterTargetCode) // Not whitespace
        ) {
          error(
            `Unexpected character '${
              String.fromCharCode(afterTargetCode)
            }' in processing instruction target`,
          );
        }
      }

      const contentStart = pos;

      const endIdx = input.indexOf("?>", pos);
      if (endIdx === -1) {
        errorUnterminated("Unterminated processing instruction");
      }

      // XML 1.0 §2.2: Validate characters in PI content are legal XML Char
      for (let i = contentStart; i < endIdx; i++) {
        const charCode = input.charCodeAt(i);
        if (charCode < 0x20 && C0_VALID[charCode] !== 1) {
          pos = i;
          error(
            `Illegal XML character U+${
              charCode.toString(16).toUpperCase().padStart(4, "0")
            } in processing instruction (XML 1.0 §2.2)`,
          );
        }
      }

      const content = input.slice(contentStart, endIdx).trim();
      pos = endIdx + 2;

      // XML 1.0 §2.6: PI targets that are case-variants of "xml" are reserved
      // Only exact lowercase "xml" is valid for XML declaration
      if (target === "xml") {
        // XML 1.0 §2.8: XML declaration must be at the very beginning
        // (only a UTF BOM may precede it)
        if (ltPos !== 0 && !(ltPos === 1 && input.charCodeAt(0) === 0xFEFF)) {
          pos = ltPos;
          error(
            "XML declaration must appear at the start of the document (XML 1.0 §2.8)",
          );
        }

        // Validate XML declaration syntax strictly
        const result = validateXmlDeclaration(content);
        if (!result.valid) {
          pos = ltPos;
          error(result.error);
        }

        declaration = {
          type: "declaration",
          version: result.version,
          line: trackPosition ? 1 : 0,
          column: trackPosition ? 1 : 0,
          offset: 0,
          ...(result.encoding !== undefined && { encoding: result.encoding }),
          ...(result.standalone !== undefined && {
            standalone: result.standalone,
          }),
        };
      } else if (isReservedPiTarget(target)) {
        // XML 1.0 §2.6: "xml" in any case variation is reserved
        pos = ltPos;
        error(
          `Processing instruction target '${target}' is reserved; 'xml' must be lowercase (XML 1.0 §2.6)`,
        );
      }
      // Other PIs are ignored for tree building
      continue;
    }

    // Start tag: <name attributes...> or <name attributes.../>
    const name = readName();
    if (name === "") {
      error(`Unexpected character '${String.fromCharCode(code)}' after '<'`);
    }

    // Validate QName syntax (Namespaces §3)
    const colonIndex = name.indexOf(":");
    const qnameError = validateQName(name, colonIndex);
    if (qnameError) {
      pos -= name.length;
      error(`Invalid element name '${name}': ${qnameError}`);
    }

    // Elements cannot use xmlns prefix (Namespaces 1.0 errata NE08)
    if (colonIndex !== -1 && name.slice(0, colonIndex) === "xmlns") {
      pos -= name.length;
      error("Element name cannot use the 'xmlns' prefix");
    }

    // XML 1.0 §2.8: Only one root element is allowed
    if (rootClosed) {
      pos -= name.length + 1; // Point back to '<'
      error("Only one root element is allowed (XML 1.0 §2.8)");
    }

    // Note: elementName is created after namespace processing below,
    // so we can include the resolved URI
    const attributes: Record<string, string> = Object.create(null);
    let selfClosing = false;

    // Read attributes
    // Track if we need whitespace before the next attribute
    let needsWhitespace = false;

    while (true) {
      const posBeforeWs = pos;
      skipWhitespace();
      const sawWhitespace = pos > posBeforeWs;

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

      // XML 1.0 §3.1: Whitespace is required between attributes
      if (needsWhitespace && !sawWhitespace) {
        error("Whitespace is required between attributes");
      }

      // Read attribute
      const attrName = readName();
      if (attrName === "") {
        error(
          `Unexpected character '${String.fromCharCode(chCode)}' in start tag`,
        );
      }

      // Validate QName syntax for attribute name (Namespaces §3)
      const attrColonIndex = attrName.indexOf(":");
      const attrQnameError = validateQName(attrName, attrColonIndex);
      if (attrQnameError) {
        pos -= attrName.length;
        error(`Invalid attribute name '${attrName}': ${attrQnameError}`);
      }

      skipWhitespace();
      if (input.charCodeAt(pos) !== CC_EQ) {
        error("Expected '=' after attribute name");
      }
      pos++; // Skip '='
      skipWhitespace();

      const attrValue = readQuotedValue();

      // Validate namespace binding if this is an xmlns attribute
      if (attrName === "xmlns" || attrName.startsWith("xmlns:")) {
        const nsError = validateNamespaceBinding(attrName, attrValue);
        if (nsError) {
          error(nsError);
        }
      }

      // XML 1.0 §3.1: Attribute names must be unique within a start-tag
      // Use full attribute name (with prefix) for duplicate detection to correctly
      // handle namespace-prefixed attributes like a:attr vs b:attr
      if (Object.hasOwn(attributes, attrName)) {
        error(`Duplicate attribute '${attrName}'`);
      }
      attributes[attrName] = attrValue;

      // After reading an attribute, whitespace is required before next attribute
      needsWhitespace = true;
    }

    // Process namespace declarations and validate prefix bindings
    // This must happen after all attributes are read
    const elementBindings: Array<[string, string | undefined]> = [];

    // First pass: collect namespace declarations from this element
    for (const attrName in attributes) {
      if (attrName === "xmlns") {
        // Default namespace - we don't track this for prefix validation
        continue;
      }
      if (attrName.startsWith("xmlns:")) {
        const prefix = attrName.slice(6); // After "xmlns:"
        const uri = attributes[attrName]!;
        const bindings = getNsBindings();
        // Save previous binding for restoration
        elementBindings.push([prefix, bindings.get(prefix)]);
        bindings.set(prefix, uri);
      }
    }

    // Push element's namespace scope (for restoration on close)
    if (!selfClosing) {
      // Use shared empty array to avoid allocation when no bindings
      nsStack.push(
        elementBindings.length > 0 ? elementBindings : EMPTY_NS_SCOPE,
      );
    }

    // Validate element prefix is bound (if it has one) and resolve URI
    let elementUri: string | undefined;
    if (colonIndex !== -1) {
      const prefix = name.slice(0, colonIndex);
      // xml prefix is always implicitly bound, xmlns prefix is handled separately
      if (prefix !== "xml" && prefix !== "xmlns") {
        if (!ns.bindings?.has(prefix)) {
          pos -= name.length;
          error(`Unbound namespace prefix '${prefix}' in element <${name}>`);
        }
        elementUri = ns.bindings!.get(prefix);
      } else if (prefix === "xml") {
        elementUri = XML_NAMESPACE;
      }
    }

    // Now create the element name with resolved URI
    const elementName = parseName(name, elementUri);

    // Validate attribute prefixes are bound and check for duplicate expanded names
    // Optimized: only do expensive expansion check when same local name appears with different prefixes
    let localNameToPrefixes: Map<string, string[]> | null = null;

    for (const attrName in attributes) {
      const attrColonIdx = attrName.indexOf(":");
      if (attrColonIdx !== -1) {
        const prefix = attrName.slice(0, attrColonIdx);
        // Skip xmlns: attributes (they declare, not use, prefixes)
        // xml prefix is always implicitly bound
        if (prefix !== "xmlns" && prefix !== "xml") {
          if (!ns.bindings?.has(prefix)) {
            error(
              `Unbound namespace prefix '${prefix}' in attribute '${attrName}'`,
            );
          }
          // Track local names for duplicate expanded name detection
          const localName = attrName.slice(attrColonIdx + 1);
          if (!localNameToPrefixes) {
            localNameToPrefixes = new Map();
          }
          const prefixes = localNameToPrefixes.get(localName);
          if (prefixes) {
            prefixes.push(prefix);
          } else {
            localNameToPrefixes.set(localName, [prefix]);
          }
        }
      }
    }

    // Check for duplicate expanded attribute names (Namespaces §6.3)
    // Only when same local name appears with multiple prefixes
    if (localNameToPrefixes && ns.bindings) {
      const bindings = ns.bindings; // Capture for TypeScript narrowing
      for (const [localName, prefixes] of localNameToPrefixes) {
        if (prefixes.length > 1) {
          // Multiple prefixes for same local name - check if any resolve to same URI
          const seenUris = new Set<string>();
          for (const prefix of prefixes) {
            const uri = bindings.get(prefix)!;
            if (seenUris.has(uri)) {
              error(
                `Duplicate expanded attribute name '{${uri}}${localName}'`,
              );
            }
            seenUris.add(uri);
          }
        }
      }
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
    } else if (stack.length === 0 && root === element) {
      // Self-closing root element
      rootClosed = true;
    }

    // For self-closing elements, restore namespace bindings immediately
    if (selfClosing && elementBindings.length > 0) {
      for (const [prefix, previousUri] of elementBindings) {
        if (previousUri === undefined) {
          ns.bindings!.delete(prefix);
        } else {
          ns.bindings!.set(prefix, previousUri);
        }
      }
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
