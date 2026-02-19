// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal XML tokenizer module.
 *
 * Implements a stateful streaming tokenizer that processes XML input chunk by chunk,
 * handling chunk boundaries and tracking position information.
 *
 * @module
 */

import {
  type XmlPosition,
  XmlSyntaxError,
  type XmlTokenCallbacks,
} from "./types.ts";
import {
  isReservedPiTarget,
  LINE_ENDING_REGEXP,
  validateXmlDeclaration,
} from "./_common.ts";
import { isNameChar, isNameStartChar } from "./_name_chars.ts";

/** Options for the XML tokenizer. */
interface XmlTokenizerOptions {
  /**
   * If true, track line/column positions for tokens and error messages.
   * Disabling position tracking improves performance by ~20%.
   *
   * @default {true}
   */
  readonly trackPosition?: boolean;
}

/** Tokenizer state machine states. */
const State = {
  /** Waiting for < or text content */
  INITIAL: 0,
  /** Just saw <, determining tag type */
  TAG_OPEN: 1,
  /** Reading element name after < */
  TAG_NAME: 2,
  /** Reading </element name */
  END_TAG_NAME: 3,
  /** Between tag name and > or attributes */
  AFTER_TAG_NAME: 4,
  /** Reading attribute name */
  ATTRIBUTE_NAME: 5,
  /** After attribute name, expecting = */
  AFTER_ATTRIBUTE_NAME: 6,
  /** After =, expecting quote */
  BEFORE_ATTRIBUTE_VALUE: 7,
  /** Reading attribute value (double quoted) */
  ATTRIBUTE_VALUE_DOUBLE: 8,
  /** Reading attribute value (single quoted) */
  ATTRIBUTE_VALUE_SINGLE: 9,
  /** Inside <![CDATA[...]]> */
  CDATA: 10,
  /** Inside <!--...--> */
  COMMENT: 11,
  /** Reading PI target name */
  PI_TARGET: 12,
  /** Reading PI content */
  PI_CONTENT: 13,
  /** After <! */
  MARKUP_DECLARATION: 14,
  /** After <!- */
  COMMENT_START: 15,
  /** After <![, expecting CDATA[ */
  CDATA_START: 16,
  /** After </element name, expecting > */
  AFTER_END_TAG_NAME: 17,
  /** Reading <!DOCTYPE */
  DOCTYPE_START: 18,
  /** Reading DOCTYPE name */
  DOCTYPE_NAME: 19,
  /** After DOCTYPE name, before PUBLIC/SYSTEM or > */
  DOCTYPE_AFTER_NAME: 20,
  /** Reading PUBLIC keyword */
  DOCTYPE_PUBLIC: 21,
  /** Reading public ID literal */
  DOCTYPE_PUBLIC_ID: 22,
  /** After public ID, expecting system ID */
  DOCTYPE_AFTER_PUBLIC_ID: 23,
  /** Reading SYSTEM keyword */
  DOCTYPE_SYSTEM: 24,
  /** Reading system ID literal */
  DOCTYPE_SYSTEM_ID: 25,
  /** Inside internal subset [...] */
  DOCTYPE_INTERNAL_SUBSET: 26,
  /** Inside quoted string in internal subset */
  DOCTYPE_INTERNAL_SUBSET_STRING: 27,
  /** After / in start tag, expecting > for self-closing */
  EXPECT_SELF_CLOSE_GT: 28,
  /** Inside comment, seen one - */
  COMMENT_DASH: 29,
  /** Inside comment, seen -- (expecting > or spec violation) */
  COMMENT_DASH_DASH: 30,
  /** Inside CDATA, seen one ] */
  CDATA_BRACKET: 31,
  /** Inside CDATA, seen ]] */
  CDATA_BRACKET_BRACKET: 32,
  /** Inside PI target, seen ? (expecting > for empty PI) */
  PI_TARGET_QUESTION: 33,
  /** Inside PI content, seen ? */
  PI_QUESTION: 34,
  /** After <! in internal subset, determining declaration type */
  DTD_DECL_START: 35,
  /** Reading declaration keyword (ENTITY, ELEMENT, ATTLIST, NOTATION) */
  DTD_DECL_KEYWORD: 36,
  /** Inside DTD declaration, reading tokens */
  DTD_DECL_CONTENT: 37,
  /** Inside quoted string in DTD declaration */
  DTD_DECL_STRING: 38,
  /** Inside DTD comment */
  DTD_COMMENT: 39,
  /** After first - in DTD comment start */
  DTD_COMMENT_START: 40,
  /** After first - in DTD comment end */
  DTD_COMMENT_DASH: 41,
  /** After -- in DTD comment, expecting > */
  DTD_COMMENT_DASH_DASH: 42,
  /** Inside DTD PI */
  DTD_PI: 43,
  /** After ? in DTD PI, expecting > */
  DTD_PI_QUESTION: 44,
  /** Inside parameter entity reference %name; */
  DTD_PE_REF: 45,
} as const;

type StateType = typeof State[keyof typeof State];

// Character codes for hot path optimization
const CC_LT = 60; // <
const CC_GT = 62; // >
const CC_SLASH = 47; // /
const CC_BANG = 33; // !
const CC_QUESTION = 63; // ?
const CC_EQ = 61; // =
const CC_DQUOTE = 34; // "
const CC_SQUOTE = 39; // '
const CC_SPACE = 32; // space
const CC_TAB = 9; // \t
const CC_LF = 10; // \n
const CC_CR = 13; // \r
const CC_DASH = 45; // -
const CC_LBRACKET = 91; // [
const CC_RBRACKET = 93; // ]
const CC_A_UPPER = 65; // A
const CC_Z_UPPER = 90; // Z
const CC_A_LOWER = 97; // a
const CC_Z_LOWER = 122; // z
const CC_D_UPPER = 68; // D
const CC_P_UPPER = 80; // P
const CC_S_UPPER = 83; // S

// Name character validation is provided by ./_name_chars.ts which implements
// XML 1.0 Fifth Edition NameStartChar/NameChar with optimized ASCII fast path.

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

/**
 * Lookup table for ASCII NameChar (0x00-0x7F).
 * Valid: [a-z] [A-Z] [0-9] _ : - .
 * Replaces 10 chained comparisons in {@link XmlTokenizer.#captureNameChars}
 * with a single array access.
 */
const ASCII_NAME_CHAR = new Uint8Array(128);
for (let i = 0x61; i <= 0x7A; i++) ASCII_NAME_CHAR[i] = 1; // a-z
for (let i = 0x41; i <= 0x5A; i++) ASCII_NAME_CHAR[i] = 1; // A-Z
for (let i = 0x30; i <= 0x39; i++) ASCII_NAME_CHAR[i] = 1; // 0-9
ASCII_NAME_CHAR[0x5F] = 1; // _
ASCII_NAME_CHAR[0x3A] = 1; // :
ASCII_NAME_CHAR[0x2D] = 1; // -
ASCII_NAME_CHAR[0x2E] = 1; // .

/**
 * Lookup table for ASCII NameStartChar (0x00-0x7F).
 * Valid: [a-z] [A-Z] _ :
 * Used to inline the ASCII fast path at {@link XmlTokenizer.#isNameStartCharAt}
 * call sites, avoiding tuple allocation for 99%+ of real XML.
 */
const ASCII_NAME_START_CHAR = new Uint8Array(128);
for (let i = 0x61; i <= 0x7A; i++) ASCII_NAME_START_CHAR[i] = 1; // a-z
for (let i = 0x41; i <= 0x5A; i++) ASCII_NAME_START_CHAR[i] = 1; // A-Z
ASCII_NAME_START_CHAR[0x5F] = 1; // _
ASCII_NAME_START_CHAR[0x3A] = 1; // :

/**
 * Matches any C0 control character that is illegal in XML 1.0 content.
 * Valid C0 chars: TAB (0x09), LF (0x0A), CR (0x0D). All others are illegal.
 * Used as a fast native pre-check in {@link XmlTokenizer.#flushText}.
 */
// deno-lint-ignore no-control-regex
const ILLEGAL_XML_CHAR_REGEXP = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;

/** Sentinel position used when position tracking is disabled. */
const NO_POSITION: XmlPosition = { line: 0, column: 0, offset: 0 };

/**
 * Stateful XML Tokenizer.
 *
 * Processes XML input chunk by chunk, emitting tokens. Handles cross-chunk
 * boundaries correctly for all XML constructs.
 */
export class XmlTokenizer {
  #buffer = "";
  #bufferIndex = 0;
  #state: StateType = State.INITIAL;
  #line = 1;
  #column = 1;
  #offset = 0;

  #tokenLine = 1;
  #tokenColumn = 1;
  #tokenOffset = 0;

  /** Whether to track line/column positions. */
  readonly #trackPosition: boolean;

  // Slice-based accumulators: track start index + partial for cross-chunk
  #textStartIdx = -1;
  #textPartial = "";
  #cdataStartIdx = -1;
  #cdataPartial = "";
  #attrStartIdx = -1;
  #attrPartial = "";
  // Track if whitespace is required before next attribute (after reading a value)
  #needsAttrWhitespace = false;

  // Index-based accumulators for tag names, comments, PI, attr names
  #tagNameStartIdx = -1;
  #tagNamePartial = "";
  #commentStartIdx = -1;
  #commentPartial = "";
  #piTargetStartIdx = -1;
  #piTargetPartial = "";
  #piContentStartIdx = -1;
  #piContentPartial = "";
  #attrNameStartIdx = -1;
  #attrNamePartial = "";

  // Short strings still use direct accumulation
  #cdataCheck = "";

  // DOCTYPE accumulators
  #doctypeCheck = "";
  #doctypeName = "";
  #doctypePublicId = "";
  #doctypeSystemId = "";
  #doctypeQuoteChar = "";

  // Track if first character was a BOM (for XML declaration position check)
  #firstCharWasBOM = false;
  #checkedFirstChar = false;
  // Track if XML declaration is still allowed (no content has been emitted yet)
  // This is tracked independently of position tracking for wellformedness checking
  #xmlDeclAllowed = true;
  #doctypeBracketDepth = 0;

  // DTD declaration parsing state
  #dtdDeclKeyword = "";
  #dtdDeclParenDepth = 0;
  #dtdDeclSawWhitespace = false;
  #dtdDeclQuoteChar = "";

  // ENTITY declaration parsing state
  #isEntityDecl = false;
  #isParameterEntity = false;
  #entityName = "";
  #entityValue = "";
  #entityParsePhase: "name" | "value" | "done" = "name";
  #entityExternalType: "" | "SYSTEM" | "PUBLIC" = ""; // Track SYSTEM/PUBLIC keyword
  #entityQuotedLiterals = 0; // Count quoted literals for PUBLIC validation
  #entityCurrentKeyword = ""; // Accumulate current keyword (SYSTEM/PUBLIC/NDATA)

  // DTD string literal tracking for PubidLiteral validation
  #dtdStringValue = ""; // Accumulated value of current DTD string literal
  #dtdStringIsPubid = false; // Whether current string is a PubidLiteral

  // For tracking text start position
  #textStartLine = 1;
  #textStartColumn = 1;
  #textStartOffset = 0;

  /** Current callbacks for emission (set during process/finalize calls). */
  #callbacks: XmlTokenCallbacks = {};

  /**
   * Constructs a new XmlTokenizer.
   *
   * @param options Options for tokenizer behavior.
   */
  constructor(options: XmlTokenizerOptions = {}) {
    this.#trackPosition = options.trackPosition ?? true;
  }

  #saveTokenPosition(): void {
    if (!this.#trackPosition) return;
    this.#tokenLine = this.#line;
    this.#tokenColumn = this.#column;
    this.#tokenOffset = this.#offset;
  }

  #error(message: string): never {
    throw new XmlSyntaxError(
      message,
      this.#trackPosition
        ? { line: this.#line, column: this.#column, offset: this.#offset }
        : NO_POSITION,
    );
  }

  // XML 1.0 Fifth Edition name character validation with inlined ASCII fast path
  #isNameStartCharCode(code: number): boolean {
    // Inline ASCII check for hot path (99%+ of real XML)
    if (code < 0x80) {
      return (code >= 0x61 && code <= 0x7A) || // a-z
        (code >= 0x41 && code <= 0x5A) || // A-Z
        code === 0x5F || code === 0x3A; // _ :
    }
    return isNameStartChar(code);
  }

  #isNameCharCode(code: number): boolean {
    // Inline ASCII check for hot path (99%+ of real XML)
    if (code < 0x80) {
      return (code >= 0x61 && code <= 0x7A) || // a-z
        (code >= 0x41 && code <= 0x5A) || // A-Z
        (code >= 0x30 && code <= 0x39) || // 0-9
        code === 0x5F || code === 0x3A || // _ :
        code === 0x2D || code === 0x2E; // - .
    }
    return isNameChar(code);
  }

  /**
   * Get the full Unicode code point at the current buffer position.
   * Handles surrogate pairs for astral plane characters (U+10000+).
   * Returns [codePoint, charCount] where charCount is 1 or 2.
   */
  #getCodePoint(
    buffer: string,
    index: number,
  ): [codePoint: number, charCount: number] {
    const code = buffer.charCodeAt(index);
    // Check for high surrogate (0xD800-0xDBFF)
    if (code >= 0xD800 && code <= 0xDBFF && index + 1 < buffer.length) {
      const low = buffer.charCodeAt(index + 1);
      // Check for valid low surrogate (0xDC00-0xDFFF)
      if (low >= 0xDC00 && low <= 0xDFFF) {
        // Decode surrogate pair: ((high - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000
        const codePoint = ((code - 0xD800) << 10) + (low - 0xDC00) + 0x10000;
        return [codePoint, 2];
      }
    }
    return [code, 1];
  }

  /**
   * Check if the current buffer position has a valid NameStartChar.
   * Properly handles astral plane characters via surrogate pair decoding.
   * Returns [isValid, charCount] where charCount is 1 or 2.
   */
  #isNameStartCharAt(
    buffer: string,
    index: number,
  ): [isValid: boolean, charCount: number] {
    const [codePoint, charCount] = this.#getCodePoint(buffer, index);
    return [this.#isNameStartCharCode(codePoint), charCount];
  }

  /**
   * Check if the current buffer position has a valid NameChar.
   * Properly handles astral plane characters via surrogate pair decoding.
   * Returns [isValid, charCount] where charCount is 1 or 2.
   */
  #isNameCharAt(
    buffer: string,
    index: number,
  ): [isValid: boolean, charCount: number] {
    const [codePoint, charCount] = this.#getCodePoint(buffer, index);
    return [this.#isNameCharCode(codePoint), charCount];
  }

  #isWhitespaceCode(code: number): boolean {
    return code === CC_SPACE || code === CC_TAB || code === CC_LF ||
      code === CC_CR;
  }

  #flushText(): void {
    if (this.#textStartIdx !== -1) {
      const content = this.#textPartial +
        this.#buffer.slice(this.#textStartIdx, this.#bufferIndex);
      this.#textStartIdx = -1;
      this.#textPartial = "";
      if (content.length > 0) {
        // XML 1.0 §2.2: Reject illegal C0 control characters.
        // The position-tracking path already validates inline in
        // #captureText, so this native regex pre-check only runs for the
        // no-position-tracking path (avoids redundant scan of every text
        // node when positions are tracked).
        if (!this.#trackPosition && ILLEGAL_XML_CHAR_REGEXP.test(content)) {
          for (let i = 0; i < content.length; i++) {
            const code = content.charCodeAt(i);
            if (
              code < 0x20 && code !== CC_TAB && code !== CC_LF && code !== CC_CR
            ) {
              this.#error(
                `Illegal XML character U+${
                  code.toString(16).toUpperCase().padStart(4, "0")
                } (XML 1.0 §2.2)`,
              );
            }
          }
        }
        // XML 1.0 §2.4: "]]>" is not allowed in text content.
        // Catches both within-chunk and cross-chunk occurrences since
        // #textPartial accumulates across chunks.
        if (content.includes("]]>")) {
          this.#error(
            "']]>' is not allowed in text content (XML 1.0 §2.4)",
          );
        }
        // Any content before XML declaration invalidates XMLDecl position
        this.#xmlDeclAllowed = false;
        this.#callbacks.onText?.(
          content,
          this.#textStartLine,
          this.#textStartColumn,
          this.#textStartOffset,
        );
      }
    }
  }

  #getAttrValue(): string {
    const value = this.#attrPartial +
      this.#buffer.slice(this.#attrStartIdx, this.#bufferIndex);
    this.#attrStartIdx = -1;
    this.#attrPartial = "";
    return value;
  }

  #getTagName(): string {
    const name = this.#tagNamePartial +
      this.#buffer.slice(this.#tagNameStartIdx, this.#bufferIndex);
    this.#tagNameStartIdx = -1;
    this.#tagNamePartial = "";
    return name;
  }

  #getAttrName(): string {
    const name = this.#attrNamePartial +
      this.#buffer.slice(this.#attrNameStartIdx, this.#bufferIndex);
    this.#attrNameStartIdx = -1;
    this.#attrNamePartial = "";
    return name;
  }

  #getPiTarget(): string {
    const target = this.#piTargetPartial +
      this.#buffer.slice(this.#piTargetStartIdx, this.#bufferIndex);
    this.#piTargetStartIdx = -1;
    this.#piTargetPartial = "";
    return target;
  }

  #savePartialsBeforeReset(): void {
    // Early return if no accumulators are active (common case)
    if (
      this.#textStartIdx === -1 &&
      this.#cdataStartIdx === -1 &&
      this.#attrStartIdx === -1 &&
      this.#tagNameStartIdx === -1 &&
      this.#commentStartIdx === -1 &&
      this.#piTargetStartIdx === -1 &&
      this.#piContentStartIdx === -1 &&
      this.#attrNameStartIdx === -1
    ) {
      return;
    }

    // Cache private fields accessed multiple times
    const buffer = this.#buffer;
    const end = this.#bufferIndex;

    // --- Accumulators that need their data saved ---
    // Text, tag name, attribute name, and PI target accumulators track
    // [startIdx, bufferIndex) ranges that haven't been copied to their
    // partial strings yet. Save that data before the buffer changes.
    if (this.#textStartIdx !== -1) {
      this.#textPartial += buffer.slice(this.#textStartIdx, end);
      this.#textStartIdx = 0;
    }
    if (this.#tagNameStartIdx !== -1) {
      this.#tagNamePartial += buffer.slice(this.#tagNameStartIdx, end);
      this.#tagNameStartIdx = 0;
    }
    if (this.#attrNameStartIdx !== -1) {
      this.#attrNamePartial += buffer.slice(this.#attrNameStartIdx, end);
      this.#attrNameStartIdx = 0;
    }
    if (this.#piTargetStartIdx !== -1) {
      this.#piTargetPartial += buffer.slice(this.#piTargetStartIdx, end);
      this.#piTargetStartIdx = 0;
    }

    // --- Accumulators that only need index reset ---
    // Comment, CDATA, PI content, and attribute value accumulators save
    // their data eagerly during batch scanning (#captureComment, etc.).
    // At chunk boundaries their startIdx always equals bufferIndex (the
    // main loop fully consumes the buffer), so the range is empty and
    // there is nothing to copy — just reset the indices for the next chunk.
    if (this.#cdataStartIdx !== -1) this.#cdataStartIdx = 0;
    if (this.#commentStartIdx !== -1) this.#commentStartIdx = 0;
    if (this.#piContentStartIdx !== -1) this.#piContentStartIdx = 0;
    if (this.#attrStartIdx !== -1) this.#attrStartIdx = 0;
  }

  #advanceWithCode(code: number): void {
    if (this.#trackPosition) {
      if (code === CC_LF) {
        this.#line++;
        this.#column = 1;
      } else {
        this.#column++;
      }
      this.#offset++;
    }
    this.#bufferIndex++;
  }

  /**
   * Update position tracking for a region of text using indexOf for newlines.
   * This is more efficient than char-by-char for regions with sparse newlines.
   */
  #updatePositionForRegion(buffer: string, start: number, end: number): void {
    if (!this.#trackPosition) return;

    let pos = start;
    while (pos < end) {
      const nlIdx = buffer.indexOf("\n", pos);
      if (nlIdx === -1 || nlIdx >= end) {
        // No more newlines in region
        this.#column += end - pos;
        break;
      }
      // Found a newline
      this.#line++;
      this.#column = 1;
      pos = nlIdx + 1;
    }
    this.#offset += end - start;
  }

  #normalizeLineEndings(chunk: string): string {
    return chunk.includes("\r")
      ? chunk.replace(LINE_ENDING_REGEXP, "\n")
      : chunk;
  }

  /**
   * Process accumulated keyword in ENTITY declaration.
   * Validates SYSTEM/PUBLIC/NDATA keywords and updates state.
   */
  #processEntityKeyword(): void {
    const kw = this.#entityCurrentKeyword;
    this.#entityCurrentKeyword = "";

    if (!kw) return;

    // Fast path: check exact matches first (most common case)
    if (kw === "SYSTEM") {
      if (this.#entityExternalType) {
        this.#error("Duplicate external ID keyword in ENTITY declaration");
      }
      this.#entityExternalType = "SYSTEM";
      return;
    }
    if (kw === "PUBLIC") {
      if (this.#entityExternalType) {
        this.#error("Duplicate external ID keyword in ENTITY declaration");
      }
      this.#entityExternalType = "PUBLIC";
      return;
    }
    if (kw === "NDATA") {
      // NDATA validation
      if (this.#isParameterEntity) {
        this.#error("Parameter entities cannot have NDATA declarations");
      }
      if (!this.#entityExternalType) {
        this.#error(
          "NDATA can only follow SYSTEM or PUBLIC in ENTITY declaration",
        );
      }
      // Whitespace is required before NDATA - already handled by sawWhitespace check
      return;
    }

    // Check for case-sensitive keywords only when exact match failed (rare case)
    const kwUpper = kw.toUpperCase();
    if (kwUpper === "SYSTEM") {
      this.#error(`'${kw}' must be uppercase 'SYSTEM'`);
    } else if (kwUpper === "PUBLIC") {
      this.#error(`'${kw}' must be uppercase 'PUBLIC'`);
    } else if (kwUpper === "NDATA") {
      this.#error(`'${kw}' must be uppercase 'NDATA'`);
    }
    // Other keywords (like notation names after NDATA) are just ignored
  }

  #emitDeclaration(target: string, content: string): void {
    // XML 1.0 §2.6: Only exact lowercase "xml" is valid for XML declaration
    // Case variants like "XML", "xMl" are reserved and invalid
    if (target !== "xml") {
      this.#error(
        `Processing instruction target '${target}' is reserved; 'xml' must be lowercase (XML 1.0 §2.6)`,
      );
    }

    // XML 1.0 §2.8: XML declaration must be at the very beginning
    // (only a UTF BOM may precede it)
    // Check both: no content has been emitted, AND if position tracking is on,
    // verify the offset is correct (handles BOM case)
    if (!this.#xmlDeclAllowed) {
      this.#error(
        "XML declaration must appear at the start of the document (XML 1.0 §2.8)",
      );
    }
    // If position tracking is enabled, also verify exact offset
    if (this.#trackPosition) {
      const allowedOffset = this.#firstCharWasBOM ? 1 : 0;
      if (this.#tokenOffset !== allowedOffset) {
        this.#error(
          "XML declaration must appear at the start of the document (XML 1.0 §2.8)",
        );
      }
    }
    // After emitting declaration, no more XMLDecl is allowed
    this.#xmlDeclAllowed = false;

    // Validate XML declaration syntax strictly
    const result = validateXmlDeclaration(content);
    if (!result.valid) {
      this.#error(result.error);
    }

    this.#callbacks.onDeclaration?.(
      result.version,
      result.encoding,
      result.standalone,
      this.#tokenLine,
      this.#tokenColumn,
      this.#tokenOffset,
    );
  }

  /** Read a quoted string in DOCTYPE. Does not handle cross-chunk boundaries. */
  #readDoctypeQuotedString(): string {
    const quote = this.#doctypeQuoteChar;
    const buffer = this.#buffer;
    const bufferLen = buffer.length;
    let value = "";
    while (
      this.#bufferIndex < bufferLen && buffer[this.#bufferIndex] !== quote
    ) {
      value += buffer[this.#bufferIndex];
      this.#advanceWithCode(buffer.charCodeAt(this.#bufferIndex));
    }
    if (this.#bufferIndex >= bufferLen) {
      this.#error("Unterminated quoted string in DOCTYPE declaration");
    }
    this.#advanceWithCode(buffer.charCodeAt(this.#bufferIndex));
    return value;
  }

  /**
   * Validates a PubidLiteral per XML 1.0 §2.3.
   * PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]
   *
   * Note: If quoted with ', the value cannot contain '.
   *
   * @param value The public ID value (without quotes)
   * @param quote The quote character used (' or ")
   */
  #validatePubidLiteral(value: string, quote: string): void {
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
        (ch === "'" && quote === '"'); // ' only allowed if quoted with "

      if (!isValid) {
        this.#error(
          `Invalid character '${ch}' (U+${
            code.toString(16).toUpperCase().padStart(4, "0")
          }) in public ID literal`,
        );
      }
    }
  }

  // ========================================================================
  // DEDICATED CAPTURE METHODS
  // These tight loops avoid per-character switch overhead for hot paths.
  // ========================================================================

  /**
   * Capture text content in a tight loop until '<' is found.
   * Returns true if '<' was found, false if end of buffer reached.
   *
   * The "]]>" check (XML 1.0 §2.4) is deferred to {@link #flushText} where
   * a single native `includes` covers both within-chunk and cross-chunk cases.
   *
   * Illegal C0 control characters (XML 1.0 §2.2) are checked inline in the
   * position-tracking path (already iterating per char) and via a fast native
   * regex pre-check in {@link #flushText} for the no-position-tracking path.
   */
  #captureText(buffer: string, bufferLen: number): boolean {
    // Initialize text tracking if this is the start of a new text node
    if (this.#textStartIdx === -1) {
      if (this.#trackPosition) {
        this.#textStartLine = this.#line;
        this.#textStartColumn = this.#column;
        this.#textStartOffset = this.#offset;
      }
      this.#textStartIdx = this.#bufferIndex;
    }

    if (this.#trackPosition) {
      // Scan for '<' while tracking line/column positions.
      // Illegal C0 chars are checked here (we're already per-char).
      let idx = this.#bufferIndex;
      let line = this.#line;
      let column = this.#column;
      let offset = this.#offset;

      while (idx < bufferLen) {
        const code = buffer.charCodeAt(idx);
        if (code === CC_LT) {
          this.#bufferIndex = idx;
          this.#line = line;
          this.#column = column;
          this.#offset = offset;
          return true;
        }

        // XML 1.0 §2.2: Reject illegal C0 control characters.
        // Valid: TAB (0x09), LF (0x0A), CR (0x0D).
        if (
          code < 0x20 && code !== CC_TAB && code !== CC_LF && code !== CC_CR
        ) {
          this.#bufferIndex = idx;
          this.#line = line;
          this.#column = column;
          this.#offset = offset;
          this.#error(
            `Illegal XML character U+${
              code.toString(16).toUpperCase().padStart(4, "0")
            } (XML 1.0 §2.2)`,
          );
        }

        if (code === CC_LF) {
          line++;
          column = 1;
        } else {
          column++;
        }
        offset++;
        idx++;
      }

      this.#bufferIndex = idx;
      this.#line = line;
      this.#column = column;
      this.#offset = offset;
    } else {
      // Fast path: native indexOf is SIMD-optimized in V8.
      // Illegal C0 chars are checked in #flushText via regex.
      const ltIdx = buffer.indexOf("<", this.#bufferIndex);
      if (ltIdx >= 0) {
        this.#bufferIndex = ltIdx;
        return true;
      }
      this.#bufferIndex = bufferLen;
    }

    return false;
  }

  /**
   * Capture an XML name (element or attribute name) in a tight loop.
   *
   * Assumes the first character has already been validated as NameStartChar.
   * Continues until a non-NameChar is encountered.
   *
   * Uses a pre-computed {@link ASCII_NAME_CHAR} lookup table (1 array access)
   * instead of calling {@link #isNameCharCode} per char (10 comparisons).
   * Local `idx` avoids private-field access in the loop. Position is updated
   * in a single batch after the loop (names cannot contain newlines).
   */
  #captureNameChars(buffer: string, bufferLen: number): void {
    let idx = this.#bufferIndex;

    // Tight ASCII loop: 1 charCodeAt + 1 comparison + 1 array access per char.
    // No function calls, no private-field access.
    while (idx < bufferLen) {
      const code = buffer.charCodeAt(idx);
      if (code >= 0x80) break;
      if (!ASCII_NAME_CHAR[code]) break;
      idx++;
    }

    // Non-ASCII tail (rare): surrogate-aware checking
    if (idx < bufferLen && buffer.charCodeAt(idx) >= 0x80) {
      while (idx < bufferLen) {
        const code = buffer.charCodeAt(idx);
        if (code < 0x80) {
          if (!ASCII_NAME_CHAR[code]) break;
          idx++;
        } else {
          const [isValid, charCount] = this.#isNameCharAt(buffer, idx);
          if (!isValid) break;
          idx += charCount;
        }
      }
    }

    // Batch position update: names never contain newlines, so column += length.
    if (this.#trackPosition) {
      const advance = idx - this.#bufferIndex;
      this.#column += advance;
      this.#offset += advance;
    }
    this.#bufferIndex = idx;
  }

  /**
   * Batch-scan comment using indexOf("-->"). Returns true if complete and emitted.
   * When incomplete, consumes safe content (excluding trailing -) for char-by-char.
   *
   * Validates XML 1.0 constraints:
   * - §2.5: "--" is not permitted within comments, and "--" must be followed by ">"
   * - §2.2: Illegal C0 control characters are rejected
   */
  #captureComment(buffer: string, bufferLen: number): boolean {
    const endIdx = buffer.indexOf("-->", this.#bufferIndex);

    if (endIdx !== -1) {
      // Fast path: found complete "-->" terminator
      const newContent = buffer.slice(this.#commentStartIdx, endIdx);

      // XML 1.0 §2.5: "--" is not permitted within comments
      // Check both the accumulated partial and new content for "--"
      if (this.#commentPartial.includes("--") || newContent.includes("--")) {
        this.#error(
          `'--' is not permitted within comments (XML 1.0 §2.5)`,
        );
      }

      // Also check the boundary between partial and new content
      if (
        this.#commentPartial.endsWith("-") && newContent.startsWith("-")
      ) {
        this.#error(
          `'--' is not permitted within comments (XML 1.0 §2.5)`,
        );
      }

      // Check for trailing dash immediately before "-->"
      // (grammar requires every "-" to be followed by a non-dash char)
      if (
        newContent.length > 0 &&
        newContent.charCodeAt(newContent.length - 1) === CC_DASH
      ) {
        this.#bufferIndex = endIdx - 1;
        this.#error(
          `'-' is not permitted immediately before '-->' (XML 1.0 §2.5)`,
        );
      }
      // Also check if partial ends with dash and new content is empty
      if (
        newContent.length === 0 &&
        this.#commentPartial.length > 0 &&
        this.#commentPartial.charCodeAt(
            this.#commentPartial.length - 1,
          ) === CC_DASH
      ) {
        this.#bufferIndex = endIdx - 1;
        this.#error(
          `'-' is not permitted immediately before '-->' (XML 1.0 §2.5)`,
        );
      }

      // XML 1.0 §2.2: Validate characters are legal XML Char
      for (let i = this.#commentStartIdx; i < endIdx; i++) {
        const code = buffer.charCodeAt(i);
        if (code < 0x20 && C0_VALID[code] !== 1) {
          this.#bufferIndex = i;
          this.#error(
            `Illegal XML character U+${
              code.toString(16).toUpperCase().padStart(4, "0")
            } (XML 1.0 §2.2)`,
          );
        }
      }

      const content = this.#commentPartial + newContent;

      // Update position for the content region + terminator
      this.#updatePositionForRegion(buffer, this.#bufferIndex, endIdx + 3);
      this.#bufferIndex = endIdx + 3;

      // Any comment before XML declaration invalidates XMLDecl position
      this.#xmlDeclAllowed = false;

      this.#callbacks.onComment?.(
        content,
        this.#tokenLine,
        this.#tokenColumn,
        this.#tokenOffset,
      );

      this.#commentStartIdx = -1;
      this.#commentPartial = "";
      this.#state = State.INITIAL;
      return true; // Complete
    }

    // No "-->" found - consume as much as safely possible
    // We must NOT consume trailing `-` or `--` as they might be part of the terminator
    let safeEnd = bufferLen;
    if (
      safeEnd > this.#bufferIndex &&
      buffer.charCodeAt(safeEnd - 1) === CC_DASH
    ) {
      safeEnd--;
      if (
        safeEnd > this.#bufferIndex &&
        buffer.charCodeAt(safeEnd - 1) === CC_DASH
      ) {
        safeEnd--;
      }
    }

    // Batch consume the safe region
    if (safeEnd > this.#bufferIndex) {
      const region = buffer.slice(this.#commentStartIdx, safeEnd);

      // XML 1.0 §2.5: "--" is not permitted within comments
      if (region.includes("--")) {
        this.#error(
          `'--' is not permitted within comments (XML 1.0 §2.5)`,
        );
      }

      // XML 1.0 §2.2: Validate characters are legal XML Char
      for (let i = this.#commentStartIdx; i < safeEnd; i++) {
        const code = buffer.charCodeAt(i);
        if (code < 0x20 && C0_VALID[code] !== 1) {
          this.#bufferIndex = i;
          this.#error(
            `Illegal XML character U+${
              code.toString(16).toUpperCase().padStart(4, "0")
            } (XML 1.0 §2.2)`,
          );
        }
      }

      this.#commentPartial += region;
      this.#updatePositionForRegion(buffer, this.#bufferIndex, safeEnd);
      this.#bufferIndex = safeEnd;
      this.#commentStartIdx = safeEnd;
    }

    return false; // Let char-by-char handle remaining characters
  }

  /**
   * Batch-scan PI using indexOf("?>"). Returns true if complete and emitted.
   * When incomplete, consumes safe content (excluding trailing ?) for char-by-char.
   */
  #capturePI(buffer: string, bufferLen: number): boolean {
    const endIdx = buffer.indexOf("?>", this.#bufferIndex);

    if (endIdx !== -1) {
      // Fast path: found complete "?>" terminator

      // XML 1.0 §2.2: Validate characters in PI content are legal XML Char
      for (let i = this.#piContentStartIdx; i < endIdx; i++) {
        const charCode = buffer.charCodeAt(i);
        if (charCode < 0x20 && C0_VALID[charCode] !== 1) {
          this.#bufferIndex = i;
          this.#error(
            `Illegal XML character U+${
              charCode.toString(16).toUpperCase().padStart(4, "0")
            } in processing instruction (XML 1.0 §2.2)`,
          );
        }
      }

      const content = this.#piContentPartial +
        buffer.slice(this.#piContentStartIdx, endIdx);

      // Update position for the content region + terminator
      this.#updatePositionForRegion(buffer, this.#bufferIndex, endIdx + 2);
      this.#bufferIndex = endIdx + 2;

      // Emit the appropriate token type
      if (isReservedPiTarget(this.#piTargetPartial)) {
        this.#emitDeclaration(this.#piTargetPartial, content);
      } else {
        // Any PI before XML declaration invalidates XMLDecl position
        this.#xmlDeclAllowed = false;
        this.#callbacks.onProcessingInstruction?.(
          this.#piTargetPartial,
          content.trim(),
          this.#tokenLine,
          this.#tokenColumn,
          this.#tokenOffset,
        );
      }

      this.#piTargetPartial = "";
      this.#piContentStartIdx = -1;
      this.#piContentPartial = "";
      this.#state = State.INITIAL;
      return true; // Complete
    }

    // No "?>" found - consume as much as safely possible
    // We must NOT consume trailing `?` as it might be part of the terminator
    let safeEnd = bufferLen;
    if (
      safeEnd > this.#bufferIndex &&
      buffer.charCodeAt(safeEnd - 1) === CC_QUESTION
    ) {
      safeEnd--;
    }

    // Batch consume the safe region, validating characters
    if (safeEnd > this.#bufferIndex) {
      // XML 1.0 §2.2: Validate characters in PI content
      for (let i = this.#piContentStartIdx; i < safeEnd; i++) {
        const charCode = buffer.charCodeAt(i);
        if (charCode < 0x20 && C0_VALID[charCode] !== 1) {
          this.#bufferIndex = i;
          this.#error(
            `Illegal XML character U+${
              charCode.toString(16).toUpperCase().padStart(4, "0")
            } in processing instruction (XML 1.0 §2.2)`,
          );
        }
      }

      this.#piContentPartial += buffer.slice(this.#piContentStartIdx, safeEnd);
      this.#updatePositionForRegion(buffer, this.#bufferIndex, safeEnd);
      this.#bufferIndex = safeEnd;
      this.#piContentStartIdx = safeEnd;
    }

    return false; // Let char-by-char handle remaining characters
  }

  /**
   * Batch-scan CDATA using indexOf("]]>"). Returns true if complete and emitted.
   * When incomplete, consumes safe content (excluding trailing ] or ]]) for char-by-char.
   *
   * Validates XML 1.0 §2.2: Illegal C0 control characters are rejected.
   */
  #captureCDATA(buffer: string, bufferLen: number): boolean {
    const endIdx = buffer.indexOf("]]>", this.#bufferIndex);

    if (endIdx !== -1) {
      // Fast path: found complete "]]>" terminator

      // XML 1.0 §2.2: Validate characters are legal XML Char
      for (let i = this.#cdataStartIdx; i < endIdx; i++) {
        const code = buffer.charCodeAt(i);
        if (code < 0x20 && C0_VALID[code] !== 1) {
          this.#bufferIndex = i;
          this.#error(
            `Illegal XML character U+${
              code.toString(16).toUpperCase().padStart(4, "0")
            } (XML 1.0 §2.2)`,
          );
        }
      }

      const content = this.#cdataPartial +
        buffer.slice(this.#cdataStartIdx, endIdx);

      // Update position for the content region + terminator
      this.#updatePositionForRegion(buffer, this.#bufferIndex, endIdx + 3);
      this.#bufferIndex = endIdx + 3;

      this.#callbacks.onCData?.(
        content,
        this.#tokenLine,
        this.#tokenColumn,
        this.#tokenOffset,
      );

      this.#cdataStartIdx = -1;
      this.#cdataPartial = "";
      this.#state = State.INITIAL;
      return true; // Complete
    }

    // No "]]>" found - consume as much as safely possible
    // We must NOT consume trailing `]` or `]]` as they might be part of the terminator
    let safeEnd = bufferLen;
    if (
      safeEnd > this.#bufferIndex &&
      buffer.charCodeAt(safeEnd - 1) === CC_RBRACKET
    ) {
      safeEnd--;
      if (
        safeEnd > this.#bufferIndex &&
        buffer.charCodeAt(safeEnd - 1) === CC_RBRACKET
      ) {
        safeEnd--;
      }
    }

    // Batch consume the safe region
    if (safeEnd > this.#bufferIndex) {
      // XML 1.0 §2.2: Validate characters are legal XML Char
      for (let i = this.#cdataStartIdx; i < safeEnd; i++) {
        const code = buffer.charCodeAt(i);
        if (code < 0x20 && C0_VALID[code] !== 1) {
          this.#bufferIndex = i;
          this.#error(
            `Illegal XML character U+${
              code.toString(16).toUpperCase().padStart(4, "0")
            } (XML 1.0 §2.2)`,
          );
        }
      }

      this.#cdataPartial += buffer.slice(this.#cdataStartIdx, safeEnd);
      this.#updatePositionForRegion(buffer, this.#bufferIndex, safeEnd);
      this.#bufferIndex = safeEnd;
      this.#cdataStartIdx = safeEnd;
    }

    return false; // Let char-by-char handle remaining characters
  }

  /**
   * Batch-scan attribute value using indexOf for the closing quote.
   * Returns true if complete and ready for emission.
   * Validates that '<' is not in the value.
   *
   * @param quoteCode The quote character code (CC_DQUOTE or CC_SQUOTE)
   */
  #captureAttributeValue(
    buffer: string,
    bufferLen: number,
    quoteCode: number,
  ): boolean {
    const quoteChar = String.fromCharCode(quoteCode);
    const idx = this.#bufferIndex;
    const endIdx = buffer.indexOf(quoteChar, idx);

    if (endIdx !== -1) {
      // Found closing quote - validate and complete
      // Check for '<' which is not allowed in attribute values (native indexOf)
      const ltIdx = buffer.indexOf("<", this.#attrStartIdx);
      if (ltIdx !== -1 && ltIdx < endIdx) {
        this.#bufferIndex = ltIdx;
        this.#error(`'<' not allowed in attribute value`);
      }

      // Update position for the content region (not including closing quote)
      this.#updatePositionForRegion(buffer, idx, endIdx);
      this.#bufferIndex = endIdx;
      return true; // Complete - ready to emit
    }

    // No closing quote found - consume as much as safely possible
    // Check for '<' which is not allowed in attribute values (native indexOf)
    const ltCheck = buffer.indexOf("<", this.#attrStartIdx);
    if (ltCheck !== -1 && ltCheck < bufferLen) {
      this.#bufferIndex = ltCheck;
      this.#error(`'<' not allowed in attribute value`);
    }

    // Batch consume the entire remaining buffer
    if (bufferLen > idx) {
      this.#attrPartial += buffer.slice(this.#attrStartIdx, bufferLen);
      this.#updatePositionForRegion(buffer, idx, bufferLen);
      this.#bufferIndex = bufferLen;
      this.#attrStartIdx = bufferLen;
    }

    return false; // Incomplete - need more data
  }

  /**
   * Process a chunk of XML text using callbacks.
   *
   * This method is synchronous and can be called multiple times with
   * consecutive chunks of XML input. Callbacks are invoked for each
   * token, enabling zero-allocation streaming.
   *
   * @param chunk The XML text chunk to process.
   * @param callbacks Callbacks to invoke for each token.
   */
  process(chunk: string, callbacks: XmlTokenCallbacks): void {
    this.#callbacks = callbacks;
    this.#savePartialsBeforeReset();
    const normalized = this.#normalizeLineEndings(chunk);
    // The main loop always fully consumes the buffer (bufferIndex reaches
    // buffer.length), so the new chunk is assigned directly — no leftover
    // to slice or concatenate.
    this.#buffer = normalized;
    this.#bufferIndex = 0;

    // Cache hot variables locally to reduce private field access overhead.
    const buffer = normalized;
    const bufferLen = buffer.length;

    // Check for BOM at the very first character (for XML declaration position check)
    if (!this.#checkedFirstChar && bufferLen > 0) {
      this.#checkedFirstChar = true;
      if (buffer.charCodeAt(0) === 0xFEFF) {
        this.#firstCharWasBOM = true;
      }
    }

    while (this.#bufferIndex < bufferLen) {
      // Use charCodeAt for faster character comparison in hot path
      const code = buffer.charCodeAt(this.#bufferIndex);

      // Switch cases ordered by frequency for better branch prediction.
      switch (this.#state) {
        // === HOT PATH: Most frequently hit states ===

        case State.INITIAL: {
          // Use dedicated capture method for tight-loop text scanning
          if (this.#captureText(buffer, bufferLen)) {
            // Found '<' - flush text and transition to TAG_OPEN
            this.#flushText();
            this.#saveTokenPosition();
            this.#advanceWithCode(CC_LT);
            this.#state = State.TAG_OPEN;
          }
          // If captureText returns false, we've consumed all input
          // and will exit the main loop naturally
          break;
        }

        case State.TAG_NAME: {
          // Use dedicated capture method for tight-loop name scanning
          this.#captureNameChars(buffer, bufferLen);

          // Check what character ended the name (if any)
          if (this.#bufferIndex >= bufferLen) {
            // End of buffer - need more data, stay in TAG_NAME state
            break;
          }

          // Get the terminating character
          const termCode = buffer.charCodeAt(this.#bufferIndex);
          if (this.#isWhitespaceCode(termCode)) {
            this.#callbacks.onStartTagOpen?.(
              this.#getTagName(),
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#advanceWithCode(termCode);
            this.#state = State.AFTER_TAG_NAME;
          } else if (termCode === CC_GT) {
            this.#callbacks.onStartTagOpen?.(
              this.#getTagName(),
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#callbacks.onStartTagClose?.(false);
            this.#advanceWithCode(termCode);
            this.#state = State.INITIAL;
          } else if (termCode === CC_SLASH) {
            this.#callbacks.onStartTagOpen?.(
              this.#getTagName(),
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#advanceWithCode(termCode);
            this.#state = State.EXPECT_SELF_CLOSE_GT;
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(termCode)
              }' in tag name`,
            );
          }
          break;
        }

        case State.END_TAG_NAME: {
          // Handle first character (must be NameStartChar)
          if (
            this.#tagNameStartIdx === this.#bufferIndex &&
            this.#tagNamePartial === ""
          ) {
            // ASCII fast path: lookup table avoids function call + tuple allocation
            if (code < 0x80) {
              if (!ASCII_NAME_START_CHAR[code]) {
                this.#error(
                  `Unexpected character '${
                    String.fromCharCode(code)
                  }' in end tag`,
                );
              }
              this.#advanceWithCode(code);
            } else {
              // Non-ASCII: surrogate-aware check (rare)
              const [isValid, charCount] = this.#isNameStartCharAt(
                buffer,
                this.#bufferIndex,
              );
              if (!isValid) {
                this.#error(
                  `Unexpected character '${
                    String.fromCharCode(code)
                  }' in end tag`,
                );
              }
              for (let i = 0; i < charCount; i++) {
                this.#advanceWithCode(buffer.charCodeAt(this.#bufferIndex));
              }
            }
          }

          // Use dedicated capture method for tight-loop name scanning
          this.#captureNameChars(buffer, bufferLen);

          // Check what character ended the name (if any)
          if (this.#bufferIndex >= bufferLen) {
            // End of buffer - need more data
            break;
          }

          const termCode = buffer.charCodeAt(this.#bufferIndex);
          if (this.#isWhitespaceCode(termCode)) {
            const name = this.#getTagName();
            this.#tagNamePartial = name; // Store temporarily
            this.#advanceWithCode(termCode);
            this.#state = State.AFTER_END_TAG_NAME;
          } else if (termCode === CC_GT) {
            this.#callbacks.onEndTag?.(
              this.#getTagName(),
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#advanceWithCode(termCode);
            this.#state = State.INITIAL;
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(termCode)
              }' in end tag`,
            );
          }
          break;
        }

        case State.ATTRIBUTE_VALUE_DOUBLE: {
          // Try batch scanning first - handles most cases efficiently
          if (this.#captureAttributeValue(buffer, bufferLen, CC_DQUOTE)) {
            // Found closing quote at bufferIndex
            this.#callbacks.onAttribute?.(
              this.#attrNamePartial,
              this.#getAttrValue(),
            );
            this.#attrNamePartial = "";
            this.#advanceWithCode(CC_DQUOTE);
            // Whitespace is now required before next attribute
            this.#needsAttrWhitespace = true;
            this.#state = State.AFTER_TAG_NAME;
          }
          // If incomplete, buffer was consumed and we exit the loop naturally
          break;
        }

        case State.AFTER_TAG_NAME: {
          if (this.#isWhitespaceCode(code)) {
            // Whitespace seen - no longer require whitespace before next attr
            this.#needsAttrWhitespace = false;
            this.#advanceWithCode(code);
            // Tight loop: skip remaining whitespace without switch dispatch
            while (this.#bufferIndex < bufferLen) {
              const wsCode = buffer.charCodeAt(this.#bufferIndex);
              if (
                wsCode !== CC_SPACE && wsCode !== CC_TAB &&
                wsCode !== CC_LF && wsCode !== CC_CR
              ) break;
              this.#advanceWithCode(wsCode);
            }
          } else if (code === CC_GT) {
            this.#needsAttrWhitespace = false;
            this.#callbacks.onStartTagClose?.(false);
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else if (code === CC_SLASH) {
            this.#needsAttrWhitespace = false;
            this.#advanceWithCode(code);
            this.#state = State.EXPECT_SELF_CLOSE_GT;
          } else if (
            code < 0x80
              ? ASCII_NAME_START_CHAR[code]
              : this.#isNameStartCharCode(code)
          ) {
            // XML 1.0 §3.1: Whitespace is required between attributes
            if (this.#needsAttrWhitespace) {
              this.#error("Whitespace is required between attributes");
            }
            this.#attrNameStartIdx = this.#bufferIndex;
            this.#attrNamePartial = "";
            this.#advanceWithCode(code);
            this.#state = State.ATTRIBUTE_NAME;
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(code)
              }' after tag name`,
            );
          }
          break;
        }

        case State.ATTRIBUTE_NAME: {
          // Use dedicated capture method for tight-loop name scanning
          this.#captureNameChars(buffer, bufferLen);

          // Check what character ended the name (if any)
          if (this.#bufferIndex >= bufferLen) {
            // End of buffer - need more data
            break;
          }

          const termCode = buffer.charCodeAt(this.#bufferIndex);
          if (this.#isWhitespaceCode(termCode)) {
            // Save the attribute name before transitioning
            const name = this.#getAttrName();
            this.#attrNamePartial = name; // Store temporarily
            this.#advanceWithCode(termCode);
            this.#state = State.AFTER_ATTRIBUTE_NAME;
          } else if (termCode === CC_EQ) {
            const name = this.#getAttrName();
            this.#attrNamePartial = name; // Store temporarily
            this.#advanceWithCode(termCode);
            this.#state = State.BEFORE_ATTRIBUTE_VALUE;
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(termCode)
              }' in attribute name`,
            );
          }
          break;
        }

        case State.TAG_OPEN: {
          if (code === CC_SLASH) {
            this.#advanceWithCode(code);
            this.#tagNameStartIdx = this.#bufferIndex;
            this.#tagNamePartial = "";
            this.#state = State.END_TAG_NAME;
          } else if (code === CC_BANG) {
            this.#advanceWithCode(code);
            this.#state = State.MARKUP_DECLARATION;
          } else if (code === CC_QUESTION) {
            this.#advanceWithCode(code);
            this.#piTargetStartIdx = this.#bufferIndex;
            this.#piTargetPartial = "";
            this.#state = State.PI_TARGET;
          } else if (code < 0x80) {
            // ASCII fast path: lookup table avoids function call + tuple allocation
            if (!ASCII_NAME_START_CHAR[code]) {
              this.#error(
                `Unexpected character '${String.fromCharCode(code)}' after '<'`,
              );
            }
            this.#tagNameStartIdx = this.#bufferIndex;
            this.#tagNamePartial = "";
            this.#advanceWithCode(code);
            this.#state = State.TAG_NAME;
          } else {
            // Non-ASCII: surrogate-aware check (rare)
            const [isValid, charCount] = this.#isNameStartCharAt(
              buffer,
              this.#bufferIndex,
            );
            if (isValid) {
              this.#tagNameStartIdx = this.#bufferIndex;
              this.#tagNamePartial = "";
              for (let i = 0; i < charCount; i++) {
                this.#advanceWithCode(buffer.charCodeAt(this.#bufferIndex));
              }
              this.#state = State.TAG_NAME;
            } else {
              this.#error(
                `Unexpected character '${String.fromCharCode(code)}' after '<'`,
              );
            }
          }
          break;
        }

        // === WARM PATH: Moderately common states ===

        case State.BEFORE_ATTRIBUTE_VALUE: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_DQUOTE) {
            this.#advanceWithCode(code);
            this.#attrStartIdx = this.#bufferIndex;
            this.#attrPartial = "";
            this.#state = State.ATTRIBUTE_VALUE_DOUBLE;
          } else if (code === CC_SQUOTE) {
            this.#advanceWithCode(code);
            this.#attrStartIdx = this.#bufferIndex;
            this.#attrPartial = "";
            this.#state = State.ATTRIBUTE_VALUE_SINGLE;
          } else {
            this.#error(`Expected quote to start attribute value`);
          }
          break;
        }

        case State.AFTER_ATTRIBUTE_NAME: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_EQ) {
            this.#advanceWithCode(code);
            this.#state = State.BEFORE_ATTRIBUTE_VALUE;
          } else {
            this.#error(`Expected '=' after attribute name`);
          }
          break;
        }

        case State.EXPECT_SELF_CLOSE_GT: {
          if (code === CC_GT) {
            this.#callbacks.onStartTagClose?.(true);
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else {
            this.#error(`Expected '>' after '/' in self-closing tag`);
          }
          break;
        }

        case State.AFTER_END_TAG_NAME: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_GT) {
            this.#callbacks.onEndTag?.(
              this.#tagNamePartial,
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#tagNamePartial = "";
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else {
            this.#error(
              `Unexpected character '${String.fromCharCode(code)}' in end tag`,
            );
          }
          break;
        }

        case State.ATTRIBUTE_VALUE_SINGLE: {
          // Try batch scanning first - handles most cases efficiently
          if (this.#captureAttributeValue(buffer, bufferLen, CC_SQUOTE)) {
            // Found closing quote at bufferIndex
            this.#callbacks.onAttribute?.(
              this.#attrNamePartial,
              this.#getAttrValue(),
            );
            this.#attrNamePartial = "";
            this.#advanceWithCode(CC_SQUOTE);
            // Whitespace is now required before next attribute
            this.#needsAttrWhitespace = true;
            this.#state = State.AFTER_TAG_NAME;
          }
          // If incomplete, buffer was consumed and we exit the loop naturally
          break;
        }

        // === COLD PATH: Rarely hit states (comments, CDATA, PI, DOCTYPE) ===

        case State.COMMENT: {
          // Try batch scanning first - handles most cases efficiently
          if (this.#captureComment(buffer, bufferLen)) {
            break; // Complete comment found and emitted
          }
          // Batch consumed what it could; handle remaining chars (0-2 dashes)
          if (this.#bufferIndex >= bufferLen) {
            break; // Buffer exhausted, need more data
          }
          // Re-read code since bufferIndex may have changed
          const commentCode = buffer.charCodeAt(this.#bufferIndex);
          // Fall through to char-by-char for trailing `-` characters
          if (commentCode === CC_DASH) {
            this.#commentPartial += buffer.slice(
              this.#commentStartIdx,
              this.#bufferIndex,
            );
            this.#advanceWithCode(commentCode);
            this.#commentStartIdx = this.#bufferIndex;
            this.#state = State.COMMENT_DASH;
          } else {
            this.#advanceWithCode(commentCode);
          }
          break;
        }

        case State.CDATA: {
          // Try batch scanning first - handles ~95% of cases efficiently
          if (this.#captureCDATA(buffer, bufferLen)) {
            break; // Complete CDATA found and emitted
          }
          // Batch consumed what it could; handle remaining chars (0-2 brackets)
          if (this.#bufferIndex >= bufferLen) {
            break; // Buffer exhausted, need more data
          }
          // Re-read code since bufferIndex may have changed
          const cdataCode = buffer.charCodeAt(this.#bufferIndex);
          // Fall through to char-by-char for trailing `]` characters
          if (cdataCode === CC_RBRACKET) {
            this.#cdataPartial += buffer.slice(
              this.#cdataStartIdx,
              this.#bufferIndex,
            );
            this.#advanceWithCode(cdataCode);
            this.#cdataStartIdx = this.#bufferIndex;
            this.#state = State.CDATA_BRACKET;
          } else {
            this.#advanceWithCode(cdataCode);
          }
          break;
        }

        case State.PI_CONTENT: {
          // Try batch scanning first - handles most cases efficiently
          if (this.#capturePI(buffer, bufferLen)) {
            break; // Complete PI found and emitted
          }
          // Batch consumed what it could; handle remaining chars (0-1 question mark)
          if (this.#bufferIndex >= bufferLen) {
            break; // Buffer exhausted, need more data
          }
          // Re-read code since bufferIndex may have changed
          const piCode = buffer.charCodeAt(this.#bufferIndex);
          // XML 1.0 §2.2: Validate character
          if (piCode < 0x20 && C0_VALID[piCode] !== 1) {
            this.#error(
              `Illegal XML character U+${
                piCode.toString(16).toUpperCase().padStart(4, "0")
              } in processing instruction (XML 1.0 §2.2)`,
            );
          }
          // Fall through to char-by-char for trailing `?` character
          if (piCode === CC_QUESTION) {
            this.#piContentPartial += buffer.slice(
              this.#piContentStartIdx,
              this.#bufferIndex,
            );
            this.#piContentStartIdx = -1;
            this.#advanceWithCode(piCode);
            this.#state = State.PI_QUESTION;
          } else {
            this.#advanceWithCode(piCode);
          }
          break;
        }

        case State.MARKUP_DECLARATION: {
          if (code === CC_DASH) {
            this.#advanceWithCode(code);
            this.#state = State.COMMENT_START;
          } else if (code === CC_LBRACKET) {
            this.#advanceWithCode(code);
            this.#cdataCheck = "";
            this.#state = State.CDATA_START;
          } else if (code === CC_D_UPPER) {
            this.#doctypeCheck = "D";
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_START;
          } else {
            this.#error(`Unsupported markup declaration`);
          }
          break;
        }

        case State.COMMENT_START: {
          if (code === CC_DASH) {
            this.#advanceWithCode(code);
            this.#commentStartIdx = this.#bufferIndex;
            this.#commentPartial = "";
            this.#state = State.COMMENT;
          } else {
            this.#error(`Expected '-' to start comment`);
          }
          break;
        }

        case State.COMMENT_DASH: {
          if (code === CC_DASH) {
            this.#advanceWithCode(code);
            // Mark that we've consumed the --, no more content to capture
            this.#commentStartIdx = -1;
            this.#state = State.COMMENT_DASH_DASH;
          } else {
            this.#commentPartial += "-";
            this.#commentStartIdx = this.#bufferIndex;
            this.#advanceWithCode(code);
            this.#state = State.COMMENT;
          }
          break;
        }

        case State.COMMENT_DASH_DASH: {
          if (code === CC_GT) {
            // XML 1.0 §2.5: "--" is not permitted within comments
            // Also, a single "-" cannot appear immediately before "-->"
            // Check before emitting
            if (this.#commentPartial.includes("--")) {
              this.#error(
                `'--' is not permitted within comments (XML 1.0 §2.5)`,
              );
            }
            // Check for trailing dash (e.g., "<!--->" or "<!-- comment --->")
            if (
              this.#commentPartial.length > 0 &&
              this.#commentPartial.charCodeAt(
                  this.#commentPartial.length - 1,
                ) === CC_DASH
            ) {
              this.#error(
                `'-' is not permitted immediately before '-->' (XML 1.0 §2.5)`,
              );
            }
            // Any comment before XML declaration invalidates XMLDecl position
            this.#xmlDeclAllowed = false;
            this.#callbacks.onComment?.(
              this.#commentPartial,
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#commentStartIdx = -1;
            this.#commentPartial = "";
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else if (code === CC_DASH) {
            // Add one - to content, stay in COMMENT_DASH_DASH
            // This handles cases like "---->" (content="--" which will be caught)
            this.#commentPartial += "-";
            this.#advanceWithCode(code);
          } else {
            // XML 1.0 §2.5: After "--", only ">" or "-" is allowed.
            // Any other character means "--" appears within the comment content.
            this.#error(
              `'--' is not permitted within comments (XML 1.0 §2.5)`,
            );
          }
          break;
        }

        case State.CDATA_START: {
          this.#cdataCheck += String.fromCharCode(code);
          this.#advanceWithCode(code);
          if (this.#cdataCheck === "CDATA[") {
            this.#cdataStartIdx = this.#bufferIndex;
            this.#cdataPartial = "";
            this.#state = State.CDATA;
          } else if (!"CDATA[".startsWith(this.#cdataCheck)) {
            this.#error(`Expected 'CDATA[' after '<![`);
          }
          break;
        }

        case State.CDATA_BRACKET: {
          if (code === CC_RBRACKET) {
            this.#advanceWithCode(code);
            this.#cdataStartIdx = this.#bufferIndex;
            this.#state = State.CDATA_BRACKET_BRACKET;
          } else {
            this.#cdataPartial += "]";
            this.#advanceWithCode(code);
            this.#state = State.CDATA;
          }
          break;
        }

        case State.CDATA_BRACKET_BRACKET: {
          if (code === CC_GT) {
            this.#callbacks.onCData?.(
              this.#cdataPartial,
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#cdataStartIdx = -1;
            this.#cdataPartial = "";
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else if (code === CC_RBRACKET) {
            this.#cdataPartial += "]";
            this.#advanceWithCode(code);
            this.#cdataStartIdx = this.#bufferIndex;
          } else {
            this.#cdataPartial += "]]";
            this.#advanceWithCode(code);
            this.#state = State.CDATA;
          }
          break;
        }

        case State.PI_TARGET: {
          // Check if this is the first character of the PI target
          const isFirstChar = this.#piTargetStartIdx === this.#bufferIndex &&
            this.#piTargetPartial === "";

          if (isFirstChar) {
            // First character must be NameStartChar (XML 1.0 §2.6)
            if (this.#isNameStartCharCode(code)) {
              this.#advanceWithCode(code);
            } else if (this.#isWhitespaceCode(code) || code === CC_QUESTION) {
              // Empty PI target is not allowed
              this.#error("Processing instruction target is required");
            } else {
              this.#error(
                `Invalid character '${
                  String.fromCharCode(code)
                }' at start of processing instruction target`,
              );
            }
          } else if (this.#isNameCharCode(code)) {
            // Subsequent characters use NameChar
            this.#advanceWithCode(code);
          } else if (this.#isWhitespaceCode(code)) {
            // Save target and transition to content
            const target = this.#getPiTarget();
            this.#piTargetPartial = target; // Store temporarily
            this.#advanceWithCode(code);
            this.#piContentStartIdx = this.#bufferIndex;
            this.#piContentPartial = "";
            this.#state = State.PI_CONTENT;
          } else if (code === CC_QUESTION) {
            const target = this.#getPiTarget();
            this.#piTargetPartial = target; // Store temporarily
            this.#advanceWithCode(code);
            this.#state = State.PI_TARGET_QUESTION;
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(code)
              }' in processing instruction target`,
            );
          }
          break;
        }

        case State.PI_TARGET_QUESTION: {
          if (code === CC_GT) {
            if (isReservedPiTarget(this.#piTargetPartial)) {
              this.#emitDeclaration(this.#piTargetPartial, "");
            } else {
              // Any PI before XML declaration invalidates XMLDecl position
              this.#xmlDeclAllowed = false;
              this.#callbacks.onProcessingInstruction?.(
                this.#piTargetPartial,
                "",
                this.#tokenLine,
                this.#tokenColumn,
                this.#tokenOffset,
              );
            }
            this.#piTargetPartial = "";
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else {
            this.#error(
              `Expected '>' after '?' in processing instruction, got '${
                String.fromCharCode(code)
              }'`,
            );
          }
          break;
        }

        case State.PI_QUESTION: {
          if (code === CC_GT) {
            if (isReservedPiTarget(this.#piTargetPartial)) {
              this.#emitDeclaration(
                this.#piTargetPartial,
                this.#piContentPartial,
              );
            } else {
              // Any PI before XML declaration invalidates XMLDecl position
              this.#xmlDeclAllowed = false;
              this.#callbacks.onProcessingInstruction?.(
                this.#piTargetPartial,
                this.#piContentPartial.trim(),
                this.#tokenLine,
                this.#tokenColumn,
                this.#tokenOffset,
              );
            }
            this.#piTargetPartial = "";
            this.#piContentPartial = "";
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else if (code === CC_QUESTION) {
            this.#piContentPartial += "?";
            this.#advanceWithCode(code);
          } else {
            this.#piContentPartial += "?";
            // Restart capturing from current position
            this.#piContentStartIdx = this.#bufferIndex;
            this.#advanceWithCode(code);
            this.#state = State.PI_CONTENT;
          }
          break;
        }

        // === COLDEST PATH: DOCTYPE states (very rare) ===

        case State.DOCTYPE_START: {
          this.#doctypeCheck += String.fromCharCode(code);
          this.#advanceWithCode(code);
          if (this.#doctypeCheck === "DOCTYPE") {
            this.#doctypeName = "";
            this.#doctypePublicId = "";
            this.#doctypeSystemId = "";
            this.#state = State.DOCTYPE_NAME;
          } else if (!"DOCTYPE".startsWith(this.#doctypeCheck)) {
            this.#error(`Expected DOCTYPE, got <!${this.#doctypeCheck}`);
          }
          break;
        }

        case State.DOCTYPE_NAME: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
            if (this.#doctypeName !== "") {
              this.#state = State.DOCTYPE_AFTER_NAME;
            }
          } else if (code === CC_GT) {
            this.#callbacks.onDoctype?.(
              this.#doctypeName,
              undefined,
              undefined,
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else if (code === CC_LBRACKET) {
            this.#advanceWithCode(code);
            this.#doctypeBracketDepth = 1;
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (
            this.#isNameCharCode(code) ||
            (this.#doctypeName === "" && this.#isNameStartCharCode(code))
          ) {
            this.#doctypeName += String.fromCharCode(code);
            this.#advanceWithCode(code);
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(code)
              }' in DOCTYPE name`,
            );
          }
          break;
        }

        case State.DOCTYPE_AFTER_NAME: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_GT) {
            this.#callbacks.onDoctype?.(
              this.#doctypeName,
              this.#doctypePublicId || undefined,
              this.#doctypeSystemId || undefined,
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else if (code === CC_LBRACKET) {
            this.#advanceWithCode(code);
            this.#doctypeBracketDepth = 1;
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (code === CC_P_UPPER) {
            this.#doctypeCheck = "P";
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_PUBLIC;
          } else if (code === CC_S_UPPER) {
            this.#doctypeCheck = "S";
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_SYSTEM;
          } else if (code === 112) { // 'p' lowercase
            // Check if this is 'public' (wrong case)
            if (
              this.#bufferIndex + 5 < this.#buffer.length &&
              this.#buffer.slice(
                  this.#bufferIndex,
                  this.#bufferIndex + 6,
                ).toLowerCase() === "public"
            ) {
              this.#error(
                `'${
                  this.#buffer.slice(this.#bufferIndex, this.#bufferIndex + 6)
                }' must be uppercase 'PUBLIC'`,
              );
            }
            this.#error(
              `Unexpected character '${String.fromCharCode(code)}' in DOCTYPE`,
            );
          } else if (code === 115) { // 's' lowercase
            // Check if this is 'system' (wrong case)
            if (
              this.#bufferIndex + 5 < this.#buffer.length &&
              this.#buffer.slice(
                  this.#bufferIndex,
                  this.#bufferIndex + 6,
                ).toLowerCase() === "system"
            ) {
              this.#error(
                `'${
                  this.#buffer.slice(this.#bufferIndex, this.#bufferIndex + 6)
                }' must be uppercase 'SYSTEM'`,
              );
            }
            this.#error(
              `Unexpected character '${String.fromCharCode(code)}' in DOCTYPE`,
            );
          } else {
            this.#error(
              `Unexpected character '${String.fromCharCode(code)}' in DOCTYPE`,
            );
          }
          break;
        }

        case State.DOCTYPE_PUBLIC: {
          this.#doctypeCheck += String.fromCharCode(code);
          this.#advanceWithCode(code);
          if (this.#doctypeCheck === "PUBLIC") {
            this.#state = State.DOCTYPE_PUBLIC_ID;
          } else if (!"PUBLIC".startsWith(this.#doctypeCheck)) {
            this.#error(`Expected PUBLIC, got ${this.#doctypeCheck}`);
          }
          break;
        }

        case State.DOCTYPE_PUBLIC_ID: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_DQUOTE || code === CC_SQUOTE) {
            this.#doctypeQuoteChar = String.fromCharCode(code);
            this.#advanceWithCode(code);
            this.#doctypePublicId = this.#readDoctypeQuotedString();
            // Validate PubidLiteral characters
            this.#validatePubidLiteral(
              this.#doctypePublicId,
              this.#doctypeQuoteChar,
            );
            this.#state = State.DOCTYPE_AFTER_PUBLIC_ID;
          } else {
            this.#error(`Expected quote to start public ID`);
          }
          break;
        }

        case State.DOCTYPE_AFTER_PUBLIC_ID: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_DQUOTE || code === CC_SQUOTE) {
            this.#doctypeQuoteChar = String.fromCharCode(code);
            this.#advanceWithCode(code);
            this.#doctypeSystemId = this.#readDoctypeQuotedString();
            this.#state = State.DOCTYPE_AFTER_NAME;
          } else if (code === CC_GT) {
            this.#callbacks.onDoctype?.(
              this.#doctypeName,
              this.#doctypePublicId,
              undefined,
              this.#tokenLine,
              this.#tokenColumn,
              this.#tokenOffset,
            );
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else {
            this.#error(`Expected system ID or '>' after public ID`);
          }
          break;
        }

        case State.DOCTYPE_SYSTEM: {
          this.#doctypeCheck += String.fromCharCode(code);
          this.#advanceWithCode(code);
          if (this.#doctypeCheck === "SYSTEM") {
            this.#state = State.DOCTYPE_SYSTEM_ID;
          } else if (!"SYSTEM".startsWith(this.#doctypeCheck)) {
            this.#error(`Expected SYSTEM, got ${this.#doctypeCheck}`);
          }
          break;
        }

        case State.DOCTYPE_SYSTEM_ID: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_DQUOTE || code === CC_SQUOTE) {
            this.#doctypeQuoteChar = String.fromCharCode(code);
            this.#advanceWithCode(code);
            this.#doctypeSystemId = this.#readDoctypeQuotedString();
            this.#state = State.DOCTYPE_AFTER_NAME;
          } else {
            this.#error(`Expected quote to start system ID`);
          }
          break;
        }

        case State.DOCTYPE_INTERNAL_SUBSET: {
          if (code === CC_RBRACKET) {
            this.#doctypeBracketDepth--;
            this.#advanceWithCode(code);
            if (this.#doctypeBracketDepth === 0) {
              this.#state = State.DOCTYPE_AFTER_NAME;
            }
          } else if (code === CC_LT) {
            this.#advanceWithCode(code);
            this.#state = State.DTD_DECL_START;
          } else if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_LBRACKET) {
            // Conditional sections (INCLUDE/IGNORE) are only allowed in external subset
            this.#error(
              "Conditional sections (INCLUDE/IGNORE) are not allowed in internal DTD subset",
            );
          } else if (code === 37) { // % - parameter entity reference
            this.#advanceWithCode(code);
            this.#state = State.DTD_PE_REF;
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(code)
              }' in DOCTYPE internal subset`,
            );
          }
          break;
        }

        case State.DOCTYPE_INTERNAL_SUBSET_STRING: {
          if (String.fromCharCode(code) === this.#doctypeQuoteChar) {
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else {
            this.#advanceWithCode(code);
          }
          break;
        }

        case State.DTD_DECL_START: {
          if (code === CC_BANG) {
            this.#advanceWithCode(code);
            this.#dtdDeclKeyword = "";
            this.#state = State.DTD_DECL_KEYWORD;
          } else if (code === CC_QUESTION) {
            this.#advanceWithCode(code);
            this.#state = State.DTD_PI;
          } else {
            this.#error(`Expected '!' or '?' after '<' in DTD`);
          }
          break;
        }

        case State.DTD_DECL_KEYWORD: {
          if (code === CC_DASH) {
            // Could be start of comment
            if (this.#dtdDeclKeyword === "") {
              this.#advanceWithCode(code);
              this.#state = State.DTD_COMMENT_START;
            } else {
              this.#error(
                `Unexpected '-' in declaration keyword '${this.#dtdDeclKeyword}'`,
              );
            }
          } else if (this.#isWhitespaceCode(code)) {
            // End of keyword, validate and continue
            const kw = this.#dtdDeclKeyword;
            if (
              kw === "ENTITY" || kw === "ELEMENT" || kw === "ATTLIST" ||
              kw === "NOTATION"
            ) {
              this.#advanceWithCode(code);
              this.#dtdDeclParenDepth = 0;
              this.#dtdDeclSawWhitespace = true;
              // Initialize ENTITY declaration parsing state
              this.#isEntityDecl = kw === "ENTITY";
              this.#isParameterEntity = false;
              this.#entityName = "";
              this.#entityValue = "";
              this.#entityParsePhase = "name";
              this.#entityExternalType = "";
              this.#entityQuotedLiterals = 0;
              this.#entityCurrentKeyword = "";
              this.#state = State.DTD_DECL_CONTENT;
            } else {
              this.#error(`Unknown declaration type '<!${kw}'`);
            }
          } else if (
            code >= CC_A_UPPER && code <= CC_Z_UPPER ||
            code >= CC_A_LOWER && code <= CC_Z_LOWER
          ) {
            this.#dtdDeclKeyword += String.fromCharCode(code);
            this.#advanceWithCode(code);
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(code)
              }' in declaration keyword`,
            );
          }
          break;
        }

        case State.DTD_DECL_CONTENT: {
          if (code === CC_GT && this.#dtdDeclParenDepth === 0) {
            // End of declaration - validate and emit entity if applicable
            if (this.#isEntityDecl) {
              // Process any pending keyword
              this.#processEntityKeyword();
              // Validate PUBLIC has both literals
              if (
                this.#entityExternalType === "PUBLIC" &&
                this.#entityQuotedLiterals < 2
              ) {
                this.#error(
                  "PUBLIC identifier requires both public ID and system ID literals",
                );
              }
              // Emit entity if applicable
              if (
                !this.#isParameterEntity &&
                this.#entityName && this.#entityValue !== undefined
              ) {
                this.#callbacks.onEntityDeclaration?.(
                  this.#entityName,
                  this.#entityValue,
                );
              }
            }
            this.#isEntityDecl = false;
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (code === CC_DQUOTE || code === CC_SQUOTE) {
            // String literal - must have whitespace before (except after opening paren)
            if (!this.#dtdDeclSawWhitespace && this.#dtdDeclParenDepth === 0) {
              this.#error(
                `Missing whitespace before quoted string in DTD declaration`,
              );
            }
            // Process any pending keyword before the quote
            if (this.#isEntityDecl) {
              this.#processEntityKeyword();
            }
            this.#dtdDeclQuoteChar = String.fromCharCode(code);
            this.#advanceWithCode(code);
            // Initialize string tracking
            this.#dtdStringValue = "";
            this.#dtdStringIsPubid = false;
            // For ENTITY declarations, track quoted literals
            if (this.#isEntityDecl) {
              if (this.#entityParsePhase === "value") {
                this.#entityValue = "";
              }
              this.#entityQuotedLiterals++;
              // First quoted literal after PUBLIC is PubidLiteral
              if (
                this.#entityExternalType === "PUBLIC" &&
                this.#entityQuotedLiterals === 1
              ) {
                this.#dtdStringIsPubid = true;
              }
            }
            this.#state = State.DTD_DECL_STRING;
          } else if (this.#isWhitespaceCode(code)) {
            // Process any accumulated keyword before whitespace
            if (this.#isEntityDecl && this.#entityCurrentKeyword) {
              this.#processEntityKeyword();
            }
            this.#dtdDeclSawWhitespace = true;
            this.#advanceWithCode(code);
          } else if (code === 40) { // (
            // Opening paren - must have whitespace before FIRST paren only
            // Nested parens like ((a|b)) are valid without whitespace between them
            if (!this.#dtdDeclSawWhitespace && this.#dtdDeclParenDepth === 0) {
              this.#error(
                `Missing whitespace before '(' in DTD declaration`,
              );
            }
            this.#dtdDeclParenDepth++;
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === 41) { // )
            if (this.#dtdDeclParenDepth === 0) {
              this.#error(`Unexpected ')' in DTD declaration`);
            }
            this.#dtdDeclParenDepth--;
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === CC_LBRACKET) {
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === CC_RBRACKET) {
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === 124) { // |
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === 44) { // ,
            // Comma is valid in element content models (sequence operator)
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === 37) { // %
            // Parameter entity marker or reference
            if (
              this.#isEntityDecl && this.#entityParsePhase === "name" &&
              this.#entityName === ""
            ) {
              // This is a parameter entity declaration: <!ENTITY % name "value">
              this.#isParameterEntity = true;
            }
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === 59) { // ;
            // End of entity reference
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === 35) { // #
            // #PCDATA, #IMPLIED, #REQUIRED, #FIXED
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (
            this.#isNameStartCharCode(code) || this.#isNameCharCode(code)
          ) {
            // Name token - for ENTITY declarations, capture name or keyword
            if (this.#isEntityDecl) {
              if (this.#entityParsePhase === "name") {
                // Accumulate entity name
                this.#entityName += String.fromCharCode(code);
              } else {
                // In value phase, accumulate keyword (SYSTEM/PUBLIC/NDATA)
                this.#entityCurrentKeyword += String.fromCharCode(code);
              }
            }
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === CC_DASH) {
            // Check for SGML-style comment (--) which is invalid in XML
            if (
              this.#isEntityDecl &&
              this.#dtdDeclParenDepth === 0 &&
              this.#bufferIndex + 1 < this.#buffer.length &&
              this.#buffer.charCodeAt(this.#bufferIndex + 1) === CC_DASH
            ) {
              this.#error(
                "SGML-style comments (--) are not allowed in XML declarations",
              );
            }
            // Hyphen in name (valid in NameChar but not NameStartChar)
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else if (code === 42 || code === 43 || code === 63) {
            // Content model operators: * + ?
            this.#dtdDeclSawWhitespace = false;
            this.#advanceWithCode(code);
          } else {
            this.#error(
              `Unexpected character '${
                String.fromCharCode(code)
              }' in DTD declaration`,
            );
          }
          // Transition from name to value phase when whitespace follows the name
          if (
            this.#isEntityDecl && this.#entityParsePhase === "name" &&
            this.#dtdDeclSawWhitespace && this.#entityName !== ""
          ) {
            this.#entityParsePhase = "value";
          }
          break;
        }

        case State.DTD_DECL_STRING: {
          if (String.fromCharCode(code) === this.#dtdDeclQuoteChar) {
            // Validate PubidLiteral if applicable
            if (this.#dtdStringIsPubid) {
              this.#validatePubidLiteral(
                this.#dtdStringValue,
                this.#dtdDeclQuoteChar,
              );
            }
            // For ENTITY declarations, mark value capture as done
            if (this.#isEntityDecl && this.#entityParsePhase === "value") {
              this.#entityParsePhase = "done";
            }
            this.#advanceWithCode(code);
            this.#dtdDeclSawWhitespace = false;
            this.#state = State.DTD_DECL_CONTENT;
          } else {
            // Accumulate string value for validation
            this.#dtdStringValue += String.fromCharCode(code);
            // For ENTITY declarations in value phase, capture the value
            if (this.#isEntityDecl && this.#entityParsePhase === "value") {
              this.#entityValue += String.fromCharCode(code);
            }
            this.#advanceWithCode(code);
          }
          break;
        }

        case State.DTD_COMMENT_START: {
          if (code === CC_DASH) {
            this.#advanceWithCode(code);
            this.#state = State.DTD_COMMENT;
          } else {
            this.#error(`Expected '-' after '<!-' in DTD`);
          }
          break;
        }

        case State.DTD_COMMENT: {
          if (code === CC_DASH) {
            this.#advanceWithCode(code);
            this.#state = State.DTD_COMMENT_DASH;
          } else {
            this.#advanceWithCode(code);
          }
          break;
        }

        case State.DTD_COMMENT_DASH: {
          if (code === CC_DASH) {
            this.#advanceWithCode(code);
            this.#state = State.DTD_COMMENT_DASH_DASH;
          } else {
            this.#advanceWithCode(code);
            this.#state = State.DTD_COMMENT;
          }
          break;
        }

        case State.DTD_COMMENT_DASH_DASH: {
          if (code === CC_GT) {
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else {
            // Per XML 1.0 §2.5, after '--' only '>' is permitted.
            // Any other character (including '-') means '--' appears
            // within the comment content, which is not allowed.
            this.#error(
              `'--' is not allowed within XML comments (XML 1.0 §2.5)`,
            );
          }
          break;
        }

        case State.DTD_PI: {
          if (code === CC_QUESTION) {
            this.#advanceWithCode(code);
            this.#state = State.DTD_PI_QUESTION;
          } else {
            this.#advanceWithCode(code);
          }
          break;
        }

        case State.DTD_PI_QUESTION: {
          if (code === CC_GT) {
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (code === CC_QUESTION) {
            // Multiple ? in a row
            this.#advanceWithCode(code);
          } else {
            this.#advanceWithCode(code);
            this.#state = State.DTD_PI;
          }
          break;
        }

        case State.DTD_PE_REF: {
          // Parameter entity reference: %name;
          // Skip the name and semicolon, then return to internal subset
          if (code === 59) { // ;
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (this.#isNameCharCode(code)) {
            // Name characters are valid
            this.#advanceWithCode(code);
          } else {
            this.#error("Invalid character in parameter entity reference");
          }
          break;
        }
      }
    }
  }

  /**
   * Finalize tokenization using callbacks.
   *
   * This method should be called after all chunks have been processed.
   * It flushes any pending text content and validates that the tokenizer
   * is in a valid end state.
   *
   * @param callbacks Callbacks to invoke for remaining tokens.
   * @throws {XmlSyntaxError} If the tokenizer is in an incomplete state.
   */
  finalize(callbacks: XmlTokenCallbacks): void {
    this.#callbacks = callbacks;
    this.#flushText();

    if (this.#state !== State.INITIAL) {
      // Provide specific error messages based on state
      const message = this.#getEndOfInputErrorMessage();
      this.#error(message);
    }
  }

  #getEndOfInputErrorMessage(): string {
    switch (this.#state) {
      // Unreachable - finalize() only calls this when state !== INITIAL.
      // Included for compile-time exhaustiveness checking.
      // deno-coverage-ignore-start
      case State.INITIAL:
        return "Unexpected end of input";
      // deno-coverage-ignore-stop
      case State.TAG_OPEN:
        return "Unexpected end of input after '<'";
      case State.TAG_NAME:
      case State.AFTER_TAG_NAME:
      case State.ATTRIBUTE_NAME:
      case State.AFTER_ATTRIBUTE_NAME:
      case State.BEFORE_ATTRIBUTE_VALUE:
      case State.EXPECT_SELF_CLOSE_GT:
        return "Unexpected end of input in start tag";
      case State.ATTRIBUTE_VALUE_DOUBLE:
      case State.ATTRIBUTE_VALUE_SINGLE:
        return "Unterminated attribute value";
      case State.END_TAG_NAME:
      case State.AFTER_END_TAG_NAME:
        return "Unexpected end of input in end tag";
      case State.COMMENT:
      case State.COMMENT_START:
      case State.COMMENT_DASH:
      case State.COMMENT_DASH_DASH:
        return "Unterminated comment";
      case State.CDATA:
      case State.CDATA_START:
      case State.CDATA_BRACKET:
      case State.CDATA_BRACKET_BRACKET:
        return "Unterminated CDATA section";
      case State.PI_TARGET:
      case State.PI_TARGET_QUESTION:
      case State.PI_CONTENT:
      case State.PI_QUESTION:
        return "Unterminated processing instruction";
      case State.MARKUP_DECLARATION:
        return "Unexpected end of input in markup declaration";
      case State.DOCTYPE_START:
      case State.DOCTYPE_NAME:
      case State.DOCTYPE_AFTER_NAME:
      case State.DOCTYPE_PUBLIC:
      case State.DOCTYPE_PUBLIC_ID:
      case State.DOCTYPE_AFTER_PUBLIC_ID:
      case State.DOCTYPE_SYSTEM:
      case State.DOCTYPE_SYSTEM_ID:
      case State.DOCTYPE_INTERNAL_SUBSET:
      case State.DOCTYPE_INTERNAL_SUBSET_STRING:
      case State.DTD_DECL_START:
      case State.DTD_DECL_KEYWORD:
      case State.DTD_DECL_CONTENT:
      case State.DTD_DECL_STRING:
        return "Unterminated DOCTYPE";
      case State.DTD_COMMENT:
      case State.DTD_COMMENT_START:
      case State.DTD_COMMENT_DASH:
      case State.DTD_COMMENT_DASH_DASH:
        return "Unterminated comment in DOCTYPE";
      case State.DTD_PI:
      case State.DTD_PI_QUESTION:
        return "Unterminated processing instruction in DOCTYPE";
      case State.DTD_PE_REF:
        return "Unterminated parameter entity reference in DOCTYPE";
    }
    // TypeScript ensures exhaustiveness - if a new State is added,
    // compilation fails until it's handled above.
  }
}
