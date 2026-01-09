// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal XML parser module.
 *
 * Transforms raw tokens from the tokenizer into high-level XmlEvent objects,
 * handling namespace prefixes, entity decoding, and well-formedness validation.
 *
 * @module
 */

import type {
  ParseStreamOptions,
  XmlAttribute,
  XmlCDataEvent,
  XmlCommentEvent,
  XmlDeclarationEvent,
  XmlEndElementEvent,
  XmlEvent,
  XmlProcessingInstructionEvent,
  XmlStartElementEvent,
  XmlTextEvent,
} from "./types.ts";
import { XmlSyntaxError } from "./types.ts";
import type { XmlToken } from "./_tokenizer.ts";
import { decodeEntities } from "./_entities.ts";
import { parseName, WHITESPACE_ONLY_RE } from "./_common.ts";

/**
 * Normalizes attribute value per XML 1.0 §3.3.3.
 *
 * Per the specification:
 * - Literal whitespace (#x9, #xA) is replaced with space (#x20)
 * - Character references to whitespace (&#9;, &#10;, etc.) are preserved
 *
 * Note: #xD (carriage return) has been converted to #xA by line-ending
 * normalization in the tokenizer (§2.11), so we only need to handle #xA and #x9.
 *
 * @see {@link https://www.w3.org/TR/xml/#AVNormalize | XML 1.0 §3.3.3 Attribute-Value Normalization}
 *
 * @param raw The raw attribute value from the tokenizer.
 * @returns The normalized and entity-decoded attribute value.
 */
function normalizeAttributeValue(raw: string): string {
  // Step 1: Replace literal whitespace with space per §3.3.3
  // This is done BEFORE entity decoding to preserve char refs like &#10;
  const normalized = raw.replace(/[\t\n]/g, " ");

  // Step 2: Decode entities (&#10; becomes actual \n, preserving char refs)
  return decodeEntities(normalized);
}

/**
 * Stateful XML Event Parser.
 *
 * Transforms raw XML tokens into high-level events. Handles element stacking,
 * well-formedness validation, and optional filtering of whitespace/comments.
 *
 * @example Basic usage
 * ```ts ignore
 * const parser = new XmlEventParser({ ignoreWhitespace: true });
 * const events1 = parser.process(tokens1);
 * const events2 = parser.process(tokens2);
 * parser.finalize(); // throws if unclosed elements
 * ```
 */
export class XmlEventParser {
  #elementStack: Array<
    { name: string; line: number; column: number; offset: number }
  > = [];
  #pendingStartElement: {
    name: string;
    attributes: XmlAttribute[];
    line: number;
    column: number;
    offset: number;
  } | null = null;
  #options: ParseStreamOptions;

  /**
   * Constructs a new XmlEventParser.
   *
   * @param options Options for filtering and behavior.
   */
  constructor(options: ParseStreamOptions = {}) {
    this.#options = options;
  }

  /**
   * Process tokens synchronously and return events.
   *
   * @param tokens Array of tokens from the tokenizer.
   * @returns Array of events extracted from the tokens.
   */
  process(tokens: XmlToken[]): XmlEvent[] {
    const {
      ignoreWhitespace = false,
      ignoreComments = false,
      ignoreProcessingInstructions = false,
      coerceCDataToText = false,
    } = this.#options;

    const events: XmlEvent[] = [];

    for (const token of tokens) {
      switch (token.type) {
        case "declaration": {
          events.push(
            {
              type: "declaration",
              version: token.version,
              line: token.position.line,
              column: token.position.column,
              offset: token.position.offset,
              ...(token.encoding !== undefined
                ? { encoding: token.encoding }
                : {}),
              ...(token.standalone !== undefined
                ? { standalone: token.standalone }
                : {}),
            } satisfies XmlDeclarationEvent,
          );
          break;
        }

        case "doctype": {
          // DOCTYPE is parsed by tokenizer but not emitted as an event
          break;
        }

        case "start_tag_open": {
          this.#pendingStartElement = {
            name: token.name,
            attributes: [],
            line: token.position.line,
            column: token.position.column,
            offset: token.position.offset,
          };
          break;
        }

        case "attribute": {
          if (this.#pendingStartElement) {
            this.#pendingStartElement.attributes.push({
              name: parseName(token.name),
              value: normalizeAttributeValue(token.value),
            });
          }
          break;
        }

        case "start_tag_close": {
          if (this.#pendingStartElement) {
            const name = parseName(this.#pendingStartElement.name);
            const { line, column, offset } = this.#pendingStartElement;

            events.push(
              {
                type: "start_element",
                name,
                attributes: this.#pendingStartElement.attributes,
                selfClosing: token.selfClosing,
                line,
                column,
                offset,
              } satisfies XmlStartElementEvent,
            );

            if (token.selfClosing) {
              events.push(
                {
                  type: "end_element",
                  name,
                  line,
                  column,
                  offset,
                } satisfies XmlEndElementEvent,
              );
            } else {
              this.#elementStack.push({
                name: this.#pendingStartElement.name,
                line,
                column,
                offset,
              });
            }

            this.#pendingStartElement = null;
          }
          break;
        }

        case "end_tag": {
          const expected = this.#elementStack.pop();
          if (expected === undefined) {
            throw new XmlSyntaxError(
              `Unexpected closing tag </${token.name}> with no matching opening tag`,
              token.position,
            );
          }
          if (expected.name !== token.name) {
            throw new XmlSyntaxError(
              `Mismatched closing tag: expected </${expected.name}> but found </${token.name}>`,
              token.position,
            );
          }

          events.push(
            {
              type: "end_element",
              name: parseName(token.name),
              line: token.position.line,
              column: token.position.column,
              offset: token.position.offset,
            } satisfies XmlEndElementEvent,
          );
          break;
        }

        case "text": {
          const text = decodeEntities(token.content);

          if (ignoreWhitespace && WHITESPACE_ONLY_RE.test(text)) {
            break;
          }

          events.push(
            {
              type: "text",
              text,
              line: token.position.line,
              column: token.position.column,
              offset: token.position.offset,
            } satisfies XmlTextEvent,
          );
          break;
        }

        case "cdata": {
          if (coerceCDataToText) {
            events.push(
              {
                type: "text",
                text: token.content,
                line: token.position.line,
                column: token.position.column,
                offset: token.position.offset,
              } satisfies XmlTextEvent,
            );
          } else {
            events.push(
              {
                type: "cdata",
                text: token.content,
                line: token.position.line,
                column: token.position.column,
                offset: token.position.offset,
              } satisfies XmlCDataEvent,
            );
          }
          break;
        }

        case "comment": {
          if (ignoreComments) {
            break;
          }

          events.push(
            {
              type: "comment",
              text: token.content,
              line: token.position.line,
              column: token.position.column,
              offset: token.position.offset,
            } satisfies XmlCommentEvent,
          );
          break;
        }

        case "processing_instruction": {
          if (ignoreProcessingInstructions) {
            break;
          }

          events.push(
            {
              type: "processing_instruction",
              target: token.target,
              content: token.content,
              line: token.position.line,
              column: token.position.column,
              offset: token.position.offset,
            } satisfies XmlProcessingInstructionEvent,
          );
          break;
        }
      }
    }

    return events;
  }

  /**
   * Finalize parsing and validate that all elements are closed.
   *
   * @throws {XmlSyntaxError} If there are unclosed elements.
   */
  finalize(): void {
    if (this.#elementStack.length > 0) {
      const unclosed = this.#elementStack[this.#elementStack.length - 1]!;
      throw new XmlSyntaxError(`Unclosed element <${unclosed.name}>`, unclosed);
    }
  }
}

/**
 * Legacy async generator interface for backwards compatibility.
 *
 * @deprecated Use {@linkcode XmlEventParser} class directly for better performance.
 * @param tokenBatches An async iterable of XmlToken arrays from the tokenizer.
 * @param options Options for filtering and behavior.
 * @yields Arrays of XmlEvent objects, batched for reduced async overhead.
 * @throws XmlSyntaxError on well-formedness errors
 */
export async function* parseTokensToEvents(
  tokenBatches: AsyncIterable<XmlToken[]>,
  options: ParseStreamOptions = {},
): AsyncGenerator<XmlEvent[]> {
  const parser = new XmlEventParser(options);

  for await (const tokenBatch of tokenBatches) {
    const events = parser.process(tokenBatch);
    if (events.length > 0) {
      yield events;
    }
  }

  parser.finalize();
}
