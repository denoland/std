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
 * Transforms raw XML tokens into high-level XML events.
 *
 * This generator function:
 * - Aggregates start_tag_open, attribute, and start_tag_close tokens into
 *   a single XmlStartElementEvent
 * - Extracts namespace prefixes from element and attribute names
 * - Decodes XML entities in text and attribute values
 * - Optionally filters whitespace-only text, comments, and PIs
 * - Validates well-formedness (matching open/close tags)
 *
 * @param tokenBatches An async iterable of XmlToken arrays from the tokenizer.
 * @param options Options for filtering and behavior.
 * @yields Arrays of XmlEvent objects, batched for reduced async overhead.
 * @throws XmlSyntaxError on well-formedness errors
 */
export async function* parseTokensToEvents(
  tokenBatches: AsyncIterable<XmlToken[]>,
  options: ParseStreamOptions = {},
): AsyncGenerator<XmlEvent[]> {
  const {
    ignoreWhitespace = false,
    ignoreComments = false,
    ignoreProcessingInstructions = false,
    coerceCDataToText = false,
  } = options;

  // Stack of open elements for well-formedness validation
  const elementStack: Array<
    { name: string; line: number; column: number; offset: number }
  > = [];

  // Accumulator for building start element events
  let pendingStartElement: {
    name: string;
    attributes: XmlAttribute[];
    line: number;
    column: number;
    offset: number;
  } | null = null;

  // Event batch for current token batch
  let eventBatch: XmlEvent[] = [];

  /** Push event to current batch */
  function emit(event: XmlEvent): void {
    eventBatch.push(event);
  }

  for await (const tokenBatch of tokenBatches) {
    // Process all tokens in this batch synchronously
    for (const token of tokenBatch) {
      switch (token.type) {
        case "declaration": {
          emit(
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
          pendingStartElement = {
            name: token.name,
            attributes: [],
            line: token.position.line,
            column: token.position.column,
            offset: token.position.offset,
          };
          break;
        }

        case "attribute": {
          if (pendingStartElement) {
            pendingStartElement.attributes.push({
              name: parseName(token.name),
              value: normalizeAttributeValue(token.value),
            });
          }
          break;
        }

        case "start_tag_close": {
          if (pendingStartElement) {
            const name = parseName(pendingStartElement.name);
            const { line, column, offset } = pendingStartElement;

            emit(
              {
                type: "start_element",
                name,
                attributes: pendingStartElement.attributes,
                selfClosing: token.selfClosing,
                line,
                column,
                offset,
              } satisfies XmlStartElementEvent,
            );

            if (token.selfClosing) {
              emit(
                {
                  type: "end_element",
                  name,
                  line,
                  column,
                  offset,
                } satisfies XmlEndElementEvent,
              );
            } else {
              elementStack.push({
                name: pendingStartElement.name,
                line,
                column,
                offset,
              });
            }

            pendingStartElement = null;
          }
          break;
        }

        case "end_tag": {
          const expected = elementStack.pop();
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

          emit(
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

          emit(
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
            emit(
              {
                type: "text",
                text: token.content,
                line: token.position.line,
                column: token.position.column,
                offset: token.position.offset,
              } satisfies XmlTextEvent,
            );
          } else {
            emit(
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

          emit(
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

          emit(
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

    // Yield event batch at end of each token batch (chunk-aligned)
    if (eventBatch.length > 0) {
      yield eventBatch;
      eventBatch = [];
    }
  }

  // Check for unclosed elements at end of input
  if (elementStack.length > 0) {
    const unclosed = elementStack[elementStack.length - 1]!;
    throw new XmlSyntaxError(
      `Unclosed element <${unclosed.name}>`,
      unclosed,
    );
  }
}
