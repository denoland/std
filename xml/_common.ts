// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal shared utilities for the XML module.
 *
 * @module
 */

import type { XmlName } from "./types.ts";

/**
 * Line ending normalization pattern per XML 1.0 §2.11.
 * Converts \r\n and standalone \r to \n.
 */
export const LINE_ENDING_RE = /\r\n?/g;

/**
 * Whitespace-only test per XML 1.0 §2.3.
 * Uses explicit [ \t\r\n] instead of \s to match XML spec exactly:
 *   S ::= (#x20 | #x9 | #xD | #xA)+
 */
export const WHITESPACE_ONLY_RE = /^[ \t\r\n]*$/;

/**
 * XML declaration version attribute pattern.
 * Matches both single and double quoted values.
 */
export const VERSION_RE = /version\s*=\s*(?:"([^"]+)"|'([^']+)')/;

/**
 * XML declaration encoding attribute pattern.
 * Matches both single and double quoted values.
 */
export const ENCODING_RE = /encoding\s*=\s*(?:"([^"]+)"|'([^']+)')/;

/**
 * XML declaration standalone attribute pattern.
 * Matches both single and double quoted values, restricted to "yes" or "no".
 */
export const STANDALONE_RE = /standalone\s*=\s*(?:"(yes|no)"|'(yes|no)')/;

/**
 * Result of validating an XML declaration.
 */
export interface XmlDeclarationValidationResult {
  valid: true;
  version: string;
  encoding?: string;
  standalone?: "yes" | "no";
}

/**
 * Error result of validating an XML declaration.
 */
export interface XmlDeclarationValidationError {
  valid: false;
  error: string;
}

/**
 * XML whitespace characters per §2.3.
 */
function isXmlWhitespace(code: number): boolean {
  return code === 0x20 || code === 0x09 || code === 0x0A || code === 0x0D;
}

/**
 * Validates a VersionNum per XML 1.0 §2.8.
 * VersionNum ::= '1.' [0-9]+
 *
 * @returns true if valid, false otherwise
 */
function isValidVersionNum(version: string): boolean {
  // Must be "1." followed by one or more digits
  if (version.length < 3 || !version.startsWith("1.")) {
    return false;
  }
  for (let i = 2; i < version.length; i++) {
    const code = version.charCodeAt(i);
    if (code < 0x30 || code > 0x39) { // 0-9
      return false;
    }
  }
  return true;
}

/**
 * Validates an EncName per XML 1.0 §4.3.3.
 * EncName ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
 *
 * @returns true if valid, false otherwise
 */
function isValidEncName(encoding: string): boolean {
  if (encoding.length === 0) {
    return false;
  }
  // First character must be a letter
  const first = encoding.charCodeAt(0);
  if (
    !(first >= 0x41 && first <= 0x5A) && // A-Z
    !(first >= 0x61 && first <= 0x7A) // a-z
  ) {
    return false;
  }
  // Rest can be letter, digit, '.', '_', '-'
  for (let i = 1; i < encoding.length; i++) {
    const code = encoding.charCodeAt(i);
    if (
      !(code >= 0x41 && code <= 0x5A) && // A-Z
      !(code >= 0x61 && code <= 0x7A) && // a-z
      !(code >= 0x30 && code <= 0x39) && // 0-9
      code !== 0x2E && // .
      code !== 0x5F && // _
      code !== 0x2D // -
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Validates and parses an XML declaration content string.
 *
 * XML 1.0 §2.8 XMLDecl:
 *   XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
 *   VersionInfo ::= S 'version' Eq ("'" VersionNum "'" | '"' VersionNum '"')
 *   EncodingDecl ::= S 'encoding' Eq ('"' EncName '"' | "'" EncName "'" )
 *   SDDecl ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") | ('"' ('yes' | 'no') '"'))
 *   Eq ::= S? '=' S?
 *
 * This function validates:
 * - 'version' is required and must be first
 * - Attributes must have whitespace before them (after previous value/version)
 * - No duplicate attributes
 * - No unknown attributes
 * - Quote characters must match
 * - 'encoding' must come before 'standalone' if both present
 *
 * @param content The content between <?xml and ?> (whitespace trimmed by caller)
 * @returns Validation result with parsed values or error message
 */
export function validateXmlDeclaration(
  content: string,
): XmlDeclarationValidationResult | XmlDeclarationValidationError {
  // Fast-path: version is required and must be first, quick check before full parse
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("version")) {
    // Check for common errors: case variants
    if (
      trimmed.startsWith("VERSION") || trimmed.startsWith("Version")
    ) {
      const name = trimmed.slice(0, 7);
      return {
        valid: false,
        error: `'${name}' must be lowercase in XML declaration`,
      };
    }
    return {
      valid: false,
      error: "Missing required 'version' attribute in XML declaration",
    };
  }

  let pos = 0;
  const len = content.length;

  let version: string | undefined;
  let encoding: string | undefined;
  let standalone: "yes" | "no" | undefined;
  let foundVersion = false;
  let foundEncoding = false;
  let foundStandalone = false;

  // Skip leading whitespace
  while (pos < len && isXmlWhitespace(content.charCodeAt(pos))) {
    pos++;
  }

  // Parse attributes
  while (pos < len) {
    // Read attribute name
    const nameStart = pos;
    while (
      pos < len &&
      !isXmlWhitespace(content.charCodeAt(pos)) &&
      content.charCodeAt(pos) !== 0x3D // =
    ) {
      pos++;
    }
    const name = content.slice(nameStart, pos);

    if (name === "") {
      // Trailing whitespace only
      break;
    }

    // Check for valid attribute names and order
    if (name === "version") {
      if (foundVersion) {
        return {
          valid: false,
          error: "Duplicate 'version' attribute in XML declaration",
        };
      }
      foundVersion = true;
    } else if (name === "encoding") {
      if (foundEncoding) {
        return {
          valid: false,
          error: "Duplicate 'encoding' attribute in XML declaration",
        };
      }
      if (foundStandalone) {
        return {
          valid: false,
          error: "'encoding' must come before 'standalone' in XML declaration",
        };
      }
      foundEncoding = true;
    } else if (name === "standalone") {
      if (foundStandalone) {
        return {
          valid: false,
          error: "Duplicate 'standalone' attribute in XML declaration",
        };
      }
      foundStandalone = true;
    } else if (
      name === "VERSION" || name === "Version" ||
      name === "ENCODING" || name === "Encoding" ||
      name === "STANDALONE" || name === "Standalone"
    ) {
      // Case-sensitive check - these must be lowercase
      return {
        valid: false,
        error: `'${name}' must be lowercase in XML declaration`,
      };
    } else {
      return {
        valid: false,
        error: `Unknown attribute '${name}' in XML declaration`,
      };
    }

    // Skip whitespace before =
    while (pos < len && isXmlWhitespace(content.charCodeAt(pos))) {
      pos++;
    }

    // Expect =
    if (pos >= len || content.charCodeAt(pos) !== 0x3D) {
      return {
        valid: false,
        error: `Expected '=' after '${name}' in XML declaration`,
      };
    }
    pos++; // Skip =

    // Skip whitespace after =
    while (pos < len && isXmlWhitespace(content.charCodeAt(pos))) {
      pos++;
    }

    // Expect quote
    if (pos >= len) {
      return {
        valid: false,
        error: `Expected quoted value for '${name}' in XML declaration`,
      };
    }
    const quote = content.charCodeAt(pos);
    if (quote !== 0x22 && quote !== 0x27) { // " or '
      return {
        valid: false,
        error: `Expected quote for '${name}' value in XML declaration`,
      };
    }
    pos++; // Skip opening quote

    // Read value until matching quote
    const valueStart = pos;
    while (pos < len && content.charCodeAt(pos) !== quote) {
      pos++;
    }
    if (pos >= len) {
      return {
        valid: false,
        error: `Unterminated ${name} value in XML declaration`,
      };
    }
    const value = content.slice(valueStart, pos);
    pos++; // Skip closing quote

    // Validate and store value
    if (name === "version") {
      if (!isValidVersionNum(value)) {
        return {
          valid: false,
          error:
            `Invalid version '${value}': must match '1.' followed by digits`,
        };
      }
      version = value;
    } else if (name === "encoding") {
      if (!isValidEncName(value)) {
        return {
          valid: false,
          error:
            `Invalid encoding name '${value}': must start with a letter and contain only letters, digits, '.', '_', '-'`,
        };
      }
      encoding = value;
    } else if (name === "standalone") {
      if (value !== "yes" && value !== "no") {
        return {
          valid: false,
          error: `Invalid standalone value '${value}': must be 'yes' or 'no'`,
        };
      }
      standalone = value;
    }

    // Check for required whitespace before next attribute
    const hadWhitespace = pos < len && isXmlWhitespace(content.charCodeAt(pos));

    // Skip whitespace
    while (pos < len && isXmlWhitespace(content.charCodeAt(pos))) {
      pos++;
    }

    // If there's more content, whitespace was required
    if (pos < len && !hadWhitespace) {
      return {
        valid: false,
        error: "Missing whitespace between attributes in XML declaration",
      };
    }
  }

  return {
    valid: true,
    version: version!,
    ...(encoding !== undefined && { encoding }),
    ...(standalone !== undefined && { standalone }),
  };
}

/**
 * Checks if a PI target is a case-variant of "xml" (which is reserved).
 *
 * XML 1.0 §2.6: "The target names 'XML', 'xml', and so on are reserved for
 * standardization in this or future versions of this specification."
 *
 * @returns true if the target is reserved (any case variant of "xml")
 */
export function isReservedPiTarget(target: string): boolean {
  return target.length === 3 && target.toLowerCase() === "xml";
}

// =============================================================================
// NAMESPACE VALIDATION (XML Namespaces 1.0)
// =============================================================================

/** The reserved XML namespace URI. */
export const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";

/** The reserved xmlns namespace URI. */
export const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";

/**
 * Validates QName syntax per XML Namespaces 1.0.
 *
 * A QName must be either:
 * - An NCName (no colons)
 * - A prefix:local pair where both prefix and local are valid NCNames
 *
 * This validates:
 * - No colon at start (:foo is invalid)
 * - No colon at end (foo: is invalid)
 * - No multiple colons (a:b:c is invalid)
 *
 * @param colonIndex The index of the first colon, or -1 if none.
 * @returns Error message if invalid, null if valid.
 */
export function validateQName(name: string, colonIndex: number): string | null {
  if (colonIndex === -1) {
    return null; // No colon means valid NCName (already validated by name char rules)
  }

  // Colon at start (:foo) - invalid
  if (colonIndex === 0) {
    return "QName cannot start with ':'";
  }

  // Colon at end (foo:) - invalid
  if (colonIndex === name.length - 1) {
    return "QName cannot end with ':'";
  }

  // Multiple colons (a:b:c) - invalid
  if (name.indexOf(":", colonIndex + 1) !== -1) {
    return "QName cannot contain multiple ':'";
  }

  return null; // Valid QName
}

/**
 * Validates a namespace binding (xmlns or xmlns:prefix attribute).
 *
 * Per XML Namespaces 1.0:
 * - xmlns:prefix="" (prefix unbinding) is NOT allowed in NS 1.0
 * - xmlns:xmlns is NOT allowed (cannot declare xmlns prefix)
 * - xmlns:xml must bind to the correct XML namespace
 * - Only xml prefix can bind to the XML namespace
 * - Nothing can bind to the xmlns namespace
 * - Default namespace cannot be xml or xmlns namespace
 *
 * @returns Error message if invalid, null if valid.
 */
export function validateNamespaceBinding(
  attrName: string,
  attrValue: string,
): string | null {
  const colonIndex = attrName.indexOf(":");
  const isDefaultNs = attrName === "xmlns";
  const prefix = isDefaultNs ? "" : attrName.slice(colonIndex + 1);
  const uri = attrValue;

  // xmlns: with empty local part is caught by QName validation
  // But check for empty prefix after xmlns:
  if (colonIndex !== -1 && prefix === "") {
    return "Cannot have empty namespace prefix after 'xmlns:'";
  }

  // Prefix unbinding not allowed in NS 1.0 (xmlns:foo="")
  if (!isDefaultNs && uri === "") {
    return "Cannot unbind namespace prefix (empty URI) in Namespaces 1.0";
  }

  // Cannot declare xmlns prefix at all
  if (prefix === "xmlns") {
    return "Cannot declare the 'xmlns' prefix";
  }

  // xml prefix must use correct URI
  if (prefix === "xml" && uri !== XML_NAMESPACE) {
    return `Cannot bind 'xml' prefix to '${uri}': must use '${XML_NAMESPACE}'`;
  }

  // Only xml prefix can use xml namespace
  if (uri === XML_NAMESPACE && prefix !== "xml" && prefix !== "") {
    return `Cannot bind prefix '${prefix}' to '${XML_NAMESPACE}': only the 'xml' prefix may use this namespace`;
  }

  // Nothing can bind to xmlns namespace (includes default namespace case)
  if (uri === XMLNS_NAMESPACE) {
    return `Cannot bind any prefix to '${XMLNS_NAMESPACE}'`;
  }

  // Default namespace cannot be xml namespace
  if (isDefaultNs && uri === XML_NAMESPACE) {
    return `Cannot use '${XML_NAMESPACE}' as the default namespace`;
  }

  return null; // Valid binding
}

/**
 * Parses a qualified XML name into its prefix and local parts.
 *
 * @param uri Optional resolved namespace URI for prefixed names.
 * @returns An XmlName object with raw, local, optional prefix, and optional uri.
 */
export function parseName(name: string, uri?: string): XmlName {
  const colonIndex = name.indexOf(":");
  if (colonIndex === -1) {
    return { raw: name, local: name };
  }
  return {
    raw: name,
    prefix: name.slice(0, colonIndex),
    local: name.slice(colonIndex + 1),
    ...(uri !== undefined && { uri }),
  };
}
