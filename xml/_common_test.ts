// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import {
  isIllegalXmlLiteralChar,
  LINE_ENDING_REGEXP,
  parseName,
  validateNamespaceBinding,
  validatePubidLiteral,
  validateQName,
  validateXmlDeclaration,
} from "./_common.ts";

// =============================================================================
// validateXmlDeclaration Tests
// =============================================================================

Deno.test("validateXmlDeclaration() accepts minimal declaration", () => {
  const result = validateXmlDeclaration('version="1.0"');
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.version, "1.0");
    assertEquals(result.encoding, undefined);
    assertEquals(result.standalone, undefined);
  }
});

Deno.test("validateXmlDeclaration() accepts declaration with encoding", () => {
  const result = validateXmlDeclaration('version="1.0" encoding="UTF-8"');
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.version, "1.0");
    assertEquals(result.encoding, "UTF-8");
  }
});

Deno.test("validateXmlDeclaration() accepts declaration with standalone", () => {
  const result = validateXmlDeclaration('version="1.0" standalone="yes"');
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.standalone, "yes");
  }
});

Deno.test("validateXmlDeclaration() accepts declaration with all attributes", () => {
  const result = validateXmlDeclaration(
    'version="1.0" encoding="UTF-8" standalone="no"',
  );
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.version, "1.0");
    assertEquals(result.encoding, "UTF-8");
    assertEquals(result.standalone, "no");
  }
});

Deno.test("validateXmlDeclaration() accepts single-quoted values", () => {
  const result = validateXmlDeclaration("version='1.0' encoding='UTF-8'");
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.version, "1.0");
    assertEquals(result.encoding, "UTF-8");
  }
});

Deno.test("validateXmlDeclaration() accepts trailing whitespace", () => {
  const result = validateXmlDeclaration('version="1.0"   ');
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.version, "1.0");
  }
});

Deno.test("validateXmlDeclaration() rejects missing version attribute", () => {
  const result = validateXmlDeclaration('encoding="UTF-8"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Missing required 'version' attribute in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects VERSION (uppercase)", () => {
  const result = validateXmlDeclaration('VERSION="1.0"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "'VERSION' must be lowercase in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects Version (mixed case)", () => {
  const result = validateXmlDeclaration('Version="1.0"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "'Version' must be lowercase in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects duplicate version", () => {
  const result = validateXmlDeclaration('version="1.0" version="1.1"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Duplicate 'version' attribute in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects encoding before version", () => {
  const result = validateXmlDeclaration('encoding="UTF-8" version="1.0"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    // The validation checks version first, so missing version triggers first
    assertEquals(
      result.error,
      "Missing required 'version' attribute in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects duplicate encoding", () => {
  const result = validateXmlDeclaration(
    'version="1.0" encoding="UTF-8" encoding="ASCII"',
  );
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Duplicate 'encoding' attribute in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects encoding after standalone", () => {
  const result = validateXmlDeclaration(
    'version="1.0" standalone="yes" encoding="UTF-8"',
  );
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "'encoding' must come before 'standalone' in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects standalone before version", () => {
  const result = validateXmlDeclaration('standalone="yes" version="1.0"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    // The validation checks version first, so missing version triggers first
    assertEquals(
      result.error,
      "Missing required 'version' attribute in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects duplicate standalone", () => {
  const result = validateXmlDeclaration(
    'version="1.0" standalone="yes" standalone="no"',
  );
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Duplicate 'standalone' attribute in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects ENCODING (uppercase)", () => {
  const result = validateXmlDeclaration('version="1.0" ENCODING="UTF-8"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "'ENCODING' must be lowercase in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects STANDALONE (uppercase)", () => {
  const result = validateXmlDeclaration('version="1.0" STANDALONE="yes"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "'STANDALONE' must be lowercase in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects unknown attribute", () => {
  const result = validateXmlDeclaration('version="1.0" unknown="value"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Unknown attribute 'unknown' in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects missing = after attribute name", () => {
  const result = validateXmlDeclaration('version "1.0"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Expected '=' after 'version' in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects missing quote after =", () => {
  const result = validateXmlDeclaration("version=");
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Expected quoted value for 'version' in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects non-quote character after =", () => {
  const result = validateXmlDeclaration("version=1.0");
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Expected quote for 'version' value in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects unterminated value", () => {
  const result = validateXmlDeclaration('version="1.0');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(result.error, "Unterminated version value in XML declaration");
  }
});

Deno.test("validateXmlDeclaration() rejects invalid version number", () => {
  const result = validateXmlDeclaration('version="2.0"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Invalid version '2.0': must match '1.' followed by digits",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects version without minor number", () => {
  const result = validateXmlDeclaration('version="1."');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Invalid version '1.': must match '1.' followed by digits",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects invalid encoding name", () => {
  const result = validateXmlDeclaration('version="1.0" encoding="123UTF"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Invalid encoding name '123UTF': must start with a letter and contain only letters, digits, '.', '_', '-'",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects encoding with invalid character", () => {
  const result = validateXmlDeclaration('version="1.0" encoding="UTF@8"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Invalid encoding name 'UTF@8': must start with a letter and contain only letters, digits, '.', '_', '-'",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects empty encoding name", () => {
  const result = validateXmlDeclaration('version="1.0" encoding=""');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Invalid encoding name '': must start with a letter and contain only letters, digits, '.', '_', '-'",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects invalid standalone value", () => {
  const result = validateXmlDeclaration('version="1.0" standalone="maybe"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Invalid standalone value 'maybe': must be 'yes' or 'no'",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects missing whitespace between attributes", () => {
  const result = validateXmlDeclaration('version="1.0"encoding="UTF-8"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Missing whitespace between attributes in XML declaration",
    );
  }
});

// =============================================================================
// validateQName Tests
// =============================================================================

Deno.test("validateQName() accepts simple name without colon", () => {
  const error = validateQName("element", -1);
  assertEquals(error, null);
});

Deno.test("validateQName() accepts valid prefixed name", () => {
  const error = validateQName("ns:element", 2);
  assertEquals(error, null);
});

Deno.test("validateQName() rejects colon at start", () => {
  const error = validateQName(":element", 0);
  assertEquals(error, "QName cannot start with ':'");
});

Deno.test("validateQName() rejects colon at end", () => {
  const error = validateQName("element:", 7);
  assertEquals(error, "QName cannot end with ':'");
});

Deno.test("validateQName() rejects multiple colons", () => {
  const error = validateQName("a:b:c", 1);
  assertEquals(error, "QName cannot contain multiple ':'");
});

// =============================================================================
// validateNamespaceBinding Tests
// =============================================================================

Deno.test("validateNamespaceBinding() accepts default namespace declaration", () => {
  const error = validateNamespaceBinding("xmlns", "http://example.com", false);
  assertEquals(error, null);
});

Deno.test("validateNamespaceBinding() accepts prefixed namespace declaration", () => {
  const error = validateNamespaceBinding(
    "xmlns:ns",
    "http://example.com",
    false,
  );
  assertEquals(error, null);
});

Deno.test("validateNamespaceBinding() rejects empty prefix after xmlns:", () => {
  const error = validateNamespaceBinding(
    "xmlns:",
    "http://example.com",
    false,
  );
  assertEquals(error, "Cannot have empty namespace prefix after 'xmlns:'");
});

Deno.test("validateNamespaceBinding() rejects prefix unbinding (empty URI)", () => {
  const error = validateNamespaceBinding("xmlns:ns", "", false);
  assertEquals(
    error,
    "Cannot unbind namespace prefix (empty URI) in Namespaces 1.0",
  );
});

Deno.test("validateNamespaceBinding() allows empty default namespace", () => {
  const error = validateNamespaceBinding("xmlns", "", false);
  assertEquals(error, null);
});

Deno.test("validateNamespaceBinding() rejects xmlns prefix declaration", () => {
  const error = validateNamespaceBinding(
    "xmlns:xmlns",
    "http://example.com",
    false,
  );
  assertEquals(error, "Cannot declare the 'xmlns' prefix");
});

Deno.test("validateNamespaceBinding() rejects wrong URI for xml prefix", () => {
  const error = validateNamespaceBinding(
    "xmlns:xml",
    "http://wrong.uri",
    false,
  );
  assertEquals(
    error,
    "Cannot bind 'xml' prefix to 'http://wrong.uri': must use 'http://www.w3.org/XML/1998/namespace'",
  );
});

Deno.test("validateNamespaceBinding() accepts correct xml prefix binding", () => {
  const error = validateNamespaceBinding(
    "xmlns:xml",
    "http://www.w3.org/XML/1998/namespace",
    false,
  );
  assertEquals(error, null);
});

Deno.test("validateNamespaceBinding() rejects xml namespace URI for non-xml prefix", () => {
  const error = validateNamespaceBinding(
    "xmlns:other",
    "http://www.w3.org/XML/1998/namespace",
    false,
  );
  assertEquals(
    error,
    "Cannot bind prefix 'other' to 'http://www.w3.org/XML/1998/namespace': only the 'xml' prefix may use this namespace",
  );
});

Deno.test("validateNamespaceBinding() rejects binding to xmlns namespace", () => {
  const error = validateNamespaceBinding(
    "xmlns:ns",
    "http://www.w3.org/2000/xmlns/",
    false,
  );
  assertEquals(
    error,
    "Cannot bind any prefix to 'http://www.w3.org/2000/xmlns/'",
  );
});

Deno.test("validateNamespaceBinding() rejects xml namespace as default", () => {
  const error = validateNamespaceBinding(
    "xmlns",
    "http://www.w3.org/XML/1998/namespace",
    false,
  );
  assertEquals(
    error,
    "Cannot use 'http://www.w3.org/XML/1998/namespace' as the default namespace",
  );
});

Deno.test("validateNamespaceBinding() rejects xmlns namespace as default", () => {
  const error = validateNamespaceBinding(
    "xmlns",
    "http://www.w3.org/2000/xmlns/",
    false,
  );
  // The general "Cannot bind any prefix" check comes first
  assertEquals(
    error,
    "Cannot bind any prefix to 'http://www.w3.org/2000/xmlns/'",
  );
});

// =============================================================================
// parseName Tests
// =============================================================================

Deno.test("parseName() parses simple name without prefix", () => {
  const result = parseName("element");
  assertEquals(result.raw, "element");
  assertEquals(result.local, "element");
  assertEquals(result.prefix, undefined);
  assertEquals(result.uri, undefined);
});

Deno.test("parseName() parses prefixed name", () => {
  const result = parseName("ns:element");
  assertEquals(result.raw, "ns:element");
  assertEquals(result.local, "element");
  assertEquals(result.prefix, "ns");
  assertEquals(result.uri, undefined);
});

Deno.test("parseName() parses prefixed name with URI", () => {
  const result = parseName("ns:element", "http://example.com");
  assertEquals(result.raw, "ns:element");
  assertEquals(result.local, "element");
  assertEquals(result.prefix, "ns");
  assertEquals(result.uri, "http://example.com");
});

Deno.test("parseName() does not include URI for unprefixed name", () => {
  const result = parseName("element", "http://example.com");
  // parseName doesn't use URI for unprefixed names
  assertEquals(result.raw, "element");
  assertEquals(result.local, "element");
  assertEquals(result.prefix, undefined);
});

// =============================================================================
// Additional Coverage: validateXmlDeclaration Edge Cases
// =============================================================================

Deno.test("validateXmlDeclaration() rejects version with non-digit character", () => {
  // Tests line 82-84: version like "1.0a" where non-digit appears after digits
  const result = validateXmlDeclaration('version="1.0a"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "Invalid version '1.0a': must match '1.' followed by digits",
    );
  }
});

Deno.test("validateXmlDeclaration() accepts encoding starting with lowercase", () => {
  // Tests line 104: encoding name starting with lowercase letter
  const result = validateXmlDeclaration('version="1.0" encoding="utf-8"');
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.encoding, "utf-8");
  }
});

Deno.test("validateXmlDeclaration() accepts encoding with mixed case and special chars", () => {
  // Tests line 113: encoding with various valid characters (letters, digits, ., _, -)
  const result = validateXmlDeclaration(
    'version="1.0" encoding="Shift_JIS-2004"',
  );
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.encoding, "Shift_JIS-2004");
  }
});

Deno.test("validateXmlDeclaration() handles leading whitespace", () => {
  // Tests lines 179-181: leading whitespace in declaration content
  const result = validateXmlDeclaration('   version="1.0"');
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.version, "1.0");
  }
});

Deno.test("validateXmlDeclaration() handles trailing whitespace only", () => {
  // Tests lines 196-199: empty name after whitespace (trailing whitespace)
  const result = validateXmlDeclaration('version="1.0"   ');
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.version, "1.0");
  }
});

Deno.test("validateXmlDeclaration() handles whitespace around = in attributes", () => {
  // Tests lines 276-278: whitespace after = in attribute
  const result = validateXmlDeclaration('version = "1.0" encoding =  "UTF-8"');
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.version, "1.0");
    assertEquals(result.encoding, "UTF-8");
  }
});

Deno.test("validateXmlDeclaration() rejects Encoding (mixed case)", () => {
  // Tests line 246-247: Encoding mixed case variant
  const result = validateXmlDeclaration('version="1.0" Encoding="UTF-8"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "'Encoding' must be lowercase in XML declaration",
    );
  }
});

Deno.test("validateXmlDeclaration() rejects Standalone (mixed case)", () => {
  // Tests line 247: Standalone mixed case variant
  const result = validateXmlDeclaration('version="1.0" Standalone="yes"');
  assertEquals(result.valid, false);
  if (!result.valid) {
    assertEquals(
      result.error,
      "'Standalone' must be lowercase in XML declaration",
    );
  }
});

// =============================================================================
// Additional Coverage: isReservedPiTarget
// =============================================================================

import { isReservedPiTarget } from "./_common.ts";

Deno.test("isReservedPiTarget() returns true for 'xml'", () => {
  assertEquals(isReservedPiTarget("xml"), true);
});

Deno.test("isReservedPiTarget() returns true for 'XML'", () => {
  assertEquals(isReservedPiTarget("XML"), true);
});

Deno.test("isReservedPiTarget() returns true for mixed case 'Xml'", () => {
  assertEquals(isReservedPiTarget("Xml"), true);
  assertEquals(isReservedPiTarget("xMl"), true);
  assertEquals(isReservedPiTarget("xML"), true);
});

Deno.test("isReservedPiTarget() returns false for other targets", () => {
  assertEquals(isReservedPiTarget("target"), false);
  assertEquals(isReservedPiTarget("xmlfoo"), false); // starts with xml but longer
  assertEquals(isReservedPiTarget("xm"), false); // too short
  assertEquals(isReservedPiTarget(""), false);
});

// =============================================================================
// XML 1.1 Namespace Unbinding Tests
// =============================================================================

Deno.test("validateNamespaceBinding() xml11 allows prefix unbinding", () => {
  const error = validateNamespaceBinding("xmlns:ns", "", true);
  assertEquals(error, null);
});

Deno.test("validateNamespaceBinding() xml11 still rejects xmlns prefix declaration", () => {
  const error = validateNamespaceBinding(
    "xmlns:xmlns",
    "http://example.com",
    true,
  );
  assertEquals(typeof error, "string");
});

Deno.test("validateNamespaceBinding() xml11 still validates xml prefix binding", () => {
  const error = validateNamespaceBinding(
    "xmlns:xml",
    "http://wrong.example.com",
    true,
  );
  assertEquals(typeof error, "string");
});

// =============================================================================
// LINE_ENDING_REGEXP Tests
// =============================================================================

Deno.test("LINE_ENDING_REGEXP 1.0 normalizes \\r\\n to \\n", () => {
  assertEquals("a\r\nb".replace(LINE_ENDING_REGEXP["1.0"], "\n"), "a\nb");
});

Deno.test("LINE_ENDING_REGEXP 1.0 normalizes standalone \\r to \\n", () => {
  assertEquals("a\rb".replace(LINE_ENDING_REGEXP["1.0"], "\n"), "a\nb");
});

Deno.test("LINE_ENDING_REGEXP 1.0 does not normalize NEL or LS", () => {
  assertEquals("a\x85b".replace(LINE_ENDING_REGEXP["1.0"], "\n"), "a\x85b");
  assertEquals("a\u2028b".replace(LINE_ENDING_REGEXP["1.0"], "\n"), "a\u2028b");
});

Deno.test("LINE_ENDING_REGEXP 1.1 normalizes \\r\\n to \\n", () => {
  assertEquals("a\r\nb".replace(LINE_ENDING_REGEXP["1.1"], "\n"), "a\nb");
});

Deno.test("LINE_ENDING_REGEXP 1.1 normalizes standalone \\r to \\n", () => {
  assertEquals("a\rb".replace(LINE_ENDING_REGEXP["1.1"], "\n"), "a\nb");
});

Deno.test("LINE_ENDING_REGEXP 1.1 normalizes NEL to \\n", () => {
  assertEquals("a\x85b".replace(LINE_ENDING_REGEXP["1.1"], "\n"), "a\nb");
});

Deno.test("LINE_ENDING_REGEXP 1.1 normalizes \\r\\x85 to single \\n", () => {
  assertEquals("a\r\x85b".replace(LINE_ENDING_REGEXP["1.1"], "\n"), "a\nb");
});

Deno.test("LINE_ENDING_REGEXP 1.1 normalizes LS (U+2028) to \\n", () => {
  assertEquals("a\u2028b".replace(LINE_ENDING_REGEXP["1.1"], "\n"), "a\nb");
});

// =============================================================================
// validatePubidLiteral Tests
// =============================================================================

Deno.test("validatePubidLiteral() accepts valid characters", () => {
  assertEquals(
    validatePubidLiteral("-//OASIS//DTD DocBook V4.5//EN", '"'),
    null,
  );
});

Deno.test("validatePubidLiteral() accepts empty string", () => {
  assertEquals(validatePubidLiteral("", '"'), null);
});

Deno.test("validatePubidLiteral() accepts all special PubidChars", () => {
  assertEquals(
    validatePubidLiteral("-()+,./:=?;!*#@$_%", '"'),
    null,
  );
});

Deno.test("validatePubidLiteral() accepts single quote inside double-quoted literal", () => {
  assertEquals(validatePubidLiteral("it's", '"'), null);
});

Deno.test("validatePubidLiteral() rejects single quote inside single-quoted literal", () => {
  const error = validatePubidLiteral("it's", "'");
  assertEquals(typeof error, "string");
});

Deno.test("validatePubidLiteral() rejects invalid character", () => {
  const error = validatePubidLiteral("hello\x7F", '"');
  assertEquals(typeof error, "string");
});

// =============================================================================
// isIllegalXmlLiteralChar Tests
// =============================================================================

Deno.test("isIllegalXmlLiteralChar() xml10 rejects NULL", () => {
  assertEquals(isIllegalXmlLiteralChar(0x00, false), true);
});

Deno.test("isIllegalXmlLiteralChar() xml10 rejects C0 controls except TAB/LF/CR", () => {
  assertEquals(isIllegalXmlLiteralChar(0x01, false), true);
  assertEquals(isIllegalXmlLiteralChar(0x08, false), true);
  assertEquals(isIllegalXmlLiteralChar(0x0B, false), true);
  assertEquals(isIllegalXmlLiteralChar(0x0C, false), true);
  assertEquals(isIllegalXmlLiteralChar(0x0E, false), true);
  assertEquals(isIllegalXmlLiteralChar(0x1F, false), true);
});

Deno.test("isIllegalXmlLiteralChar() xml10 allows TAB, LF, CR", () => {
  assertEquals(isIllegalXmlLiteralChar(0x09, false), false);
  assertEquals(isIllegalXmlLiteralChar(0x0A, false), false);
  assertEquals(isIllegalXmlLiteralChar(0x0D, false), false);
});

Deno.test("isIllegalXmlLiteralChar() xml10 rejects noncharacters", () => {
  assertEquals(isIllegalXmlLiteralChar(0xFFFE, false), true);
  assertEquals(isIllegalXmlLiteralChar(0xFFFF, false), true);
});

Deno.test("isIllegalXmlLiteralChar() xml10 allows normal characters", () => {
  assertEquals(isIllegalXmlLiteralChar(0x20, false), false);
  assertEquals(isIllegalXmlLiteralChar(0x41, false), false);
  assertEquals(isIllegalXmlLiteralChar(0x7F, false), false);
});

Deno.test("isIllegalXmlLiteralChar() xml11 rejects NULL", () => {
  assertEquals(isIllegalXmlLiteralChar(0x00, true), true);
});

Deno.test("isIllegalXmlLiteralChar() xml11 restricts C0 controls (literal only)", () => {
  assertEquals(isIllegalXmlLiteralChar(0x01, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x08, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x0B, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x0C, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x0E, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x1F, true), true);
});

Deno.test("isIllegalXmlLiteralChar() xml11 allows TAB, LF, CR", () => {
  assertEquals(isIllegalXmlLiteralChar(0x09, true), false);
  assertEquals(isIllegalXmlLiteralChar(0x0A, true), false);
  assertEquals(isIllegalXmlLiteralChar(0x0D, true), false);
});

Deno.test("isIllegalXmlLiteralChar() xml11 restricts C1 controls except NEL", () => {
  assertEquals(isIllegalXmlLiteralChar(0x7F, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x80, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x84, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x86, true), true);
  assertEquals(isIllegalXmlLiteralChar(0x9F, true), true);
});

Deno.test("isIllegalXmlLiteralChar() xml11 allows NEL (U+0085)", () => {
  assertEquals(isIllegalXmlLiteralChar(0x85, true), false);
});

Deno.test("isIllegalXmlLiteralChar() xml11 rejects noncharacters", () => {
  assertEquals(isIllegalXmlLiteralChar(0xFFFE, true), true);
  assertEquals(isIllegalXmlLiteralChar(0xFFFF, true), true);
});

Deno.test("isIllegalXmlLiteralChar() xml11 allows normal characters", () => {
  assertEquals(isIllegalXmlLiteralChar(0x20, true), false);
  assertEquals(isIllegalXmlLiteralChar(0x41, true), false);
  assertEquals(isIllegalXmlLiteralChar(0xA0, true), false);
});
