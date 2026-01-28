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
  ENCODING_RE,
  LINE_ENDING_RE,
  STANDALONE_RE,
  VERSION_RE,
} from "./_common.ts";

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
const CC_UNDERSCORE = 95; // _
const CC_COLON = 58; // :
const CC_DOT = 46; // .
const CC_DASH = 45; // -
const CC_LBRACKET = 91; // [
const CC_RBRACKET = 93; // ]
const CC_A_UPPER = 65; // A
const CC_Z_UPPER = 90; // Z
const CC_A_LOWER = 97; // a
const CC_Z_LOWER = 122; // z
const CC_0 = 48; // 0
const CC_9 = 57; // 9
const CC_D_UPPER = 68; // D
const CC_P_UPPER = 80; // P
const CC_S_UPPER = 83; // S

// NOTE: These patterns cover ASCII subset of XML 1.0 NameStartChar/NameChar.
// Non-ASCII uses permissive `code > 127` fallback - accepts some invalid chars
// but is pragmatic for a non-validating parser.

// Pre-computed lookup tables for name character validation
// Index corresponds to character code 0-255, value 1 = valid, 0 = invalid
const NAME_START_CHAR_TABLE = new Uint8Array(256);
const NAME_CHAR_TABLE = new Uint8Array(256);

// Initialize lookup tables at module load
for (let i = 0; i < 256; i++) {
  // NameStartChar: a-z, A-Z, _, :, or non-ASCII (128-255)
  NAME_START_CHAR_TABLE[i] = (
      (i >= CC_A_LOWER && i <= CC_Z_LOWER) || // a-z
      (i >= CC_A_UPPER && i <= CC_Z_UPPER) || // A-Z
      i === CC_UNDERSCORE || i === CC_COLON || // _ :
      i > 127 // non-ASCII
    )
    ? 1
    : 0;

  // NameChar: NameStartChar + 0-9, ., -
  NAME_CHAR_TABLE[i] = (
      (i >= CC_A_LOWER && i <= CC_Z_LOWER) || // a-z
      (i >= CC_A_UPPER && i <= CC_Z_UPPER) || // A-Z
      (i >= CC_0 && i <= CC_9) || // 0-9
      i === CC_UNDERSCORE || i === CC_COLON || // _ :
      i === CC_DOT || i === CC_DASH || // . -
      i > 127 // non-ASCII
    )
    ? 1
    : 0;
}

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

  // Optimized character checks using pre-computed lookup tables
  #isNameStartCharCode(code: number): boolean {
    // Lookup table for 0-255, fallback to true for code points > 255 (rare)
    return code < 256 ? NAME_START_CHAR_TABLE[code] === 1 : true;
  }

  #isNameCharCode(code: number): boolean {
    // Lookup table for 0-255, fallback to true for code points > 255 (rare)
    return code < 256 ? NAME_CHAR_TABLE[code] === 1 : true;
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
    return chunk.includes("\r") ? chunk.replace(LINE_ENDING_RE, "\n") : chunk;
  }

  #emitDeclaration(content: string): void {
    const versionMatch = VERSION_RE.exec(content);
    const encodingMatch = ENCODING_RE.exec(content);
    const standaloneMatch = STANDALONE_RE.exec(content);

    const version = versionMatch?.[1] ?? versionMatch?.[2] ?? "1.0";
    const encoding = encodingMatch?.[1] ?? encodingMatch?.[2];
    const standalone = standaloneMatch?.[1] ?? standaloneMatch?.[2];

    this.#callbacks.onDeclaration?.(
      version,
      encoding,
      standalone as "yes" | "no" | undefined,
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
    this.#advanceWithCode(buffer.charCodeAt(this.#bufferIndex));
    return value;
  }

  // ========================================================================
  // DEDICATED CAPTURE METHODS
  // These tight loops avoid per-character switch overhead for hot paths.
  // ========================================================================

  /**
   * Capture text content in a tight loop until '<' is found.
   * Returns true if '<' was found, false if end of buffer reached.
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

    // Tight loop: scan for '<'
    if (this.#trackPosition) {
      while (this.#bufferIndex < bufferLen) {
        const code = buffer.charCodeAt(this.#bufferIndex);
        if (code === CC_LT) {
          return true;
        }
        if (code === CC_LF) {
          this.#line++;
          this.#column = 1;
        } else {
          this.#column++;
        }
        this.#offset++;
        this.#bufferIndex++;
      }
    } else {
      // Fast path without position tracking
      while (this.#bufferIndex < bufferLen) {
        if (buffer.charCodeAt(this.#bufferIndex) === CC_LT) {
          return true;
        }
        this.#bufferIndex++;
      }
    }

    return false;
  }

  /**
   * Capture an XML name (element or attribute name) in a tight loop.
   * Returns the captured name, or empty string if no valid name found.
   *
   * Assumes the first character has already been validated as NameStartChar.
   * Continues until a non-NameChar is encountered.
   */
  #captureNameChars(buffer: string, bufferLen: number): void {
    // Tight loop: scan NameChar characters
    if (this.#trackPosition) {
      while (this.#bufferIndex < bufferLen) {
        const code = buffer.charCodeAt(this.#bufferIndex);
        if (!this.#isNameCharCode(code)) {
          return; // End of name
        }
        this.#column++;
        this.#offset++;
        this.#bufferIndex++;
      }
    } else {
      // Fast path without position tracking
      while (this.#bufferIndex < bufferLen) {
        if (!this.#isNameCharCode(buffer.charCodeAt(this.#bufferIndex))) {
          return;
        }
        this.#bufferIndex++;
      }
    }
  }

  /**
   * Batch-scan comment using indexOf("-->"). Returns true if complete and emitted.
   * When incomplete, consumes safe content (excluding trailing -) for char-by-char.
   */
  #captureComment(buffer: string, bufferLen: number): boolean {
    const endIdx = buffer.indexOf("-->", this.#bufferIndex);

    if (endIdx !== -1) {
      // Fast path: found complete "-->" terminator
      const content = this.#commentPartial +
        buffer.slice(this.#commentStartIdx, endIdx);

      // Update position for the content region + terminator
      this.#updatePositionForRegion(buffer, this.#bufferIndex, endIdx + 3);
      this.#bufferIndex = endIdx + 3;

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
      this.#commentPartial += buffer.slice(this.#commentStartIdx, safeEnd);
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
      const content = this.#piContentPartial +
        buffer.slice(this.#piContentStartIdx, endIdx);

      // Update position for the content region + terminator
      this.#updatePositionForRegion(buffer, this.#bufferIndex, endIdx + 2);
      this.#bufferIndex = endIdx + 2;

      // Emit the appropriate token type
      if (this.#piTargetPartial.toLowerCase() === "xml") {
        this.#emitDeclaration(content);
      } else {
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

    // Batch consume the safe region
    if (safeEnd > this.#bufferIndex) {
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
   */
  #captureCDATA(buffer: string, bufferLen: number): boolean {
    const endIdx = buffer.indexOf("]]>", this.#bufferIndex);

    if (endIdx !== -1) {
      // Fast path: found complete "]]>" terminator
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
      this.#cdataPartial += buffer.slice(this.#cdataStartIdx, safeEnd);
      this.#updatePositionForRegion(buffer, this.#bufferIndex, safeEnd);
      this.#bufferIndex = safeEnd;
      this.#cdataStartIdx = safeEnd;
    }

    return false; // Let char-by-char handle remaining characters
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
    this.#buffer = this.#buffer.slice(this.#bufferIndex) +
      this.#normalizeLineEndings(chunk);
    this.#bufferIndex = 0;

    // Cache hot variables locally to reduce private field access overhead.
    // Private field access (#) can be slower than local variable access.
    const buffer = this.#buffer;
    const bufferLen = buffer.length;

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
            if (!this.#isNameStartCharCode(code)) {
              this.#error(
                `Unexpected character '${
                  String.fromCharCode(code)
                }' in end tag`,
              );
            }
            this.#advanceWithCode(code);
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
          if (code === CC_DQUOTE) {
            this.#callbacks.onAttribute?.(
              this.#attrNamePartial,
              this.#getAttrValue(),
            );
            this.#attrNamePartial = "";
            this.#advanceWithCode(code);
            this.#state = State.AFTER_TAG_NAME;
          } else if (code === CC_LT) {
            this.#error(`'<' not allowed in attribute value`);
          } else {
            this.#advanceWithCode(code);
          }
          break;
        }

        case State.AFTER_TAG_NAME: {
          if (this.#isWhitespaceCode(code)) {
            this.#advanceWithCode(code);
          } else if (code === CC_GT) {
            this.#callbacks.onStartTagClose?.(false);
            this.#advanceWithCode(code);
            this.#state = State.INITIAL;
          } else if (code === CC_SLASH) {
            this.#advanceWithCode(code);
            this.#state = State.EXPECT_SELF_CLOSE_GT;
          } else if (this.#isNameStartCharCode(code)) {
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
          } else if (this.#isNameStartCharCode(code)) {
            this.#tagNameStartIdx = this.#bufferIndex;
            this.#tagNamePartial = "";
            this.#advanceWithCode(code);
            this.#state = State.TAG_NAME;
          } else {
            this.#error(
              `Unexpected character '${String.fromCharCode(code)}' after '<'`,
            );
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
          if (code === CC_SQUOTE) {
            this.#callbacks.onAttribute?.(
              this.#attrNamePartial,
              this.#getAttrValue(),
            );
            this.#attrNamePartial = "";
            this.#advanceWithCode(code);
            this.#state = State.AFTER_TAG_NAME;
          } else if (code === CC_LT) {
            this.#error(`'<' not allowed in attribute value`);
          } else {
            this.#advanceWithCode(code);
          }
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
            this.#commentPartial += "-";
            this.#advanceWithCode(code);
          } else {
            // Spec violation: -- inside comment. Be lenient.
            this.#commentPartial += "--";
            // Restart capturing from current position
            this.#commentStartIdx = this.#bufferIndex;
            this.#advanceWithCode(code);
            this.#state = State.COMMENT;
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
          if (this.#isNameCharCode(code)) {
            this.#advanceWithCode(code);
          } else if (this.#isWhitespaceCode(code)) {
            // Save target
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
            if (this.#piTargetPartial.toLowerCase() === "xml") {
              this.#emitDeclaration("");
            } else {
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
            if (this.#piTargetPartial.toLowerCase() === "xml") {
              this.#emitDeclaration(this.#piContentPartial);
            } else {
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
          } else if (code === CC_LBRACKET) {
            this.#doctypeBracketDepth++;
            this.#advanceWithCode(code);
          } else if (code === CC_DQUOTE || code === CC_SQUOTE) {
            this.#doctypeQuoteChar = String.fromCharCode(code);
            this.#advanceWithCode(code);
            this.#state = State.DOCTYPE_INTERNAL_SUBSET_STRING;
          } else {
            this.#advanceWithCode(code);
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
        return "Unterminated DOCTYPE";
    }
    // TypeScript ensures exhaustiveness - if a new State is added,
    // compilation fails until it's handled above.
  }
}
