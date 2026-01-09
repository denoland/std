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

import { type XmlPosition, XmlSyntaxError } from "./types.ts";
import {
  ENCODING_RE,
  LINE_ENDING_RE,
  STANDALONE_RE,
  VERSION_RE,
} from "./_common.ts";

/** Position information for tokens. Re-exported from types.ts for convenience. */
export type TokenPosition = XmlPosition;

/** Token types emitted by the tokenizer. */
export type XmlToken =
  | { type: "start_tag_open"; name: string; position: TokenPosition }
  | { type: "attribute"; name: string; value: string }
  | { type: "start_tag_close"; selfClosing: boolean }
  | { type: "end_tag"; name: string; position: TokenPosition }
  | { type: "text"; content: string; position: TokenPosition }
  | { type: "cdata"; content: string; position: TokenPosition }
  | { type: "comment"; content: string; position: TokenPosition }
  | {
    type: "processing_instruction";
    target: string;
    content: string;
    position: TokenPosition;
  }
  | {
    type: "declaration";
    version: string;
    encoding?: string;
    standalone?: "yes" | "no";
    position: TokenPosition;
  }
  | {
    type: "doctype";
    name: string;
    publicId?: string;
    systemId?: string;
    position: TokenPosition;
  };

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
} as const;

type StateType = typeof State[keyof typeof State];

// NOTE: These patterns cover the ASCII subset of XML 1.0 NameStartChar/NameChar.
// The full spec (Production [4], [4a]) includes many Unicode ranges:
//   NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | ...
//   NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | ...
//
// For pragmatic reasons, we use `charCodeAt(0) > 127` as a fallback for non-ASCII.
// This is OVERLY PERMISSIVE: it accepts some characters the spec excludes (e.g.,
// U+00D7 multiplication sign, U+00F7 division sign, U+037E Greek question mark).
// However, invalid names are rare in real documents, and a fully compliant regex
// would be ~200+ characters. This trade-off is acceptable for a non-validating parser.

/**
 * Stateful XML Tokenizer.
 *
 * Processes XML input chunk by chunk, emitting tokens. Handles cross-chunk
 * boundaries correctly for all XML constructs.
 *
 * @example Basic usage
 * ```ts ignore
 * const tokenizer = new XmlTokenizer();
 * const tokens1 = tokenizer.process("<root>");
 * const tokens2 = tokenizer.process("</root>");
 * const remaining = tokenizer.finalize();
 * ```
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

  // Slice-based accumulators: track start index + partial for cross-chunk
  #textStartIdx = -1;
  #textPartial = "";
  #cdataStartIdx = -1;
  #cdataPartial = "";
  #attrStartIdx = -1;
  #attrPartial = "";

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
  #doctypeBracketDepth = 0;

  // For tracking text start position
  #textStartLine = 1;
  #textStartColumn = 1;
  #textStartOffset = 0;

  #tokens: XmlToken[] = [];

  #saveTokenPosition(): void {
    this.#tokenLine = this.#line;
    this.#tokenColumn = this.#column;
    this.#tokenOffset = this.#offset;
  }

  #getTokenPosition(): TokenPosition {
    return {
      line: this.#tokenLine,
      column: this.#tokenColumn,
      offset: this.#tokenOffset,
    };
  }

  #error(message: string): never {
    throw new XmlSyntaxError(message, {
      line: this.#line,
      column: this.#column,
      offset: this.#offset,
    });
  }

  // Optimized character checks using charCode (4x faster than regex)
  #isNameStartChar(c: string): boolean {
    const code = c.charCodeAt(0);
    return (code >= 97 && code <= 122) || // a-z
      (code >= 65 && code <= 90) || // A-Z
      code === 95 || code === 58 || // _ :
      code > 127; // non-ASCII
  }

  #isNameChar(c: string): boolean {
    const code = c.charCodeAt(0);
    return (code >= 97 && code <= 122) || // a-z
      (code >= 65 && code <= 90) || // A-Z
      (code >= 48 && code <= 57) || // 0-9
      code === 95 || code === 58 || // _ :
      code === 46 || code === 45 || // . -
      code > 127; // non-ASCII
  }

  #isWhitespace(c: string): boolean {
    const code = c.charCodeAt(0);
    return code === 32 || code === 9 || code === 10 || code === 13; // space, tab, LF, CR
  }

  #flushText(): void {
    if (this.#textStartIdx !== -1) {
      const content = this.#textPartial +
        this.#buffer.slice(this.#textStartIdx, this.#bufferIndex);
      this.#textStartIdx = -1;
      this.#textPartial = "";
      if (content.length > 0) {
        this.#emit({
          type: "text",
          content,
          position: {
            line: this.#textStartLine,
            column: this.#textStartColumn,
            offset: this.#textStartOffset,
          },
        });
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

  #getComment(): string {
    const content = this.#commentPartial +
      this.#buffer.slice(this.#commentStartIdx, this.#bufferIndex);
    this.#commentStartIdx = -1;
    this.#commentPartial = "";
    return content;
  }

  #getPiTarget(): string {
    const target = this.#piTargetPartial +
      this.#buffer.slice(this.#piTargetStartIdx, this.#bufferIndex);
    this.#piTargetStartIdx = -1;
    this.#piTargetPartial = "";
    return target;
  }

  #getPiContent(): string {
    const content = this.#piContentPartial +
      this.#buffer.slice(this.#piContentStartIdx, this.#bufferIndex);
    this.#piContentStartIdx = -1;
    this.#piContentPartial = "";
    return content;
  }

  #savePartialsBeforeReset(): void {
    if (this.#textStartIdx !== -1) {
      this.#textPartial += this.#buffer.slice(
        this.#textStartIdx,
        this.#bufferIndex,
      );
      this.#textStartIdx = 0;
    }
    if (this.#cdataStartIdx !== -1) {
      this.#cdataPartial += this.#buffer.slice(
        this.#cdataStartIdx,
        this.#bufferIndex,
      );
      this.#cdataStartIdx = 0;
    }
    if (this.#attrStartIdx !== -1) {
      this.#attrPartial += this.#buffer.slice(
        this.#attrStartIdx,
        this.#bufferIndex,
      );
      this.#attrStartIdx = 0;
    }
    // OPTIMIZED: Save all index-based accumulators
    if (this.#tagNameStartIdx !== -1) {
      this.#tagNamePartial += this.#buffer.slice(
        this.#tagNameStartIdx,
        this.#bufferIndex,
      );
      this.#tagNameStartIdx = 0;
    }
    if (this.#commentStartIdx !== -1) {
      this.#commentPartial += this.#buffer.slice(
        this.#commentStartIdx,
        this.#bufferIndex,
      );
      this.#commentStartIdx = 0;
    }
    if (this.#piTargetStartIdx !== -1) {
      this.#piTargetPartial += this.#buffer.slice(
        this.#piTargetStartIdx,
        this.#bufferIndex,
      );
      this.#piTargetStartIdx = 0;
    }
    if (this.#piContentStartIdx !== -1) {
      this.#piContentPartial += this.#buffer.slice(
        this.#piContentStartIdx,
        this.#bufferIndex,
      );
      this.#piContentStartIdx = 0;
    }
    if (this.#attrNameStartIdx !== -1) {
      this.#attrNamePartial += this.#buffer.slice(
        this.#attrNameStartIdx,
        this.#bufferIndex,
      );
      this.#attrNameStartIdx = 0;
    }
  }

  #advance(): void {
    if (this.#buffer[this.#bufferIndex] === "\n") {
      this.#line++;
      this.#column = 1;
    } else {
      this.#column++;
    }
    this.#offset++;
    this.#bufferIndex++;
  }

  #normalizeLineEndings(chunk: string): string {
    return chunk.includes("\r") ? chunk.replace(LINE_ENDING_RE, "\n") : chunk;
  }

  #emit(token: XmlToken): void {
    this.#tokens.push(token);
  }

  #createDeclaration(content: string, position: TokenPosition): XmlToken {
    const versionMatch = VERSION_RE.exec(content);
    const encodingMatch = ENCODING_RE.exec(content);
    const standaloneMatch = STANDALONE_RE.exec(content);

    const version = versionMatch?.[1] ?? versionMatch?.[2] ?? "1.0";
    const encoding = encodingMatch?.[1] ?? encodingMatch?.[2];
    const standalone = standaloneMatch?.[1] ?? standaloneMatch?.[2];

    return {
      type: "declaration",
      version,
      ...(encoding && { encoding }),
      ...(standalone && { standalone: standalone as "yes" | "no" }),
      position,
    };
  }

  /**
   * Process a chunk of XML text and return tokens.
   *
   * This method is synchronous and can be called multiple times with
   * consecutive chunks of XML input. Tokens are returned as an array
   * for optimal performance.
   *
   * @param chunk The XML text chunk to process.
   * @returns Array of tokens extracted from this chunk.
   */
  process(chunk: string): XmlToken[] {
    this.#tokens = [];
    this.#savePartialsBeforeReset();
    this.#buffer = this.#buffer.slice(this.#bufferIndex) +
      this.#normalizeLineEndings(chunk);
    this.#bufferIndex = 0;

    while (this.#bufferIndex < this.#buffer.length) {
      const c = this.#buffer[this.#bufferIndex]!;

      switch (this.#state) {
        case State.INITIAL: {
          if (c === "<") {
            this.#flushText();
            this.#saveTokenPosition();
            this.#advance();
            this.#state = State.TAG_OPEN;
          } else {
            if (this.#textStartIdx === -1) {
              this.#textStartLine = this.#line;
              this.#textStartColumn = this.#column;
              this.#textStartOffset = this.#offset;
              this.#textStartIdx = this.#bufferIndex;
            }
            this.#advance();
          }
          break;
        }

        case State.TAG_OPEN: {
          if (c === "/") {
            this.#advance();
            this.#tagNameStartIdx = this.#bufferIndex;
            this.#tagNamePartial = "";
            this.#state = State.END_TAG_NAME;
          } else if (c === "!") {
            this.#advance();
            this.#state = State.MARKUP_DECLARATION;
          } else if (c === "?") {
            this.#advance();
            this.#piTargetStartIdx = this.#bufferIndex;
            this.#piTargetPartial = "";
            this.#state = State.PI_TARGET;
          } else if (this.#isNameStartChar(c)) {
            this.#tagNameStartIdx = this.#bufferIndex;
            this.#tagNamePartial = "";
            this.#advance();
            this.#state = State.TAG_NAME;
          } else {
            this.#error(`Unexpected character '${c}' after '<'`);
          }
          break;
        }

        case State.TAG_NAME: {
          if (this.#isNameChar(c)) {
            this.#advance();
          } else if (this.#isWhitespace(c)) {
            this.#emit({
              type: "start_tag_open",
              name: this.#getTagName(),
              position: this.#getTokenPosition(),
            });
            this.#advance();
            this.#state = State.AFTER_TAG_NAME;
          } else if (c === ">") {
            this.#emit({
              type: "start_tag_open",
              name: this.#getTagName(),
              position: this.#getTokenPosition(),
            });
            this.#emit({ type: "start_tag_close", selfClosing: false });
            this.#advance();
            this.#state = State.INITIAL;
          } else if (c === "/") {
            this.#emit({
              type: "start_tag_open",
              name: this.#getTagName(),
              position: this.#getTokenPosition(),
            });
            this.#advance();
            this.#state = State.EXPECT_SELF_CLOSE_GT;
          } else {
            this.#error(`Unexpected character '${c}' in tag name`);
          }
          break;
        }

        case State.AFTER_TAG_NAME: {
          if (this.#isWhitespace(c)) {
            this.#advance();
          } else if (c === ">") {
            this.#emit({ type: "start_tag_close", selfClosing: false });
            this.#advance();
            this.#state = State.INITIAL;
          } else if (c === "/") {
            this.#advance();
            this.#state = State.EXPECT_SELF_CLOSE_GT;
          } else if (this.#isNameStartChar(c)) {
            this.#attrNameStartIdx = this.#bufferIndex;
            this.#attrNamePartial = "";
            this.#advance();
            this.#state = State.ATTRIBUTE_NAME;
          } else {
            this.#error(`Unexpected character '${c}' after tag name`);
          }
          break;
        }

        case State.ATTRIBUTE_NAME: {
          if (this.#isNameChar(c)) {
            this.#advance();
          } else if (this.#isWhitespace(c)) {
            // Save the attribute name before transitioning
            const name = this.#getAttrName();
            this.#attrNamePartial = name; // Store temporarily
            this.#advance();
            this.#state = State.AFTER_ATTRIBUTE_NAME;
          } else if (c === "=") {
            const name = this.#getAttrName();
            this.#attrNamePartial = name; // Store temporarily
            this.#advance();
            this.#state = State.BEFORE_ATTRIBUTE_VALUE;
          } else {
            this.#error(`Unexpected character '${c}' in attribute name`);
          }
          break;
        }

        case State.AFTER_ATTRIBUTE_NAME: {
          if (this.#isWhitespace(c)) {
            this.#advance();
          } else if (c === "=") {
            this.#advance();
            this.#state = State.BEFORE_ATTRIBUTE_VALUE;
          } else {
            this.#error(`Expected '=' after attribute name`);
          }
          break;
        }

        case State.BEFORE_ATTRIBUTE_VALUE: {
          if (this.#isWhitespace(c)) {
            this.#advance();
          } else if (c === '"') {
            this.#advance();
            this.#attrStartIdx = this.#bufferIndex;
            this.#attrPartial = "";
            this.#state = State.ATTRIBUTE_VALUE_DOUBLE;
          } else if (c === "'") {
            this.#advance();
            this.#attrStartIdx = this.#bufferIndex;
            this.#attrPartial = "";
            this.#state = State.ATTRIBUTE_VALUE_SINGLE;
          } else {
            this.#error(`Expected quote to start attribute value`);
          }
          break;
        }

        case State.ATTRIBUTE_VALUE_DOUBLE: {
          if (c === '"') {
            this.#emit({
              type: "attribute",
              name: this.#attrNamePartial,
              value: this.#getAttrValue(),
            });
            this.#attrNamePartial = "";
            this.#advance();
            this.#state = State.AFTER_TAG_NAME;
          } else if (c === "<") {
            this.#error(`'<' not allowed in attribute value`);
          } else {
            this.#advance();
          }
          break;
        }

        case State.ATTRIBUTE_VALUE_SINGLE: {
          if (c === "'") {
            this.#emit({
              type: "attribute",
              name: this.#attrNamePartial,
              value: this.#getAttrValue(),
            });
            this.#attrNamePartial = "";
            this.#advance();
            this.#state = State.AFTER_TAG_NAME;
          } else if (c === "<") {
            this.#error(`'<' not allowed in attribute value`);
          } else {
            this.#advance();
          }
          break;
        }

        case State.END_TAG_NAME: {
          if (
            this.#tagNameStartIdx === this.#bufferIndex &&
            this.#tagNamePartial === "" &&
            this.#isNameStartChar(c)
          ) {
            this.#advance();
          } else if (this.#isNameChar(c)) {
            this.#advance();
          } else if (this.#isWhitespace(c)) {
            const name = this.#getTagName();
            this.#tagNamePartial = name; // Store temporarily
            this.#advance();
            this.#state = State.AFTER_END_TAG_NAME;
          } else if (c === ">") {
            this.#emit({
              type: "end_tag",
              name: this.#getTagName(),
              position: this.#getTokenPosition(),
            });
            this.#advance();
            this.#state = State.INITIAL;
          } else {
            this.#error(`Unexpected character '${c}' in end tag`);
          }
          break;
        }

        case State.AFTER_END_TAG_NAME: {
          if (this.#isWhitespace(c)) {
            this.#advance();
          } else if (c === ">") {
            this.#emit({
              type: "end_tag",
              name: this.#tagNamePartial,
              position: this.#getTokenPosition(),
            });
            this.#tagNamePartial = "";
            this.#advance();
            this.#state = State.INITIAL;
          } else {
            this.#error(`Unexpected character '${c}' in end tag`);
          }
          break;
        }

        case State.EXPECT_SELF_CLOSE_GT: {
          if (c === ">") {
            this.#emit({ type: "start_tag_close", selfClosing: true });
            this.#advance();
            this.#state = State.INITIAL;
          } else {
            this.#error(`Expected '>' after '/' in self-closing tag`);
          }
          break;
        }

        case State.MARKUP_DECLARATION: {
          if (c === "-") {
            this.#advance();
            this.#state = State.COMMENT_START;
          } else if (c === "[") {
            this.#advance();
            this.#cdataCheck = "";
            this.#state = State.CDATA_START;
          } else if (c === "D") {
            this.#doctypeCheck = "D";
            this.#advance();
            this.#state = State.DOCTYPE_START;
          } else {
            this.#error(`Unsupported markup declaration`);
          }
          break;
        }

        case State.DOCTYPE_START: {
          this.#doctypeCheck += c;
          this.#advance();
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
          if (this.#isWhitespace(c)) {
            if (this.#doctypeName === "") {
              this.#advance();
            } else {
              this.#advance();
              this.#state = State.DOCTYPE_AFTER_NAME;
            }
          } else if (c === ">") {
            this.#emit({
              type: "doctype",
              name: this.#doctypeName,
              position: this.#getTokenPosition(),
            });
            this.#advance();
            this.#state = State.INITIAL;
          } else if (c === "[") {
            this.#advance();
            this.#doctypeBracketDepth = 1;
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (
            this.#isNameChar(c) ||
            (this.#doctypeName === "" && this.#isNameStartChar(c))
          ) {
            this.#doctypeName += c;
            this.#advance();
          } else {
            this.#error(`Unexpected character '${c}' in DOCTYPE name`);
          }
          break;
        }

        case State.DOCTYPE_AFTER_NAME: {
          if (this.#isWhitespace(c)) {
            this.#advance();
          } else if (c === ">") {
            this.#emit({
              type: "doctype",
              name: this.#doctypeName,
              ...(this.#doctypePublicId && { publicId: this.#doctypePublicId }),
              ...(this.#doctypeSystemId && { systemId: this.#doctypeSystemId }),
              position: this.#getTokenPosition(),
            });
            this.#advance();
            this.#state = State.INITIAL;
          } else if (c === "[") {
            this.#advance();
            this.#doctypeBracketDepth = 1;
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (c === "P") {
            this.#doctypeCheck = "P";
            this.#advance();
            this.#state = State.DOCTYPE_PUBLIC;
          } else if (c === "S") {
            this.#doctypeCheck = "S";
            this.#advance();
            this.#state = State.DOCTYPE_SYSTEM;
          } else {
            this.#error(`Unexpected character '${c}' in DOCTYPE`);
          }
          break;
        }

        case State.DOCTYPE_PUBLIC: {
          this.#doctypeCheck += c;
          this.#advance();
          if (this.#doctypeCheck === "PUBLIC") {
            this.#state = State.DOCTYPE_PUBLIC_ID;
          } else if (!"PUBLIC".startsWith(this.#doctypeCheck)) {
            this.#error(`Expected PUBLIC, got ${this.#doctypeCheck}`);
          }
          break;
        }

        case State.DOCTYPE_PUBLIC_ID: {
          if (this.#isWhitespace(c)) {
            this.#advance();
          } else if (c === '"' || c === "'") {
            this.#doctypeQuoteChar = c;
            this.#doctypePublicId = "";
            this.#advance();
            while (
              this.#bufferIndex < this.#buffer.length &&
              this.#buffer[this.#bufferIndex] !== this.#doctypeQuoteChar
            ) {
              this.#doctypePublicId += this.#buffer[this.#bufferIndex];
              this.#advance();
            }
            if (this.#bufferIndex >= this.#buffer.length) {
              continue;
            }
            this.#advance();
            this.#state = State.DOCTYPE_AFTER_PUBLIC_ID;
          } else {
            this.#error(`Expected quote to start public ID`);
          }
          break;
        }

        case State.DOCTYPE_AFTER_PUBLIC_ID: {
          if (this.#isWhitespace(c)) {
            this.#advance();
          } else if (c === '"' || c === "'") {
            this.#doctypeQuoteChar = c;
            this.#doctypeSystemId = "";
            this.#advance();
            while (
              this.#bufferIndex < this.#buffer.length &&
              this.#buffer[this.#bufferIndex] !== this.#doctypeQuoteChar
            ) {
              this.#doctypeSystemId += this.#buffer[this.#bufferIndex];
              this.#advance();
            }
            if (this.#bufferIndex >= this.#buffer.length) {
              continue;
            }
            this.#advance();
            this.#state = State.DOCTYPE_AFTER_NAME;
          } else if (c === ">") {
            this.#emit({
              type: "doctype",
              name: this.#doctypeName,
              publicId: this.#doctypePublicId,
              position: this.#getTokenPosition(),
            });
            this.#advance();
            this.#state = State.INITIAL;
          } else {
            this.#error(`Expected system ID or '>' after public ID`);
          }
          break;
        }

        case State.DOCTYPE_SYSTEM: {
          this.#doctypeCheck += c;
          this.#advance();
          if (this.#doctypeCheck === "SYSTEM") {
            this.#state = State.DOCTYPE_SYSTEM_ID;
          } else if (!"SYSTEM".startsWith(this.#doctypeCheck)) {
            this.#error(`Expected SYSTEM, got ${this.#doctypeCheck}`);
          }
          break;
        }

        case State.DOCTYPE_SYSTEM_ID: {
          if (this.#isWhitespace(c)) {
            this.#advance();
          } else if (c === '"' || c === "'") {
            this.#doctypeQuoteChar = c;
            this.#doctypeSystemId = "";
            this.#advance();
            while (
              this.#bufferIndex < this.#buffer.length &&
              this.#buffer[this.#bufferIndex] !== this.#doctypeQuoteChar
            ) {
              this.#doctypeSystemId += this.#buffer[this.#bufferIndex];
              this.#advance();
            }
            if (this.#bufferIndex >= this.#buffer.length) {
              continue;
            }
            this.#advance();
            this.#state = State.DOCTYPE_AFTER_NAME;
          } else {
            this.#error(`Expected quote to start system ID`);
          }
          break;
        }

        case State.DOCTYPE_INTERNAL_SUBSET: {
          if (c === "]") {
            this.#doctypeBracketDepth--;
            this.#advance();
            if (this.#doctypeBracketDepth === 0) {
              this.#state = State.DOCTYPE_AFTER_NAME;
            }
          } else if (c === "[") {
            this.#doctypeBracketDepth++;
            this.#advance();
          } else if (c === '"' || c === "'") {
            this.#doctypeQuoteChar = c;
            this.#advance();
            this.#state = State.DOCTYPE_INTERNAL_SUBSET_STRING;
          } else {
            this.#advance();
          }
          break;
        }

        case State.DOCTYPE_INTERNAL_SUBSET_STRING: {
          if (c === this.#doctypeQuoteChar) {
            this.#advance();
            this.#state = State.DOCTYPE_INTERNAL_SUBSET;
          } else {
            this.#advance();
          }
          break;
        }

        case State.COMMENT_START: {
          if (c === "-") {
            this.#advance();
            this.#commentStartIdx = this.#bufferIndex;
            this.#commentPartial = "";
            this.#state = State.COMMENT;
          } else {
            this.#error(`Expected '-' to start comment`);
          }
          break;
        }

        case State.COMMENT: {
          if (c === "-") {
            // Save content up to this point
            this.#commentPartial += this.#buffer.slice(
              this.#commentStartIdx,
              this.#bufferIndex,
            );
            this.#advance();
            this.#commentStartIdx = this.#bufferIndex;
            this.#state = State.COMMENT_DASH;
          } else {
            this.#advance();
          }
          break;
        }

        case State.COMMENT_DASH: {
          if (c === "-") {
            this.#advance();
            // Mark that we've consumed the --, no more content to capture
            this.#commentStartIdx = -1;
            this.#state = State.COMMENT_DASH_DASH;
          } else {
            this.#commentPartial += "-";
            this.#commentStartIdx = this.#bufferIndex;
            this.#advance();
            this.#state = State.COMMENT;
          }
          break;
        }

        case State.COMMENT_DASH_DASH: {
          if (c === ">") {
            this.#emit({
              type: "comment",
              content: this.#commentPartial,
              position: this.#getTokenPosition(),
            });
            this.#commentStartIdx = -1;
            this.#commentPartial = "";
            this.#advance();
            this.#state = State.INITIAL;
          } else if (c === "-") {
            // Add one - to content, stay in COMMENT_DASH_DASH
            this.#commentPartial += "-";
            this.#advance();
          } else {
            // Spec violation: -- inside comment. Be lenient.
            this.#commentPartial += "--";
            // Restart capturing from current position
            this.#commentStartIdx = this.#bufferIndex;
            this.#advance();
            this.#state = State.COMMENT;
          }
          break;
        }

        case State.CDATA_START: {
          this.#cdataCheck += c;
          this.#advance();
          if (this.#cdataCheck === "CDATA[") {
            this.#cdataStartIdx = this.#bufferIndex;
            this.#cdataPartial = "";
            this.#state = State.CDATA;
          } else if (!"CDATA[".startsWith(this.#cdataCheck)) {
            this.#error(`Expected 'CDATA[' after '<![`);
          }
          break;
        }

        case State.CDATA: {
          if (c === "]") {
            this.#cdataPartial += this.#buffer.slice(
              this.#cdataStartIdx,
              this.#bufferIndex,
            );
            this.#advance();
            this.#cdataStartIdx = this.#bufferIndex;
            this.#state = State.CDATA_BRACKET;
          } else {
            this.#advance();
          }
          break;
        }

        case State.CDATA_BRACKET: {
          if (c === "]") {
            this.#advance();
            this.#cdataStartIdx = this.#bufferIndex;
            this.#state = State.CDATA_BRACKET_BRACKET;
          } else {
            this.#cdataPartial += "]";
            this.#advance();
            this.#state = State.CDATA;
          }
          break;
        }

        case State.CDATA_BRACKET_BRACKET: {
          if (c === ">") {
            this.#emit({
              type: "cdata",
              content: this.#cdataPartial,
              position: this.#getTokenPosition(),
            });
            this.#cdataStartIdx = -1;
            this.#cdataPartial = "";
            this.#advance();
            this.#state = State.INITIAL;
          } else if (c === "]") {
            this.#cdataPartial += "]";
            this.#advance();
            this.#cdataStartIdx = this.#bufferIndex;
          } else {
            this.#cdataPartial += "]]";
            this.#advance();
            this.#state = State.CDATA;
          }
          break;
        }

        case State.PI_TARGET: {
          if (this.#isNameChar(c)) {
            this.#advance();
          } else if (this.#isWhitespace(c)) {
            // Save target
            const target = this.#getPiTarget();
            this.#piTargetPartial = target; // Store temporarily
            this.#advance();
            this.#piContentStartIdx = this.#bufferIndex;
            this.#piContentPartial = "";
            this.#state = State.PI_CONTENT;
          } else if (c === "?") {
            const target = this.#getPiTarget();
            this.#piTargetPartial = target; // Store temporarily
            this.#advance();
            this.#state = State.PI_TARGET_QUESTION;
          } else {
            this.#error(
              `Unexpected character '${c}' in processing instruction target`,
            );
          }
          break;
        }

        case State.PI_TARGET_QUESTION: {
          if (c === ">") {
            if (this.#piTargetPartial.toLowerCase() === "xml") {
              this.#emit(this.#createDeclaration("", this.#getTokenPosition()));
            } else {
              this.#emit({
                type: "processing_instruction",
                target: this.#piTargetPartial,
                content: "",
                position: this.#getTokenPosition(),
              });
            }
            this.#piTargetPartial = "";
            this.#advance();
            this.#state = State.INITIAL;
          } else {
            this.#error(
              `Expected '>' after '?' in processing instruction, got '${c}'`,
            );
          }
          break;
        }

        case State.PI_CONTENT: {
          if (c === "?") {
            // Save content up to current position
            this.#piContentPartial += this.#buffer.slice(
              this.#piContentStartIdx,
              this.#bufferIndex,
            );
            this.#piContentStartIdx = -1;
            this.#advance();
            this.#state = State.PI_QUESTION;
          } else {
            this.#advance();
          }
          break;
        }

        case State.PI_QUESTION: {
          if (c === ">") {
            if (this.#piTargetPartial.toLowerCase() === "xml") {
              this.#emit(
                this.#createDeclaration(
                  this.#piContentPartial,
                  this.#getTokenPosition(),
                ),
              );
            } else {
              this.#emit({
                type: "processing_instruction",
                target: this.#piTargetPartial,
                content: this.#piContentPartial.trim(),
                position: this.#getTokenPosition(),
              });
            }
            this.#piTargetPartial = "";
            this.#piContentPartial = "";
            this.#advance();
            this.#state = State.INITIAL;
          } else if (c === "?") {
            this.#piContentPartial += "?";
            this.#advance();
          } else {
            this.#piContentPartial += "?";
            // Restart capturing from current position
            this.#piContentStartIdx = this.#bufferIndex;
            this.#advance();
            this.#state = State.PI_CONTENT;
          }
          break;
        }
      }
    }

    return this.#tokens;
  }

  /**
   * Finalize tokenization and return any remaining tokens.
   *
   * This method should be called after all chunks have been processed.
   * It flushes any pending text content and validates that the tokenizer
   * is in a valid end state.
   *
   * @returns Array of remaining tokens (typically just text content).
   * @throws {XmlSyntaxError} If the tokenizer is in an incomplete state.
   */
  finalize(): XmlToken[] {
    this.#tokens = [];
    this.#flushText();

    if (this.#state !== State.INITIAL) {
      // Provide specific error messages based on state
      const message = this.#getEndOfInputErrorMessage();
      this.#error(message);
    }

    return this.#tokens;
  }

  #getEndOfInputErrorMessage(): string {
    switch (this.#state) {
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
        return "Unterminated DOCTYPE";
      default:
        return "Unexpected end of input";
    }
  }
}

/**
 * Legacy async generator interface for backwards compatibility.
 *
 * @deprecated Use {@linkcode XmlTokenizer} class directly for better performance.
 * @param source Async iterable of XML string chunks.
 * @yields Arrays of XML tokens, batched per input chunk.
 */
export async function* tokenize(
  source: AsyncIterable<string>,
): AsyncGenerator<XmlToken[]> {
  const tokenizer = new XmlTokenizer();
  for await (const chunk of source) {
    const tokens = tokenizer.process(chunk);
    if (tokens.length > 0) {
      yield tokens;
    }
  }
  const remaining = tokenizer.finalize();
  if (remaining.length > 0) {
    yield remaining;
  }
}
