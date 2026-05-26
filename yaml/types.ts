// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Type definitions for the YAML parser.
 *
 * @module
 */

/**
 * Position information for error reporting.
 *
 * `line` and `column` are 1-indexed; `offset` is the 0-indexed character
 * offset into the source string.
 */
export interface YamlPosition {
  /** Line number (1-indexed). */
  readonly line: number;
  /** Column number (1-indexed). */
  readonly column: number;
  /** Character offset in the input (0-indexed). */
  readonly offset: number;
}

/**
 * Error thrown when YAML parsing fails.
 *
 * Subclass of {@linkcode SyntaxError}, so existing
 * `instanceof SyntaxError` checks keep working. Carries structured
 * position information so consumers do not have to parse the message.
 *
 * @example Usage
 * ```ts
 * import { parse, YamlSyntaxError } from "@std/yaml";
 * import { assertInstanceOf } from "@std/assert";
 *
 * try {
 *   parse(`"`);
 * } catch (error) {
 *   assertInstanceOf(error, YamlSyntaxError);
 *   assertInstanceOf(error, SyntaxError);
 * }
 * ```
 */
export class YamlSyntaxError extends SyntaxError {
  /**
   * The line number where the error occurred (1-indexed).
   *
   * @example Usage
   * ```ts
   * import { YamlSyntaxError } from "@std/yaml";
   * import { assertEquals } from "@std/assert";
   *
   * const error = new YamlSyntaxError("Test", { line: 5, column: 10, offset: 50 });
   * assertEquals(error.line, 5);
   * ```
   */
  readonly line: number;
  /**
   * The column number where the error occurred (1-indexed).
   *
   * @example Usage
   * ```ts
   * import { YamlSyntaxError } from "@std/yaml";
   * import { assertEquals } from "@std/assert";
   *
   * const error = new YamlSyntaxError("Test", { line: 5, column: 10, offset: 50 });
   * assertEquals(error.column, 10);
   * ```
   */
  readonly column: number;
  /**
   * The character offset where the error occurred (0-indexed).
   *
   * @example Usage
   * ```ts
   * import { YamlSyntaxError } from "@std/yaml";
   * import { assertEquals } from "@std/assert";
   *
   * const error = new YamlSyntaxError("Test", { line: 5, column: 10, offset: 50 });
   * assertEquals(error.offset, 50);
   * ```
   */
  readonly offset: number;
  /**
   * A formatted snippet of the source around the error, including a caret
   * line indicating the column. Undefined when the source is empty.
   *
   * @example Usage
   * ```ts
   * import { YamlSyntaxError } from "@std/yaml";
   * import { assertEquals } from "@std/assert";
   *
   * const snippet = "    foo: bar\n         ^";
   * const error = new YamlSyntaxError(
   *   "Test",
   *   { line: 1, column: 6, offset: 5 },
   *   snippet,
   * );
   * assertEquals(error.snippet, snippet);
   * ```
   */
  readonly snippet?: string;

  /**
   * Constructs a new YamlSyntaxError.
   *
   * The constructed `message` is `${message} at line ${line}, column ${column}`,
   * with `:\n${snippet}` appended when a snippet is provided.
   *
   * @param message The error message describing the syntax issue.
   * @param position The position in the YAML source where the error occurred.
   * @param snippet Optional formatted snippet of the source around the error.
   */
  constructor(message: string, position: YamlPosition, snippet?: string) {
    let fullMessage =
      `${message} at line ${position.line}, column ${position.column}`;
    if (snippet) fullMessage += `:\n${snippet}`;
    super(fullMessage);
    this.name = "YamlSyntaxError";
    this.line = position.line;
    this.column = position.column;
    this.offset = position.offset;
    if (snippet !== undefined) this.snippet = snippet;
  }
}
