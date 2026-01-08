// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal XML tokenizer module.
 *
 * Implements a streaming state machine that tokenizes XML input,
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

type State = typeof State[keyof typeof State];

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
 * Tokenizes an async iterable of XML string chunks.
 *
 * Line endings are normalized per XML 1.0 §2.11.
 * Yields arrays of tokens (one array per input chunk) for better performance.
 *
 * @param source Async iterable of XML string chunks.
 * @yields Arrays of XML tokens, batched per input chunk.
 */
export async function* tokenize(
  source: AsyncIterable<string>,
): AsyncGenerator<XmlToken[]> {
  let buffer = "";
  let bufferIndex = 0;
  let state: State = State.INITIAL;
  let line = 1;
  let column = 1;
  let offset = 0;

  // Position of current token start
  let tokenLine = 1;
  let tokenColumn = 1;
  let tokenOffset = 0;

  // Slice-based accumulators: track start index + partial for cross-chunk
  // Text content (highest frequency)
  let textStartIdx = -1;
  let textPartial = "";
  // CDATA content (high frequency for product feeds)
  let cdataStartIdx = -1;
  let cdataPartial = "";
  // Attribute values (medium frequency)
  let attrStartIdx = -1;
  let attrPartial = "";

  // Traditional accumulators for short/infrequent strings
  let tagName = "";
  let attrName = "";
  let piTarget = "";
  let piContent = "";
  let commentContent = "";
  let cdataCheck = "";

  // DOCTYPE accumulators
  let doctypeCheck = "";
  let doctypeName = "";
  let doctypePublicId = "";
  let doctypeSystemId = "";
  let doctypeQuoteChar = "";
  let doctypeBracketDepth = 0;

  // For tracking text start position
  let textStartLine = 1;
  let textStartColumn = 1;
  let textStartOffset = 0;

  function saveTokenPosition(): void {
    tokenLine = line;
    tokenColumn = column;
    tokenOffset = offset;
  }

  function getTokenPosition(): TokenPosition {
    return { line: tokenLine, column: tokenColumn, offset: tokenOffset };
  }

  function error(message: string): never {
    throw new XmlSyntaxError(message, { line, column, offset });
  }

  // Optimized character checks using charCode (4x faster than regex)
  function isNameStartChar(c: string): boolean {
    const code = c.charCodeAt(0);
    return (code >= 97 && code <= 122) || // a-z
      (code >= 65 && code <= 90) || // A-Z
      code === 95 || code === 58 || // _ :
      code > 127; // non-ASCII
  }

  function isNameChar(c: string): boolean {
    const code = c.charCodeAt(0);
    return (code >= 97 && code <= 122) || // a-z
      (code >= 65 && code <= 90) || // A-Z
      (code >= 48 && code <= 57) || // 0-9
      code === 95 || code === 58 || // _ :
      code === 46 || code === 45 || // . -
      code > 127; // non-ASCII
  }

  function isWhitespace(c: string): boolean {
    const code = c.charCodeAt(0);
    return code === 32 || code === 9 || code === 10 || code === 13; // space, tab, LF, CR
  }

  /** Flush text content using slice, returns tokens instead of yielding */
  function flushTextTokens(): XmlToken[] {
    if (textStartIdx !== -1) {
      const content = textPartial + buffer.slice(textStartIdx, bufferIndex);
      textStartIdx = -1;
      textPartial = "";
      if (content.length > 0) {
        return [{
          type: "text",
          content,
          position: {
            line: textStartLine,
            column: textStartColumn,
            offset: textStartOffset,
          },
        }];
      }
    }
    return [];
  }

  /** Flush text and emit to batch */
  function flushText(): void {
    for (const token of flushTextTokens()) {
      emit(token);
    }
  }

  /** Get attribute value using slice */
  function getAttrValue(): string {
    const value = attrPartial + buffer.slice(attrStartIdx, bufferIndex);
    attrStartIdx = -1;
    attrPartial = "";
    return value;
  }

  /** Save partial content before buffer reset (for cross-chunk handling) */
  function savePartialsBeforeReset(): void {
    if (textStartIdx !== -1) {
      textPartial += buffer.slice(textStartIdx, bufferIndex);
      textStartIdx = 0; // Will continue from start of new buffer
    }
    if (cdataStartIdx !== -1) {
      cdataPartial += buffer.slice(cdataStartIdx, bufferIndex);
      cdataStartIdx = 0;
    }
    if (attrStartIdx !== -1) {
      attrPartial += buffer.slice(attrStartIdx, bufferIndex);
      attrStartIdx = 0;
    }
  }

  function advance(): void {
    if (buffer[bufferIndex] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
    offset++;
    bufferIndex++;
  }

  // Normalize line endings: \r\n and \r → \n
  function normalizeLineEndings(chunk: string): string {
    // Fast path: skip regex if no carriage returns (common case)
    return chunk.includes("\r") ? chunk.replace(LINE_ENDING_RE, "\n") : chunk;
  }

  // Batch tokens per chunk for reduced async overhead
  let tokenBatch: XmlToken[] = [];

  /** Push token to current batch instead of yielding directly */
  function emit(token: XmlToken): void {
    tokenBatch.push(token);
  }

  for await (const chunk of source) {
    // Save any partial content before resetting buffer
    savePartialsBeforeReset();
    // Reset buffer: keep unprocessed portion + new chunk
    buffer = buffer.slice(bufferIndex) + normalizeLineEndings(chunk);
    bufferIndex = 0;

    while (bufferIndex < buffer.length) {
      // SAFETY: bufferIndex < buffer.length is checked above
      const c = buffer[bufferIndex]!;

      switch (state) {
        case State.INITIAL: {
          if (c === "<") {
            flushText();
            saveTokenPosition();
            advance();
            state = State.TAG_OPEN;
          } else {
            // Track text start index for slice (instead of += per char)
            if (textStartIdx === -1) {
              textStartLine = line;
              textStartColumn = column;
              textStartOffset = offset;
              textStartIdx = bufferIndex;
            }
            advance();
          }
          break;
        }

        case State.TAG_OPEN: {
          if (c === "/") {
            advance();
            tagName = "";
            state = State.END_TAG_NAME;
          } else if (c === "!") {
            advance();
            state = State.MARKUP_DECLARATION;
          } else if (c === "?") {
            advance();
            piTarget = "";
            state = State.PI_TARGET;
          } else if (isNameStartChar(c)) {
            tagName = c;
            advance();
            state = State.TAG_NAME;
          } else {
            error(`Unexpected character '${c}' after '<'`);
          }
          break;
        }

        case State.TAG_NAME: {
          if (isNameChar(c)) {
            tagName += c;
            advance();
          } else if (isWhitespace(c)) {
            emit({
              type: "start_tag_open",
              name: tagName,
              position: getTokenPosition(),
            });
            advance();
            state = State.AFTER_TAG_NAME;
          } else if (c === ">") {
            emit({
              type: "start_tag_open",
              name: tagName,
              position: getTokenPosition(),
            });
            emit({ type: "start_tag_close", selfClosing: false });
            advance();
            state = State.INITIAL;
          } else if (c === "/") {
            emit({
              type: "start_tag_open",
              name: tagName,
              position: getTokenPosition(),
            });
            advance();
            state = State.EXPECT_SELF_CLOSE_GT;
          } else {
            error(`Unexpected character '${c}' in tag name`);
          }
          break;
        }

        case State.AFTER_TAG_NAME: {
          if (isWhitespace(c)) {
            advance();
          } else if (c === ">") {
            emit({ type: "start_tag_close", selfClosing: false });
            advance();
            state = State.INITIAL;
          } else if (c === "/") {
            advance();
            state = State.EXPECT_SELF_CLOSE_GT;
          } else if (isNameStartChar(c)) {
            attrName = c;
            advance();
            state = State.ATTRIBUTE_NAME;
          } else {
            error(`Unexpected character '${c}' after tag name`);
          }
          break;
        }

        case State.ATTRIBUTE_NAME: {
          if (isNameChar(c)) {
            attrName += c;
            advance();
          } else if (isWhitespace(c)) {
            advance();
            state = State.AFTER_ATTRIBUTE_NAME;
          } else if (c === "=") {
            advance();
            state = State.BEFORE_ATTRIBUTE_VALUE;
          } else {
            error(`Unexpected character '${c}' in attribute name`);
          }
          break;
        }

        case State.AFTER_ATTRIBUTE_NAME: {
          if (isWhitespace(c)) {
            advance();
          } else if (c === "=") {
            advance();
            state = State.BEFORE_ATTRIBUTE_VALUE;
          } else {
            error(`Expected '=' after attribute name`);
          }
          break;
        }

        case State.BEFORE_ATTRIBUTE_VALUE: {
          if (isWhitespace(c)) {
            advance();
          } else if (c === '"') {
            advance();
            attrStartIdx = bufferIndex; // Start tracking after quote
            attrPartial = "";
            state = State.ATTRIBUTE_VALUE_DOUBLE;
          } else if (c === "'") {
            advance();
            attrStartIdx = bufferIndex;
            attrPartial = "";
            state = State.ATTRIBUTE_VALUE_SINGLE;
          } else {
            error(`Expected quote to start attribute value`);
          }
          break;
        }

        case State.ATTRIBUTE_VALUE_DOUBLE: {
          if (c === '"') {
            emit({ type: "attribute", name: attrName, value: getAttrValue() });
            advance();
            state = State.AFTER_TAG_NAME;
          } else if (c === "<") {
            error(`'<' not allowed in attribute value`);
          } else {
            advance();
          }
          break;
        }

        case State.ATTRIBUTE_VALUE_SINGLE: {
          if (c === "'") {
            emit({ type: "attribute", name: attrName, value: getAttrValue() });
            advance();
            state = State.AFTER_TAG_NAME;
          } else if (c === "<") {
            error(`'<' not allowed in attribute value`);
          } else {
            advance();
          }
          break;
        }

        case State.END_TAG_NAME: {
          if (tagName === "" && isNameStartChar(c)) {
            tagName = c;
            advance();
          } else if (isNameChar(c)) {
            tagName += c;
            advance();
          } else if (isWhitespace(c)) {
            advance();
            state = State.AFTER_END_TAG_NAME;
          } else if (c === ">") {
            emit({
              type: "end_tag",
              name: tagName,
              position: getTokenPosition(),
            });
            advance();
            state = State.INITIAL;
          } else {
            error(`Unexpected character '${c}' in end tag`);
          }
          break;
        }

        case State.AFTER_END_TAG_NAME: {
          if (isWhitespace(c)) {
            advance();
          } else if (c === ">") {
            emit({
              type: "end_tag",
              name: tagName,
              position: getTokenPosition(),
            });
            advance();
            state = State.INITIAL;
          } else {
            error(`Unexpected character '${c}' in end tag`);
          }
          break;
        }

        case State.EXPECT_SELF_CLOSE_GT: {
          if (c === ">") {
            emit({ type: "start_tag_close", selfClosing: true });
            advance();
            state = State.INITIAL;
          } else {
            error(`Expected '>' after '/' in self-closing tag`);
          }
          break;
        }

        case State.MARKUP_DECLARATION: {
          if (c === "-") {
            advance();
            state = State.COMMENT_START;
          } else if (c === "[") {
            advance();
            cdataCheck = "";
            state = State.CDATA_START;
          } else if (c === "D") {
            // Likely DOCTYPE
            doctypeCheck = "D";
            advance();
            state = State.DOCTYPE_START;
          } else {
            error(`Unsupported markup declaration`);
          }
          break;
        }

        case State.DOCTYPE_START: {
          doctypeCheck += c;
          advance();
          if (doctypeCheck === "DOCTYPE") {
            doctypeName = "";
            doctypePublicId = "";
            doctypeSystemId = "";
            state = State.DOCTYPE_NAME;
          } else if (!"DOCTYPE".startsWith(doctypeCheck)) {
            error(`Expected DOCTYPE, got <!${doctypeCheck}`);
          }
          break;
        }

        case State.DOCTYPE_NAME: {
          if (isWhitespace(c)) {
            if (doctypeName === "") {
              // Skip leading whitespace after DOCTYPE
              advance();
            } else {
              advance();
              state = State.DOCTYPE_AFTER_NAME;
            }
          } else if (c === ">") {
            emit({
              type: "doctype",
              name: doctypeName,
              position: getTokenPosition(),
            });
            advance();
            state = State.INITIAL;
          } else if (c === "[") {
            advance();
            doctypeBracketDepth = 1;
            state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (
            isNameChar(c) || (doctypeName === "" && isNameStartChar(c))
          ) {
            doctypeName += c;
            advance();
          } else {
            error(`Unexpected character '${c}' in DOCTYPE name`);
          }
          break;
        }

        case State.DOCTYPE_AFTER_NAME: {
          if (isWhitespace(c)) {
            advance();
          } else if (c === ">") {
            emit({
              type: "doctype",
              name: doctypeName,
              ...(doctypePublicId && { publicId: doctypePublicId }),
              ...(doctypeSystemId && { systemId: doctypeSystemId }),
              position: getTokenPosition(),
            });
            advance();
            state = State.INITIAL;
          } else if (c === "[") {
            advance();
            doctypeBracketDepth = 1;
            state = State.DOCTYPE_INTERNAL_SUBSET;
          } else if (c === "P") {
            doctypeCheck = "P";
            advance();
            state = State.DOCTYPE_PUBLIC;
          } else if (c === "S") {
            doctypeCheck = "S";
            advance();
            state = State.DOCTYPE_SYSTEM;
          } else {
            error(`Unexpected character '${c}' in DOCTYPE`);
          }
          break;
        }

        case State.DOCTYPE_PUBLIC: {
          doctypeCheck += c;
          advance();
          if (doctypeCheck === "PUBLIC") {
            state = State.DOCTYPE_PUBLIC_ID;
          } else if (!"PUBLIC".startsWith(doctypeCheck)) {
            error(`Expected PUBLIC, got ${doctypeCheck}`);
          }
          break;
        }

        case State.DOCTYPE_PUBLIC_ID: {
          if (isWhitespace(c)) {
            advance();
          } else if (c === '"' || c === "'") {
            doctypeQuoteChar = c;
            doctypePublicId = "";
            advance();
            // Read until closing quote
            while (
              bufferIndex < buffer.length &&
              buffer[bufferIndex] !== doctypeQuoteChar
            ) {
              doctypePublicId += buffer[bufferIndex];
              advance();
            }
            if (bufferIndex >= buffer.length) {
              // Need more data
              continue;
            }
            advance(); // closing quote
            state = State.DOCTYPE_AFTER_PUBLIC_ID;
          } else {
            error(`Expected quote to start public ID`);
          }
          break;
        }

        case State.DOCTYPE_AFTER_PUBLIC_ID: {
          if (isWhitespace(c)) {
            advance();
          } else if (c === '"' || c === "'") {
            doctypeQuoteChar = c;
            doctypeSystemId = "";
            advance();
            // Read until closing quote
            while (
              bufferIndex < buffer.length &&
              buffer[bufferIndex] !== doctypeQuoteChar
            ) {
              doctypeSystemId += buffer[bufferIndex];
              advance();
            }
            if (bufferIndex >= buffer.length) {
              continue;
            }
            advance(); // closing quote
            state = State.DOCTYPE_AFTER_NAME;
          } else if (c === ">") {
            // PUBLIC without system ID (unusual but possible)
            emit({
              type: "doctype",
              name: doctypeName,
              publicId: doctypePublicId,
              position: getTokenPosition(),
            });
            advance();
            state = State.INITIAL;
          } else {
            error(`Expected system ID or '>' after public ID`);
          }
          break;
        }

        case State.DOCTYPE_SYSTEM: {
          doctypeCheck += c;
          advance();
          if (doctypeCheck === "SYSTEM") {
            state = State.DOCTYPE_SYSTEM_ID;
          } else if (!"SYSTEM".startsWith(doctypeCheck)) {
            error(`Expected SYSTEM, got ${doctypeCheck}`);
          }
          break;
        }

        case State.DOCTYPE_SYSTEM_ID: {
          if (isWhitespace(c)) {
            advance();
          } else if (c === '"' || c === "'") {
            doctypeQuoteChar = c;
            doctypeSystemId = "";
            advance();
            // Read until closing quote
            while (
              bufferIndex < buffer.length &&
              buffer[bufferIndex] !== doctypeQuoteChar
            ) {
              doctypeSystemId += buffer[bufferIndex];
              advance();
            }
            if (bufferIndex >= buffer.length) {
              continue;
            }
            advance(); // closing quote
            state = State.DOCTYPE_AFTER_NAME;
          } else {
            error(`Expected quote to start system ID`);
          }
          break;
        }

        case State.DOCTYPE_INTERNAL_SUBSET: {
          // Skip internal subset content, tracking bracket depth
          if (c === "]") {
            doctypeBracketDepth--;
            advance();
            if (doctypeBracketDepth === 0) {
              state = State.DOCTYPE_AFTER_NAME;
            }
          } else if (c === "[") {
            doctypeBracketDepth++;
            advance();
          } else if (c === '"' || c === "'") {
            // Skip quoted strings (may contain brackets)
            doctypeQuoteChar = c;
            advance();
            state = State.DOCTYPE_INTERNAL_SUBSET_STRING;
          } else {
            advance();
          }
          break;
        }

        case State.DOCTYPE_INTERNAL_SUBSET_STRING: {
          if (c === doctypeQuoteChar) {
            advance();
            state = State.DOCTYPE_INTERNAL_SUBSET;
          } else {
            advance();
          }
          break;
        }

        case State.COMMENT_START: {
          if (c === "-") {
            advance();
            commentContent = "";
            state = State.COMMENT;
          } else {
            error(`Expected '-' to start comment`);
          }
          break;
        }

        case State.COMMENT: {
          // Per XML 1.0 §2.5, comments use the grammar:
          //   Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
          // This means '--' MUST NOT appear inside comments.
          // We use sub-states to handle chunk boundaries correctly.
          if (c === "-") {
            advance();
            state = State.COMMENT_DASH;
          } else {
            commentContent += c;
            advance();
          }
          break;
        }

        case State.COMMENT_DASH: {
          // We've seen one '-' in comment content
          if (c === "-") {
            // Now we've seen '--', expecting '>' or spec violation
            advance();
            state = State.COMMENT_DASH_DASH;
          } else {
            // Single dash is valid content, add it and continue
            commentContent += "-";
            commentContent += c;
            advance();
            state = State.COMMENT;
          }
          break;
        }

        case State.COMMENT_DASH_DASH: {
          // We've seen '--', expecting '>'
          if (c === ">") {
            // Valid comment end
            emit({
              type: "comment",
              content: commentContent,
              position: getTokenPosition(),
            });
            advance();
            state = State.INITIAL;
          } else if (c === "-") {
            // "---..." case: first '--' violates spec, but we're lenient
            // Treat the first dash as content, stay in COMMENT_DASH_DASH
            // (we still have '--' pending from the second and third dashes)
            commentContent += "-";
            advance();
            // state stays COMMENT_DASH_DASH
          } else {
            // '--' followed by non-'>': spec violation (lenient mode)
            // Per XML 1.0 §2.5: '--' MUST NOT occur within comments
            // We include it in content for error recovery
            commentContent += "--";
            commentContent += c;
            advance();
            state = State.COMMENT;
          }
          break;
        }

        case State.CDATA_START: {
          cdataCheck += c;
          advance();
          if (cdataCheck === "CDATA[") {
            cdataStartIdx = bufferIndex; // Start tracking after CDATA[
            cdataPartial = "";
            state = State.CDATA;
          } else if (!"CDATA[".startsWith(cdataCheck)) {
            error(`Expected 'CDATA[' after '<![`);
          }
          break;
        }

        case State.CDATA: {
          // Use sub-states to handle ]]> across chunk boundaries
          if (c === "]") {
            // Save content up to this point (excluding the ])
            cdataPartial += buffer.slice(cdataStartIdx, bufferIndex);
            advance();
            cdataStartIdx = bufferIndex; // Reset start for potential continuation
            state = State.CDATA_BRACKET;
          } else {
            advance();
          }
          break;
        }

        case State.CDATA_BRACKET: {
          // We've seen one ] in CDATA content
          if (c === "]") {
            advance();
            cdataStartIdx = bufferIndex;
            state = State.CDATA_BRACKET_BRACKET;
          } else {
            // Single ] is valid content, add it back
            cdataPartial += "]";
            // cdataStartIdx already points to current position
            advance();
            state = State.CDATA;
          }
          break;
        }

        case State.CDATA_BRACKET_BRACKET: {
          // We've seen ]], expecting > or more content
          if (c === ">") {
            // Emit CDATA with content (]] is NOT included)
            emit({
              type: "cdata",
              content: cdataPartial,
              position: getTokenPosition(),
            });
            cdataStartIdx = -1;
            cdataPartial = "";
            advance();
            state = State.INITIAL;
          } else if (c === "]") {
            // "...]]]..." - first ] is content, still have ]] pending
            cdataPartial += "]";
            advance();
            cdataStartIdx = bufferIndex;
            // state stays CDATA_BRACKET_BRACKET, pendingBrackets stays 2
          } else {
            // ]] followed by non->, ]] is content, continue
            cdataPartial += "]]";
            // cdataStartIdx already at current position
            advance();
            state = State.CDATA;
          }
          break;
        }

        case State.PI_TARGET: {
          if (isNameChar(c)) {
            piTarget += c;
            advance();
          } else if (isWhitespace(c)) {
            advance();
            piContent = "";
            state = State.PI_CONTENT;
          } else if (c === "?") {
            // Possible end of PI with empty content, use sub-state for chunk safety
            advance();
            state = State.PI_TARGET_QUESTION;
          } else {
            error(
              `Unexpected character '${c}' in processing instruction target`,
            );
          }
          break;
        }

        case State.PI_TARGET_QUESTION: {
          // We've seen ? after PI target (no whitespace), expecting >
          if (c === ">") {
            // Empty PI content
            if (piTarget.toLowerCase() === "xml") {
              emit(createDeclaration("", getTokenPosition()));
            } else {
              emit({
                type: "processing_instruction",
                target: piTarget,
                content: "",
                position: getTokenPosition(),
              });
            }
            advance();
            state = State.INITIAL;
          } else {
            error(
              `Expected '>' after '?' in processing instruction, got '${c}'`,
            );
          }
          break;
        }

        case State.PI_CONTENT: {
          // Use sub-state to handle ?> across chunk boundaries
          if (c === "?") {
            advance();
            state = State.PI_QUESTION;
          } else {
            piContent += c;
            advance();
          }
          break;
        }

        case State.PI_QUESTION: {
          // We've seen ? in PI content, check for >
          if (c === ">") {
            if (piTarget.toLowerCase() === "xml") {
              emit(createDeclaration(piContent, getTokenPosition()));
            } else {
              emit({
                type: "processing_instruction",
                target: piTarget,
                content: piContent.trim(),
                position: getTokenPosition(),
              });
            }
            advance();
            state = State.INITIAL;
          } else if (c === "?") {
            // "??" - first ? is content, stay waiting for >
            piContent += "?";
            advance();
            // state stays PI_QUESTION
          } else {
            // ? followed by non->, add to content
            piContent += "?";
            piContent += c;
            advance();
            state = State.PI_CONTENT;
          }
          break;
        }
      }
    }

    // Yield batch at end of each chunk (reduces async overhead 3000x)
    if (tokenBatch.length > 0) {
      yield tokenBatch;
      tokenBatch = [];
    }
  }

  // Flush remaining text and yield final batch
  for (const token of flushTextTokens()) {
    emit(token);
  }
  if (tokenBatch.length > 0) {
    yield tokenBatch;
  }

  // Check for incomplete state
  if (state !== State.INITIAL) {
    error(`Unexpected end of input`);
  }
}

/**
 * Create XML declaration token.
 *
 * Uses alternation in regex to enforce matching quotes (single or double).
 * Per XML 1.0 spec, `version='1.0"` (mismatched quotes) is invalid.
 */
function createDeclaration(
  content: string,
  position: TokenPosition,
): XmlToken {
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
