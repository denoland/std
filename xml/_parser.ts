// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal XML parser module.
 *
 * Transforms raw tokens from the tokenizer into high-level events,
 * handling namespace prefixes, entity decoding, and well-formedness validation.
 *
 * Uses a callback-based API for zero-allocation streaming.
 *
 * @module
 */

import type {
  ParseStreamOptions,
  XmlAttributeIterator,
  XmlEventCallbacks,
  XmlTokenCallbacks,
} from "./types.ts";
import { XmlSyntaxError } from "./types.ts";
import { decodeEntities } from "./_entities.ts";
import {
  validateNamespaceBinding,
  validateQName,
  WHITESPACE_ONLY_RE,
  XML_NAMESPACE,
} from "./_common.ts";

/**
 * Normalizes attribute value per XML 1.0 §3.3.3.
 *
 * Only predefined entities are expanded (lt, gt, amp, apos, quot).
 * Custom entities from DTD are NOT expanded.
 *
 * @see {@link https://www.w3.org/TR/xml/#AVNormalize}
 */
function normalizeAttributeValue(raw: string): string {
  // Replace literal \t and \n with space BEFORE entity decoding (preserves &#10;)
  const normalized = raw.includes("\t") || raw.includes("\n")
    ? raw.replace(/[\t\n]/g, " ")
    : raw;
  return decodeEntities(normalized);
}

/**
 * Reusable attribute iterator implementation.
 *
 * This class reuses internal arrays across elements to avoid allocations.
 * The iterator is valid only until the next element is processed.
 */
class AttributeIteratorImpl implements XmlAttributeIterator {
  #names: string[] = [];
  #values: string[] = [];
  #colonIndices: number[] = [];
  #uris: (string | undefined)[] = [];
  #count = 0;

  get count(): number {
    return this.#count;
  }

  getName(index: number): string {
    return this.#names[index]!;
  }

  getValue(index: number): string {
    return this.#values[index]!;
  }

  getColonIndex(index: number): number {
    return this.#colonIndices[index]!;
  }

  getUri(index: number): string | undefined {
    return this.#uris[index];
  }

  /** @internal Reset the iterator for a new element. */
  _reset(): void {
    this.#count = 0;
  }

  /** @internal Add an attribute (name already decoded, value raw). */
  _add(name: string, value: string): void {
    this.#names[this.#count] = name;
    this.#values[this.#count] = normalizeAttributeValue(value);
    this.#colonIndices[this.#count] = name.indexOf(":");
    this.#uris[this.#count] = undefined; // Will be set later
    this.#count++;
  }

  /** @internal Set the URI for an attribute at the given index. */
  _setUri(index: number, uri: string | undefined): void {
    this.#uris[index] = uri;
  }

  /** @internal Check if an attribute with this name already exists. */
  _has(name: string): boolean {
    for (let i = 0; i < this.#count; i++) {
      if (this.#names[i] === name) return true;
    }
    return false;
  }
}

/** Shared empty array for elements without namespace bindings, avoiding per-element allocation. */
const EMPTY_NS_BINDINGS: Array<[string, string | undefined]> = [];

/**
 * Stateful XML Event Parser.
 *
 * Implements {@linkcode XmlTokenCallbacks} to receive tokens from the tokenizer,
 * and emits events via {@linkcode XmlEventCallbacks}. This enables zero-allocation
 * streaming from tokenizer through parser to consumer.
 */
export class XmlEventParser implements XmlTokenCallbacks {
  #callbacks: XmlEventCallbacks;
  #ignoreWhitespace: boolean;
  #ignoreComments: boolean;
  #ignoreProcessingInstructions: boolean;
  #coerceCDataToText: boolean;

  #elementStack: Array<{
    rawName: string;
    colonIndex: number;
    uri: string | undefined;
    line: number;
    column: number;
    offset: number;
  }> = [];

  /** Track whether root element has been seen and closed */
  #hasRoot = false;
  #rootClosed = false;

  // Note: We do NOT expand custom entities from DTD.
  // Only predefined entities (lt, gt, amp, apos, quot) are supported.
  // External entities (SYSTEM/PUBLIC) are also not supported.

  /** Pending element state (reused across elements). */
  #pendingName = "";
  #pendingColonIndex = -1;
  #pendingLine = 0;
  #pendingColumn = 0;
  #pendingOffset = 0;
  #hasPendingElement = false;

  /** Reusable attribute iterator. */
  #attrIterator = new AttributeIteratorImpl();

  /** Namespace tracking (lazy initialization for performance) */
  #nsBindings: Map<string, string> | null = null;
  /** Stack of namespace bindings per element scope */
  #nsStack: Array<Array<[string, string | undefined]>> = [];
  /** Pending namespace bindings for current element */
  #pendingNsBindings: Array<[string, string | undefined]> = [];

  constructor(callbacks: XmlEventCallbacks, options: ParseStreamOptions = {}) {
    this.#callbacks = callbacks;
    this.#ignoreWhitespace = options.ignoreWhitespace ?? false;
    this.#ignoreComments = options.ignoreComments ?? false;
    this.#ignoreProcessingInstructions = options.ignoreProcessingInstructions ??
      false;
    this.#coerceCDataToText = options.coerceCDataToText ?? false;
  }

  // XmlTokenCallbacks implementation

  onStartTagOpen(
    name: string,
    line: number,
    column: number,
    offset: number,
  ): void {
    const colonIndex = name.indexOf(":");

    // Validate QName syntax (Namespaces §3)
    const qnameError = validateQName(name, colonIndex);
    if (qnameError) {
      throw new XmlSyntaxError(
        `Invalid element name '${name}': ${qnameError}`,
        { line, column, offset },
      );
    }

    // Elements cannot use xmlns prefix (Namespaces 1.0 errata NE08)
    if (colonIndex !== -1 && name.slice(0, colonIndex) === "xmlns") {
      throw new XmlSyntaxError(
        "Element name cannot use the 'xmlns' prefix",
        { line, column, offset },
      );
    }

    this.#pendingName = name;
    this.#pendingColonIndex = colonIndex;
    this.#pendingLine = line;
    this.#pendingColumn = column;
    this.#pendingOffset = offset;
    this.#hasPendingElement = true;
    this.#attrIterator._reset();
    this.#pendingNsBindings.length = 0; // Reset for new element
  }

  onAttribute(name: string, value: string): void {
    if (this.#hasPendingElement) {
      // Validate QName syntax for attribute name (Namespaces §3)
      const colonIndex = name.indexOf(":");
      const qnameError = validateQName(name, colonIndex);
      if (qnameError) {
        throw new XmlSyntaxError(
          `Invalid attribute name '${name}': ${qnameError}`,
          {
            line: this.#pendingLine,
            column: this.#pendingColumn,
            offset: this.#pendingOffset,
          },
        );
      }

      // Validate namespace binding if this is an xmlns attribute
      if (name === "xmlns" || name.startsWith("xmlns:")) {
        // Normalize the attribute value for namespace URI
        const normalizedValue = normalizeAttributeValue(value);
        const nsError = validateNamespaceBinding(name, normalizedValue);
        if (nsError) {
          throw new XmlSyntaxError(
            nsError,
            {
              line: this.#pendingLine,
              column: this.#pendingColumn,
              offset: this.#pendingOffset,
            },
          );
        }
        // Track xmlns:prefix declarations
        if (name.startsWith("xmlns:")) {
          const prefix = name.slice(6); // After "xmlns:"
          // Lazy init namespace bindings
          if (!this.#nsBindings) {
            this.#nsBindings = new Map([["xml", XML_NAMESPACE]]);
          }
          // Save previous binding for restoration
          this.#pendingNsBindings.push([prefix, this.#nsBindings.get(prefix)]);
          this.#nsBindings.set(prefix, normalizedValue);
        }
      }

      // XML 1.0 §3.1: Attribute names must be unique within a start-tag
      if (this.#attrIterator._has(name)) {
        throw new XmlSyntaxError(
          `Duplicate attribute '${name}'`,
          {
            line: this.#pendingLine,
            column: this.#pendingColumn,
            offset: this.#pendingOffset,
          },
        );
      }
      this.#attrIterator._add(name, value);
    }
  }

  onStartTagClose(selfClosing: boolean): void {
    if (this.#hasPendingElement) {
      // XML 1.0 §2.8: Only one root element is allowed
      if (this.#rootClosed) {
        throw new XmlSyntaxError(
          "Only one root element is allowed (XML 1.0 §2.8)",
          {
            line: this.#pendingLine,
            column: this.#pendingColumn,
            offset: this.#pendingOffset,
          },
        );
      }

      // Validate element prefix is bound (if it has one) and resolve URI
      let elementUri: string | undefined;
      if (this.#pendingColonIndex !== -1) {
        const prefix = this.#pendingName.slice(0, this.#pendingColonIndex);
        // xml prefix is always implicitly bound, xmlns prefix is handled separately
        if (prefix !== "xml" && prefix !== "xmlns") {
          if (!this.#nsBindings || !this.#nsBindings.has(prefix)) {
            throw new XmlSyntaxError(
              `Unbound namespace prefix '${prefix}' in element <${this.#pendingName}>`,
              {
                line: this.#pendingLine,
                column: this.#pendingColumn,
                offset: this.#pendingOffset,
              },
            );
          }
          elementUri = this.#nsBindings.get(prefix);
        } else if (prefix === "xml") {
          elementUri = XML_NAMESPACE;
        }
      }

      // Validate attribute prefixes are bound, resolve URIs, and check for duplicate expanded names
      // Optimized: only do expensive expansion check when same local name appears with different prefixes
      const attrCount = this.#attrIterator.count;
      let localNameToPrefixes: Map<string, string[]> | null = null;

      for (let i = 0; i < attrCount; i++) {
        const colonIdx = this.#attrIterator.getColonIndex(i);
        if (colonIdx !== -1) {
          const attrName = this.#attrIterator.getName(i);
          const prefix = attrName.slice(0, colonIdx);
          // Skip xmlns: attributes (they declare, not use, prefixes)
          if (prefix === "xmlns") {
            // xmlns: attributes don't have namespace URIs (they ARE the declarations)
            continue;
          }
          // xml prefix is always implicitly bound
          if (prefix === "xml") {
            this.#attrIterator._setUri(i, XML_NAMESPACE);
            continue;
          }
          if (!this.#nsBindings || !this.#nsBindings.has(prefix)) {
            throw new XmlSyntaxError(
              `Unbound namespace prefix '${prefix}' in attribute '${attrName}'`,
              {
                line: this.#pendingLine,
                column: this.#pendingColumn,
                offset: this.#pendingOffset,
              },
            );
          }
          // Set the resolved URI for this attribute
          this.#attrIterator._setUri(i, this.#nsBindings.get(prefix));
          // Track local names for duplicate expanded name detection
          const localName = attrName.slice(colonIdx + 1);
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

      // Check for duplicate expanded attribute names (Namespaces §6.3)
      // Only when same local name appears with multiple prefixes
      if (localNameToPrefixes && this.#nsBindings) {
        for (const [localName, prefixes] of localNameToPrefixes) {
          if (prefixes.length > 1) {
            // Multiple prefixes for same local name - check if any resolve to same URI
            const seenUris = new Set<string>();
            for (const prefix of prefixes) {
              const uri = this.#nsBindings.get(prefix)!;
              if (seenUris.has(uri)) {
                throw new XmlSyntaxError(
                  `Duplicate expanded attribute name '{${uri}}${localName}'`,
                  {
                    line: this.#pendingLine,
                    column: this.#pendingColumn,
                    offset: this.#pendingOffset,
                  },
                );
              }
              seenUris.add(uri);
            }
          }
        }
      }

      // Track root element
      const isRoot = !this.#hasRoot;
      if (isRoot) {
        this.#hasRoot = true;
      }

      this.#callbacks.onStartElement?.(
        this.#pendingName,
        this.#pendingColonIndex,
        elementUri,
        this.#attrIterator,
        selfClosing,
        this.#pendingLine,
        this.#pendingColumn,
        this.#pendingOffset,
      );

      if (selfClosing) {
        this.#callbacks.onEndElement?.(
          this.#pendingName,
          this.#pendingColonIndex,
          elementUri,
          this.#pendingLine,
          this.#pendingColumn,
          this.#pendingOffset,
        );
        // If this was the root and it's self-closing, root is now closed
        if (isRoot) {
          this.#rootClosed = true;
        }
        // Restore namespace bindings for self-closing element
        if (this.#pendingNsBindings.length > 0 && this.#nsBindings) {
          for (const [prefix, previousUri] of this.#pendingNsBindings) {
            if (previousUri === undefined) {
              this.#nsBindings.delete(prefix);
            } else {
              this.#nsBindings.set(prefix, previousUri);
            }
          }
        }
      } else {
        this.#elementStack.push({
          rawName: this.#pendingName,
          colonIndex: this.#pendingColonIndex,
          uri: elementUri,
          line: this.#pendingLine,
          column: this.#pendingColumn,
          offset: this.#pendingOffset,
        });
        // Push namespace bindings to stack (shared constant avoids allocation
        // for the common case of elements without namespace declarations)
        this.#nsStack.push(
          this.#pendingNsBindings.length > 0
            ? this.#pendingNsBindings.slice()
            : EMPTY_NS_BINDINGS,
        );
      }

      // Reset pending namespace bindings for next element
      this.#pendingNsBindings.length = 0;
      this.#hasPendingElement = false;
    }
  }

  onEndTag(
    name: string,
    line: number,
    column: number,
    offset: number,
  ): void {
    const expected = this.#elementStack.pop();
    if (expected === undefined) {
      throw new XmlSyntaxError(
        `Unexpected closing tag </${name}> with no matching opening tag`,
        { line, column, offset },
      );
    }
    if (expected.rawName !== name) {
      throw new XmlSyntaxError(
        `Mismatched closing tag: expected </${expected.rawName}> but found </${name}>`,
        { line, column, offset },
      );
    }

    // Restore namespace bindings from this element's scope
    const elementBindings = this.#nsStack.pop();
    if (elementBindings && this.#nsBindings) {
      for (const [prefix, previousUri] of elementBindings) {
        if (previousUri === undefined) {
          this.#nsBindings.delete(prefix);
        } else {
          this.#nsBindings.set(prefix, previousUri);
        }
      }
    }

    this.#callbacks.onEndElement?.(
      name,
      expected.colonIndex,
      expected.uri,
      line,
      column,
      offset,
    );

    // Track when root element closes
    if (this.#elementStack.length === 0 && this.#hasRoot) {
      this.#rootClosed = true;
    }
  }

  onText(
    content: string,
    line: number,
    column: number,
    offset: number,
  ): void {
    // XML 1.0 §2.8: Prolog and epilog only allow Misc, where:
    // Misc ::= Comment | PI | S
    // S is LITERAL whitespace only, not character/entity references
    const outsideRoot = !this.#hasRoot || this.#rootClosed;
    if (outsideRoot) {
      // Check raw content for any entity/character references
      if (content.includes("&")) {
        throw new XmlSyntaxError(
          "Character/entity references are not allowed in prolog/epilog (XML 1.0 §2.8)",
          { line, column, offset },
        );
      }
      // For outside root, only whitespace is allowed - check raw content first
      // (avoids entity decoding for whitespace-only content)
      if (!WHITESPACE_ONLY_RE.test(content)) {
        if (!this.#hasRoot) {
          throw new XmlSyntaxError(
            "Content is not allowed before the root element (XML 1.0 §2.8)",
            { line, column, offset },
          );
        } else {
          throw new XmlSyntaxError(
            "Content is not allowed after the root element (XML 1.0 §2.8)",
            { line, column, offset },
          );
        }
      }
      // Outside root whitespace - skip if ignoring whitespace, otherwise emit
      if (this.#ignoreWhitespace) return;
      this.#callbacks.onText?.(content, line, column, offset);
      return;
    }

    // Inside root element - decode entities
    const text = decodeEntities(content);
    if (this.#ignoreWhitespace && WHITESPACE_ONLY_RE.test(text)) return;
    this.#callbacks.onText?.(text, line, column, offset);
  }

  onCData(
    content: string,
    line: number,
    column: number,
    offset: number,
  ): void {
    // XML 1.0 §2.8: CDATA sections are only allowed within elements
    if (!this.#hasRoot) {
      throw new XmlSyntaxError(
        "CDATA section is not allowed before the root element (XML 1.0 §2.8)",
        { line, column, offset },
      );
    }
    if (this.#rootClosed) {
      throw new XmlSyntaxError(
        "CDATA section is not allowed after the root element (XML 1.0 §2.8)",
        { line, column, offset },
      );
    }

    if (this.#coerceCDataToText) {
      this.#callbacks.onText?.(content, line, column, offset);
    } else {
      this.#callbacks.onCData?.(content, line, column, offset);
    }
  }

  onComment(
    content: string,
    line: number,
    column: number,
    offset: number,
  ): void {
    if (this.#ignoreComments) return;
    this.#callbacks.onComment?.(content, line, column, offset);
  }

  onProcessingInstruction(
    target: string,
    content: string,
    line: number,
    column: number,
    offset: number,
  ): void {
    // XML Namespaces §3: PI targets must not contain colons
    if (target.includes(":")) {
      throw new XmlSyntaxError(
        "Processing instruction target must not contain ':' (Namespaces §3)",
        { line, column, offset },
      );
    }

    if (this.#ignoreProcessingInstructions) return;
    this.#callbacks.onProcessingInstruction?.(
      target,
      content,
      line,
      column,
      offset,
    );
  }

  onDeclaration(
    version: string,
    encoding: string | undefined,
    standalone: "yes" | "no" | undefined,
    line: number,
    column: number,
    offset: number,
  ): void {
    this.#callbacks.onDeclaration?.(
      version,
      encoding,
      standalone,
      line,
      column,
      offset,
    );
  }

  // DOCTYPE parsed by tokenizer but not emitted as event
  onDoctype(): void {}

  // Entity declarations from DTD are intentionally NOT stored.
  // We only support the 5 predefined XML entities.
  // deno-lint-ignore no-unused-vars
  onEntityDeclaration(name: string, value: string): void {
    // Intentionally empty - custom entities are not expanded
  }

  // Public API

  /**
   * Finalize parsing and validate that all elements are closed.
   *
   * @throws {XmlSyntaxError} If there are unclosed elements or no root element.
   */
  finalize(): void {
    if (this.#elementStack.length > 0) {
      const unclosed = this.#elementStack[this.#elementStack.length - 1]!;
      throw new XmlSyntaxError(
        `Unclosed element <${unclosed.rawName}>`,
        unclosed,
      );
    }

    // XML 1.0 §2.1: A well-formed document must have exactly one root element
    if (!this.#hasRoot) {
      throw new XmlSyntaxError(
        "No root element found in XML document",
        { line: 0, column: 0, offset: 0 },
      );
    }
  }
}
