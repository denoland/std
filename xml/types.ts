// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Type definitions for the XML parser and serializer.
 *
 * @module
 */

/**
 * Position information for error reporting.
 */
export interface XmlPosition {
  /** Line number (1-indexed). */
  readonly line: number;
  /** Column number (1-indexed). */
  readonly column: number;
  /** Character offset in the input string (in UTF-16 code units, 0-indexed). */
  readonly offset: number;
}

/**
 * Error thrown when XML parsing fails.
 *
 * @example Usage
 * ```ts
 * import { XmlSyntaxError } from "@std/xml/types";
 * import { assertInstanceOf } from "@std/assert";
 *
 * const error = new XmlSyntaxError("Unexpected character", { line: 10, column: 5, offset: 150 });
 * assertInstanceOf(error, SyntaxError);
 * ```
 */
export class XmlSyntaxError extends SyntaxError {
  /**
   * The line number where the error occurred (1-indexed), or `0` when
   * position tracking is disabled.
   *
   * @example Usage
   * ```ts
   * import { XmlSyntaxError } from "@std/xml/types";
   * import { assertEquals } from "@std/assert";
   *
   * const error = new XmlSyntaxError("Test", { line: 5, column: 10, offset: 50 });
   * assertEquals(error.line, 5);
   * ```
   */
  readonly line: number;
  /**
   * The column number where the error occurred (1-indexed), or `0` when
   * position tracking is disabled.
   *
   * @example Usage
   * ```ts
   * import { XmlSyntaxError } from "@std/xml/types";
   * import { assertEquals } from "@std/assert";
   *
   * const error = new XmlSyntaxError("Test", { line: 5, column: 10, offset: 50 });
   * assertEquals(error.column, 10);
   * ```
   */
  readonly column: number;
  /**
   * The character offset in the input string where the error occurred
   * (in UTF-16 code units, 0-indexed).
   *
   * @example Usage
   * ```ts
   * import { XmlSyntaxError } from "@std/xml/types";
   * import { assertEquals } from "@std/assert";
   *
   * const error = new XmlSyntaxError("Test", { line: 5, column: 10, offset: 50 });
   * assertEquals(error.offset, 50);
   * ```
   */
  readonly offset: number;

  /**
   * Constructs a new XmlSyntaxError.
   *
   * The position is appended to the message, unless `position.line` is `0`
   * (the sentinel used when position tracking is disabled).
   *
   * @param message The error message describing the syntax issue.
   * @param position The position in the XML source where the error occurred.
   */
  constructor(message: string, position: XmlPosition) {
    super(
      position.line === 0
        ? message
        : `${message} at line ${position.line}, column ${position.column}`,
    );
    this.name = "XmlSyntaxError";
    this.line = position.line;
    this.column = position.column;
    this.offset = position.offset;
  }
}

/**
 * A qualified XML name with optional namespace prefix and resolved URI.
 */
export interface XmlName {
  /** The original unsplit name (e.g., "ns:item" or "item"). */
  readonly raw: string;
  /** The local part of the name (after the colon, or the whole name). */
  readonly local: string;
  /** The namespace prefix (before the colon), if present. */
  readonly prefix?: string;
  /**
   * The resolved namespace URI, if the name has a bound prefix.
   *
   * For prefixed names (e.g., "ns:item"), this is the URI that the prefix
   * is bound to via an `xmlns:ns="..."` declaration.
   *
   * For unprefixed names, this is undefined (the default namespace is not
   * applied to element names in this implementation for simplicity).
   */
  readonly uri?: string;
}

/**
 * The XML declaration of a document, exposed as
 * {@linkcode XmlDocument.declaration}.
 *
 * @see {@link https://www.w3.org/TR/xml/#sec-prolog-dtd | XML 1.0 §2.8 Prolog}
 */
export interface XmlDeclaration extends XmlPosition {
  /** The type discriminant. */
  readonly type: "declaration";
  /** The XML version as declared in the document (e.g. `"1.0"` or `"1.1"`). */
  readonly version: string;
  /** The declared character encoding, if specified. */
  readonly encoding?: string;
  /** Whether the document is standalone (§2.9). */
  readonly standalone?: "yes" | "no";
}

/**
 * Base options shared by parsing functions.
 */
export interface BaseParseOptions {
  /**
   * If true, text nodes containing only whitespace are not emitted/included.
   *
   * @default {false}
   */
  readonly ignoreWhitespace?: boolean;

  /**
   * If true, comments are not emitted/included.
   *
   * @default {false}
   */
  readonly ignoreComments?: boolean;

  /**
   * If true, track line/column positions for events and error messages.
   * Disabling improves performance but makes debugging harder.
   */
  readonly trackPosition?: boolean;

  /**
   * If true, DOCTYPE declarations are rejected immediately with an
   * {@linkcode XmlSyntaxError}, before any internal subset is parsed.
   * This prevents resource exhaustion attacks via hostile DTD content.
   *
   * Set to `false` to tolerate DOCTYPE declarations in trusted input (e.g.
   * legacy XHTML or RSS feeds). DTD contents are still not processed: custom
   * entity declarations are ignored, and external DTDs are never fetched.
   *
   * @default {true}
   */
  readonly disallowDoctype?: boolean;

  /**
   * Maximum element nesting depth. Exceeding this throws
   * {@linkcode XmlSyntaxError}. Prevents stack exhaustion from
   * deeply nested documents.
   *
   * @default {Infinity}
   */
  readonly maxDepth?: number;

  /**
   * Maximum number of attributes per element. Exceeding this throws
   * {@linkcode XmlSyntaxError}. Prevents memory exhaustion from
   * elements with huge attribute lists.
   *
   * @default {Infinity}
   */
  readonly maxAttributes?: number;

  /**
   * XML version to use for character and line-ending validation.
   *
   * When `"1.1"`, the parser applies XML 1.1 rules:
   * - Character references to C0 controls (`&#x1;`–`&#x1F;` except `&#x0;`)
   *   are accepted
   * - Literal C1 controls (`#x7F`–`#x9F` except `#x85`) are rejected
   * - NEL (`#x85`) and Unicode line separator (`#x2028`) are normalized to LF
   * - Namespace prefix unbinding (`xmlns:prefix=""`) is allowed
   *
   * This option is independent of the `<?xml version="...">` declaration
   * in the document. Set it explicitly to handle documents that declare
   * `version="1.0"` but contain XML 1.1-style character references.
   *
   * @default {"1.0"}
   */
  readonly xmlVersion?: "1.0" | "1.1";
}

/**
 * Options for {@linkcode parseXmlStream}.
 */
export interface ParseStreamOptions extends BaseParseOptions {
  /**
   * If true, processing instruction events are not emitted.
   *
   * @default {false}
   */
  readonly ignoreProcessingInstructions?: boolean;

  /**
   * If true, CDATA sections are emitted as regular text events.
   *
   * @default {false}
   */
  readonly coerceCDataToText?: boolean;
}

/**
 * Options for {@linkcode parse}.
 */
export interface ParseOptions extends BaseParseOptions {}

/**
 * Options for {@linkcode stringify}.
 */
export interface StringifyOptions {
  /**
   * Indentation string for pretty-printing (e.g., "  " or "\t").
   * When undefined, output is compact with no extra whitespace.
   *
   * @default {undefined}
   */
  readonly indent?: string;

  /**
   * If true, include the XML declaration when stringifying a document.
   * Only applies when the input is an XmlDocument with a declaration.
   *
   * @default {true}
   */
  readonly declaration?: boolean;
}

// ============================================================================
// Node Types (for DOM-style tree)
// ============================================================================

/**
 * A text node in the XML tree.
 */
export interface XmlTextNode {
  /** The node type discriminant. */
  readonly type: "text";
  /** The decoded text content. */
  readonly text: string;
}

/**
 * A CDATA section node in the XML tree.
 */
export interface XmlCDataNode {
  /** The node type discriminant. */
  readonly type: "cdata";
  /** The raw CDATA content. */
  readonly text: string;
}

/**
 * A comment node in the XML tree.
 */
export interface XmlCommentNode {
  /** The node type discriminant. */
  readonly type: "comment";
  /** The comment text. */
  readonly text: string;
}

/**
 * An element node in the XML tree.
 */
export interface XmlElement {
  /** The node type discriminant. */
  readonly type: "element";
  /** The qualified name of the element. */
  readonly name: XmlName;
  /**
   * Attribute values keyed by the raw qualified attribute name as written in
   * the document, including any namespace prefix (e.g. `"id"`, `"xlink:href"`,
   * `"xmlns"`, `"xmlns:ns"`).
   */
  readonly attributes: Readonly<Record<string, string>>;
  /** The child nodes of this element. */
  readonly children: ReadonlyArray<XmlNode>;
}

/**
 * Discriminated union of all node types in an XML tree.
 */
export type XmlNode =
  | XmlElement
  | XmlTextNode
  | XmlCDataNode
  | XmlCommentNode;

/**
 * A parsed XML document.
 */
export interface XmlDocument {
  /** The XML declaration, if present. */
  readonly declaration?: XmlDeclaration;
  /** The root element of the document. */
  readonly root: XmlElement;
}

// ============================================================================
// Callback Interfaces (for zero-allocation streaming)
// ============================================================================

/** Callback for XML declarations. */
export type XmlDeclarationCallback = (
  version: string,
  encoding: string | undefined,
  standalone: "yes" | "no" | undefined,
  line: number,
  column: number,
  offset: number,
) => void;

/** Callback for DOCTYPE declarations. */
export type XmlDoctypeCallback = (
  name: string,
  publicId: string | undefined,
  systemId: string | undefined,
  line: number,
  column: number,
  offset: number,
) => void;

/** Callback for text, CDATA, or comment content with position. */
export type XmlContentCallback = (
  content: string,
  line: number,
  column: number,
  offset: number,
) => void;

/** Callback for processing instructions. */
export type XmlProcessingInstructionCallback = (
  target: string,
  content: string,
  line: number,
  column: number,
  offset: number,
) => void;

/**
 * Reusable attribute accessor that avoids allocating attribute object arrays.
 *
 * Instead of creating an array of attribute objects, attributes are accessed
 * by index through this interface. The implementation reuses internal arrays
 * across elements.
 */
export interface XmlAttributeIterator {
  /** The number of attributes. */
  readonly count: number;

  /** Get the raw attribute name at the given index. */
  getName(index: number): string;

  /** Get the decoded attribute value at the given index. */
  getValue(index: number): string;

  /**
   * Get the colon index in the attribute name (-1 if no namespace prefix).
   * This allows consumers to parse namespace prefixes without string allocation.
   */
  getColonIndex(index: number): number;

  /**
   * Get the resolved namespace URI for the attribute at the given index.
   * Returns undefined if the attribute has no namespace prefix or the prefix
   * is not bound (xmlns: attributes always return undefined as they declare
   * rather than use namespaces).
   */
  getUri(index: number): string | undefined;
}

/**
 * Callbacks for event-level output - enables zero-allocation event emission.
 *
 * The parser invokes these callbacks instead of creating event objects.
 */
export interface XmlEventCallbacks {
  /** Called for XML declarations. */
  onDeclaration?: XmlDeclarationCallback;

  /**
   * Called for DOCTYPE declarations.
   *
   * Only invoked when the {@linkcode BaseParseOptions.disallowDoctype}
   * option is set to `false`; with the default (`true`), a DOCTYPE
   * declaration throws an {@linkcode XmlSyntaxError} instead.
   */
  onDoctype?: XmlDoctypeCallback;

  /**
   * Called when an element starts.
   * @param colonIndex Index of ':' in name, or -1 if no prefix.
   * @param uri The resolved namespace URI if the element has a bound prefix, undefined otherwise.
   */
  onStartElement?(
    name: string,
    colonIndex: number,
    uri: string | undefined,
    attributes: XmlAttributeIterator,
    selfClosing: boolean,
    line: number,
    column: number,
    offset: number,
  ): void;

  /**
   * Called when an element ends.
   * @param colonIndex Index of ':' in name, or -1 if no prefix.
   * @param uri The resolved namespace URI if the element has a bound prefix, undefined otherwise.
   */
  onEndElement?(
    name: string,
    colonIndex: number,
    uri: string | undefined,
    line: number,
    column: number,
    offset: number,
  ): void;

  /** Called for text content (entity-decoded). */
  onText?: XmlContentCallback;

  /** Called for CDATA sections. */
  onCData?: XmlContentCallback;

  /** Called for comments. */
  onComment?: XmlContentCallback;

  /** Called for processing instructions. */
  onProcessingInstruction?: XmlProcessingInstructionCallback;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a node is an element.
 *
 * @example Usage
 * ```ts
 * import { isElement } from "@std/xml/types";
 * import { assertEquals } from "@std/assert";
 *
 * const node = { type: "element" as const, name: { raw: "item", local: "item" }, attributes: {}, children: [] };
 * assertEquals(isElement(node), true);
 * ```
 *
 * @param node The XML node to check.
 * @returns `true` if the node is an element, `false` otherwise.
 */
export function isElement(node: XmlNode): node is XmlElement {
  return node.type === "element";
}

/**
 * Type guard to check if a node is a text node.
 *
 * @example Usage
 * ```ts
 * import { isText } from "@std/xml/types";
 * import { assertEquals } from "@std/assert";
 *
 * const node = { type: "text" as const, text: "Hello" };
 * assertEquals(isText(node), true);
 * ```
 *
 * @param node The XML node to check.
 * @returns `true` if the node is a text node, `false` otherwise.
 */
export function isText(node: XmlNode): node is XmlTextNode {
  return node.type === "text";
}

/**
 * Type guard to check if a node is a CDATA node.
 *
 * @example Usage
 * ```ts
 * import { isCData } from "@std/xml/types";
 * import { assertEquals } from "@std/assert";
 *
 * const node = { type: "cdata" as const, text: "<script>" };
 * assertEquals(isCData(node), true);
 * ```
 *
 * @param node The XML node to check.
 * @returns `true` if the node is a CDATA node, `false` otherwise.
 */
export function isCData(node: XmlNode): node is XmlCDataNode {
  return node.type === "cdata";
}

/**
 * Type guard to check if a node is a comment.
 *
 * @example Usage
 * ```ts
 * import { isComment } from "@std/xml/types";
 * import { assertEquals } from "@std/assert";
 *
 * const node = { type: "comment" as const, text: "A comment" };
 * assertEquals(isComment(node), true);
 * ```
 *
 * @param node The XML node to check.
 * @returns `true` if the node is a comment, `false` otherwise.
 */
export function isComment(node: XmlNode): node is XmlCommentNode {
  return node.type === "comment";
}
