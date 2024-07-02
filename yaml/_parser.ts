// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { YamlError } from "./_error.ts";
import { Mark } from "./_mark.ts";
import { DEFAULT_SCHEMA, type Schema, type TypeMap } from "./_schema.ts";
import type { Type } from "./_type.ts";
import * as common from "./_utils.ts";

export interface ParserOptions {
  legacy?: boolean;
  /** specifies a schema to use. */
  schema?: Schema;
  /** compatibility with JSON.parse behaviour. */
  json?: boolean;
  /** function to call on warning messages. */
  onWarning?(this: null, e?: YamlError): void;
}

// deno-lint-ignore no-explicit-any
export type ResultType = any[] | Record<string, any> | string;

type Any = common.Any;
type ArrayObject<T = Any> = common.ArrayObject<T>;

const CONTEXT_FLOW_IN = 1;
const CONTEXT_FLOW_OUT = 2;
const CONTEXT_BLOCK_IN = 3;
const CONTEXT_BLOCK_OUT = 4;

const CHOMPING_CLIP = 1;
const CHOMPING_STRIP = 2;
const CHOMPING_KEEP = 3;

const PATTERN_NON_PRINTABLE =
  // deno-lint-ignore no-control-regex
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
const PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
const PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
const PATTERN_TAG_URI =
  /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;

function _class(obj: unknown): string {
  return Object.prototype.toString.call(obj);
}

function isEOL(c: number): boolean {
  return c === 0x0a || /* LF */ c === 0x0d /* CR */;
}

function isWhiteSpace(c: number): boolean {
  return c === 0x09 || /* Tab */ c === 0x20 /* Space */;
}

function isWsOrEol(c: number): boolean {
  return (
    c === 0x09 /* Tab */ ||
    c === 0x20 /* Space */ ||
    c === 0x0a /* LF */ ||
    c === 0x0d /* CR */
  );
}

function isFlowIndicator(c: number): boolean {
  return (
    c === 0x2c /* , */ ||
    c === 0x5b /* [ */ ||
    c === 0x5d /* ] */ ||
    c === 0x7b /* { */ ||
    c === 0x7d /* } */
  );
}

function fromHexCode(c: number): number {
  if (0x30 <= /* 0 */ c && c <= 0x39 /* 9 */) {
    return c - 0x30;
  }

  const lc = c | 0x20;

  if (0x61 <= /* a */ lc && lc <= 0x66 /* f */) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c: number): number {
  if (c === 0x78 /* x */) {
    return 2;
  }
  if (c === 0x75 /* u */) {
    return 4;
  }
  if (c === 0x55 /* U */) {
    return 8;
  }
  return 0;
}

function fromDecimalCode(c: number): number {
  if (0x30 <= /* 0 */ c && c <= 0x39 /* 9 */) {
    return c - 0x30;
  }

  return -1;
}

function charFromCodepoint(c: number): string {
  if (c <= 0xffff) {
    return String.fromCharCode(c);
  }
  // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xd800,
    ((c - 0x010000) & 0x03ff) + 0xdc00,
  );
}

const escapeMap = new Map<number, string>([
  [0x30, "\x00"], // 0
  [0x61, "\x07"], // a
  [0x62, "\x08"], // b
  [0x74, "\x09"], // t
  [0x09, "\x09"], // Tab
  [0x6e, "\x0A"], // n
  [0x76, "\x0B"], // v
  [0x66, "\x0C"], // f
  [0x72, "\x0D"], // r
  [0x65, "\x1B"], // e
  [0x20, " "], // Space
  [0x22, "\x22"], // "
  [0x2f, "/"], // /
  [0x5c, "\x5C"], // \
  [0x4e, "\x85"], // N
  [0x5f, "\xA0"], // _
  [0x4c, "\u2028"], // L
  [0x50, "\u2029"], // P
]);

class Parser {
  schema: Schema;
  #input: string = "";
  #documents: Any[] = [];
  #length: number = 0;
  #lineIndent = 0;
  #lineStart = 0;
  #position = 0;
  #line = 0;
  onWarning?: (...args: Any[]) => void;
  legacy: boolean;
  json: boolean;
  #implicitTypes: Type[];
  #typeMap: TypeMap;

  #version?: string | null;
  #checkLineBreaks?: boolean;
  #tagMap: ArrayObject = Object.create(null);
  #anchorMap: ArrayObject = Object.create(null);
  #tag?: string | null;
  #anchor?: string | null;
  #kind?: string | null;
  #result: ResultType | null = "";

  constructor({
    schema = DEFAULT_SCHEMA,
    onWarning,
    legacy = false,
    json = false,
  }: ParserOptions) {
    this.schema = schema;
    this.onWarning = onWarning;
    this.legacy = legacy;
    this.json = json;

    this.#implicitTypes = (this.schema as Schema).compiledImplicit;
    this.#typeMap = (this.schema as Schema).compiledTypeMap;
  }

  #yamlDirectiveHandler(...args: string[]) {
    if (this.#version !== null) {
      return this.throwError("duplication of %YAML directive");
    }

    if (args.length !== 1) {
      return this.throwError("YAML directive accepts exactly one argument");
    }

    const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]!);
    if (match === null) {
      return this.throwError("ill-formed argument of the YAML directive");
    }

    const major = parseInt(match[1]!, 10);
    const minor = parseInt(match[2]!, 10);
    if (major !== 1) {
      return this.throwError("unacceptable YAML version of the document");
    }

    this.#version = args[0];
    this.#checkLineBreaks = minor < 2;
    if (minor !== 1 && minor !== 2) {
      return this.#throwWarning("unsupported YAML version of the document");
    }
  }

  #tagDirectiveHandler(...args: string[]) {
    if (args.length !== 2) {
      return this.throwError("TAG directive accepts exactly two arguments");
    }

    const handle = args[0]!;
    const prefix = args[1]!;

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      return this.throwError(
        "ill-formed tag handle (first argument) of the TAG directive",
      );
    }

    if (Object.hasOwn(this.#tagMap, handle)) {
      return this.throwError(
        `there is a previously declared suffix for "${handle}" tag handle`,
      );
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      return this.throwError(
        "ill-formed tag prefix (second argument) of the TAG directive",
      );
    }

    this.#tagMap[handle] = prefix;
  }

  #generateError(message: string): YamlError {
    return new YamlError(
      message,
      new Mark(
        this.#input,
        this.#position,
        this.#line,
        this.#position - this.#lineStart,
      ),
    );
  }
  throwError(message: string): never {
    throw this.#generateError(message);
  }
  #throwWarning(message: string) {
    if (this.onWarning) {
      this.onWarning.call(null, this.#generateError(message));
    }
  }
  #writeFoldedLines(count: number) {
    if (count === 1) {
      this.#result += " ";
    } else if (count > 1) {
      this.#result += common.repeat("\n", count - 1);
    }
  }
  #composeNode(
    parentIndent: number,
    nodeContext: number,
    allowToSeek: boolean,
    allowCompact: boolean,
  ): boolean {
    let allowBlockScalars: boolean;
    let allowBlockCollections: boolean;
    let indentStatus = 1; // 1: this>parent, 0: this=parent, -1: this<parent
    let atNewLine = false;
    let hasContent = false;
    let type: Type;
    let flowIndent: number;
    let blockIndent: number;

    this.#tag = null;
    this.#anchor = null;
    this.#kind = null;
    this.#result = null;

    const allowBlockStyles = (allowBlockScalars =
      allowBlockCollections =
        CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext);

    if (allowToSeek) {
      if (this.#skipSeparationSpace(true, -1)) {
        atNewLine = true;

        if (this.#lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (this.#lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (this.#lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }

    if (indentStatus === 1) {
      while (this.#readTagProperty() || this.#readAnchorProperty()) {
        if (this.#skipSeparationSpace(true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;

          if (this.#lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (this.#lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (this.#lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }

    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }

    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      const cond = CONTEXT_FLOW_IN === nodeContext ||
        CONTEXT_FLOW_OUT === nodeContext;
      flowIndent = cond ? parentIndent : parentIndent + 1;

      blockIndent = this.#position - this.#lineStart;

      if (indentStatus === 1) {
        if (
          (allowBlockCollections &&
            (this.#readBlockSequence(blockIndent) ||
              this.#readBlockMapping(blockIndent, flowIndent))) ||
          this.#readFlowCollection(flowIndent)
        ) {
          hasContent = true;
        } else {
          if (
            (allowBlockScalars && this.#readBlockScalar(flowIndent)) ||
            this.#readSingleQuotedScalar(flowIndent) ||
            this.#readDoubleQuotedScalar(flowIndent)
          ) {
            hasContent = true;
          } else if (this.#readAlias()) {
            hasContent = true;

            if (this.#tag !== null || this.#anchor !== null) {
              return this.throwError(
                "alias node should not have Any properties",
              );
            }
          } else if (
            this.#readPlainScalar(flowIndent, CONTEXT_FLOW_IN === nodeContext)
          ) {
            hasContent = true;

            if (this.#tag === null) {
              this.#tag = "?";
            }
          }

          if (this.#anchor !== null) {
            this.#anchorMap[this.#anchor] = this.#result;
          }
        }
      } else if (indentStatus === 0) {
        // Special case: block sequences are allowed to have same indentation level as the parent.
        // http://www.yaml.org/spec/1.2/spec.html#id2799784
        hasContent = allowBlockCollections &&
          this.#readBlockSequence(blockIndent);
      }
    }

    if (this.#tag !== null && this.#tag !== "!") {
      if (this.#tag === "?") {
        for (
          let typeIndex = 0;
          typeIndex < this.#implicitTypes.length;
          typeIndex++
        ) {
          type = this.#implicitTypes[typeIndex]!;

          // Implicit resolving is not allowed for non-scalar types, and '?'
          // non-specific tag is only assigned to plain scalars. So, it isn't
          // needed to check for 'kind' conformity.

          if (type.resolve(this.#result)) {
            // `this.result` updated in resolver if matched
            this.#result = type.construct(this.#result);
            this.#tag = type.tag;
            if (this.#anchor !== null) {
              this.#anchorMap[this.#anchor] = this.#result;
            }
            break;
          }
        }
      } else if (
        Object.hasOwn(this.#typeMap[this.#kind || "fallback"], this.#tag)
      ) {
        type = this.#typeMap[this.#kind || "fallback"][this.#tag]!;

        if (this.#result !== null && type.kind !== this.#kind) {
          return this.throwError(
            `unacceptable node kind for !<${this.#tag}> tag; it should be "${type.kind}", not "${this.#kind}"`,
          );
        }

        if (!type.resolve(this.#result)) {
          // `this.result` updated in resolver if matched
          return this.throwError(
            `cannot resolve a node with !<${this.#tag}> explicit tag`,
          );
        } else {
          this.#result = type.construct(this.#result);
          if (this.#anchor !== null) {
            this.#anchorMap[this.#anchor] = this.#result;
          }
        }
      } else {
        return this.throwError(`unknown tag !<${this.#tag}>`);
      }
    }

    return this.#tag !== null || this.#anchor !== null || hasContent;
  }

  #captureSegment(
    start: number,
    end: number,
    checkJson: boolean,
  ) {
    let result: string;
    if (start < end) {
      result = this.#input.slice(start, end);

      if (checkJson) {
        for (
          let position = 0;
          position < result.length;
          position++
        ) {
          const character = result.charCodeAt(position);
          if (
            !(character === 0x09 ||
              (0x20 <= character && character <= 0x10ffff))
          ) {
            return this.throwError("expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(result)) {
        return this.throwError("the stream contains non-printable characters");
      }

      this.#result += result;
    }
  }

  #mergeMappings(
    destination: ArrayObject,
    source: ArrayObject,
    overridableKeys: ArrayObject<boolean>,
  ) {
    if (!common.isObject(source)) {
      return this.throwError(
        "cannot merge mappings; the provided source object is unacceptable",
      );
    }

    for (const key of Object.keys(source)) {
      if (!Object.hasOwn(destination, key)) {
        Object.defineProperty(destination, key, {
          value: source[key],
          writable: true,
          enumerable: true,
          configurable: true,
        });
        overridableKeys[key] = true;
      }
    }
  }

  #storeMappingPair(
    result: ArrayObject | null,
    overridableKeys: ArrayObject<boolean>,
    keyTag: string | null,
    keyNode: Any,
    valueNode: unknown,
    startLine?: number,
    startPos?: number,
  ): ArrayObject {
    // The output is a plain object here, so keys can only be strings.
    // We need to convert keyNode to a string, but doing so can hang the process
    // (deeply nested arrays that explode exponentially using aliases).
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);

      for (let index = 0; index < keyNode.length; index++) {
        if (Array.isArray(keyNode[index])) {
          return this.throwError(
            "nested arrays are not supported inside keys",
          );
        }

        if (
          typeof keyNode === "object" &&
          _class(keyNode[index]) === "[object Object]"
        ) {
          keyNode[index] = "[object Object]";
        }
      }
    }

    // Avoid code execution in load() via toString property
    // (still use its own toString for arrays, timestamps,
    // and whatever user schema extensions happen to have @@toStringTag)
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }

    keyNode = String(keyNode);

    if (result === null) {
      result = {};
    }

    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        for (
          let index = 0;
          index < valueNode.length;
          index++
        ) {
          this.#mergeMappings(result, valueNode[index], overridableKeys);
        }
      } else {
        this.#mergeMappings(result, valueNode as ArrayObject, overridableKeys);
      }
    } else {
      if (
        !this.json &&
        !Object.hasOwn(overridableKeys, keyNode) &&
        Object.hasOwn(result, keyNode)
      ) {
        this.#line = startLine || this.#line;
        this.#position = startPos || this.#position;
        return this.throwError("duplicated mapping key");
      }
      Object.defineProperty(result, keyNode, {
        value: valueNode,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      delete overridableKeys[keyNode];
    }

    return result;
  }

  #readLineBreak() {
    const ch = this.#input.charCodeAt(this.#position);

    if (ch === 0x0a /* LF */) {
      this.#position++;
    } else if (ch === 0x0d /* CR */) {
      this.#position++;
      if (this.#input.charCodeAt(this.#position) === 0x0a /* LF */) {
        this.#position++;
      }
    } else {
      return this.throwError("a line break is expected");
    }

    this.#line += 1;
    this.#lineStart = this.#position;
  }

  #skipSeparationSpace(
    allowComments: boolean,
    checkIndent: number,
  ): number {
    let lineBreaks = 0;
    let ch = this.#input.charCodeAt(this.#position);

    while (ch !== 0) {
      while (isWhiteSpace(ch)) {
        ch = this.#input.charCodeAt(++this.#position);
      }

      if (allowComments && ch === 0x23 /* # */) {
        do {
          ch = this.#input.charCodeAt(++this.#position);
        } while (ch !== 0x0a && /* LF */ ch !== 0x0d && /* CR */ ch !== 0);
      }

      if (isEOL(ch)) {
        this.#readLineBreak();

        ch = this.#input.charCodeAt(this.#position);
        lineBreaks++;
        this.#lineIndent = 0;

        while (ch === 0x20 /* Space */) {
          this.#lineIndent++;
          ch = this.#input.charCodeAt(++this.#position);
        }
      } else {
        break;
      }
    }

    if (
      checkIndent !== -1 &&
      lineBreaks !== 0 &&
      this.#lineIndent < checkIndent
    ) {
      this.#throwWarning("deficient indentation");
    }

    return lineBreaks;
  }

  #testDocumentSeparator(): boolean {
    let _position = this.#position;
    let ch = this.#input.charCodeAt(_position);

    // Condition parser.position === parser.lineStart is tested
    // in parent on each call, for efficiency. No needs to test here again.
    if (
      (ch === 0x2d || /* - */ ch === 0x2e) /* . */ &&
      ch === this.#input.charCodeAt(_position + 1) &&
      ch === this.#input.charCodeAt(_position + 2)
    ) {
      _position += 3;

      ch = this.#input.charCodeAt(_position);

      if (ch === 0 || isWsOrEol(ch)) {
        return true;
      }
    }

    return false;
  }

  #readPlainScalar(nodeIndent: number, withinFlowCollection: boolean): boolean {
    const kind = this.#kind;
    const result = this.#result;
    let ch = this.#input.charCodeAt(this.#position);

    if (
      isWsOrEol(ch) ||
      isFlowIndicator(ch) ||
      ch === 0x23 /* # */ ||
      ch === 0x26 /* & */ ||
      ch === 0x2a /* * */ ||
      ch === 0x21 /* ! */ ||
      ch === 0x7c /* | */ ||
      ch === 0x3e /* > */ ||
      ch === 0x27 /* ' */ ||
      ch === 0x22 /* " */ ||
      ch === 0x25 /* % */ ||
      ch === 0x40 /* @ */ ||
      ch === 0x60 /* ` */
    ) {
      return false;
    }

    let following: number;
    if (ch === 0x3f || /* ? */ ch === 0x2d /* - */) {
      following = this.#input.charCodeAt(this.#position + 1);

      if (
        isWsOrEol(following) ||
        (withinFlowCollection && isFlowIndicator(following))
      ) {
        return false;
      }
    }

    this.#kind = "scalar";
    this.#result = "";
    let captureEnd = this.#position;
    let captureStart = this.#position;
    let hasPendingContent = false;
    let line = 0;
    while (ch !== 0) {
      if (ch === 0x3a /* : */) {
        following = this.#input.charCodeAt(this.#position + 1);

        if (
          isWsOrEol(following) ||
          (withinFlowCollection && isFlowIndicator(following))
        ) {
          break;
        }
      } else if (ch === 0x23 /* # */) {
        const preceding = this.#input.charCodeAt(this.#position - 1);

        if (isWsOrEol(preceding)) {
          break;
        }
      } else if (
        (this.#position === this.#lineStart &&
          this.#testDocumentSeparator()) ||
        (withinFlowCollection && isFlowIndicator(ch))
      ) {
        break;
      } else if (isEOL(ch)) {
        line = this.#line;
        const lineStart = this.#lineStart;
        const lineIndent = this.#lineIndent;
        this.#skipSeparationSpace(false, -1);

        if (this.#lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = this.#input.charCodeAt(this.#position);
          continue;
        } else {
          this.#position = captureEnd;
          this.#line = line;
          this.#lineStart = lineStart;
          this.#lineIndent = lineIndent;
          break;
        }
      }

      if (hasPendingContent) {
        this.#captureSegment(captureStart, captureEnd, false);
        this.#writeFoldedLines(this.#line - line);
        captureStart = captureEnd = this.#position;
        hasPendingContent = false;
      }

      if (!isWhiteSpace(ch)) {
        captureEnd = this.#position + 1;
      }

      ch = this.#input.charCodeAt(++this.#position);
    }

    this.#captureSegment(captureStart, captureEnd, false);

    if (this.#result) {
      return true;
    }

    this.#kind = kind;
    this.#result = result;
    return false;
  }

  #readSingleQuotedScalar(nodeIndent: number): boolean {
    let ch;
    let captureStart;
    let captureEnd;

    ch = this.#input.charCodeAt(this.#position);

    if (ch !== 0x27 /* ' */) {
      return false;
    }

    this.#kind = "scalar";
    this.#result = "";
    this.#position++;
    captureStart = captureEnd = this.#position;

    while ((ch = this.#input.charCodeAt(this.#position)) !== 0) {
      if (ch === 0x27 /* ' */) {
        this.#captureSegment(captureStart, this.#position, true);
        ch = this.#input.charCodeAt(++this.#position);

        if (ch === 0x27 /* ' */) {
          captureStart = this.#position;
          this.#position++;
          captureEnd = this.#position;
        } else {
          return true;
        }
      } else if (isEOL(ch)) {
        this.#captureSegment(captureStart, captureEnd, true);
        this.#writeFoldedLines(
          this.#skipSeparationSpace(false, nodeIndent),
        );
        captureStart = captureEnd = this.#position;
      } else if (
        this.#position === this.#lineStart &&
        this.#testDocumentSeparator()
      ) {
        return this.throwError(
          "unexpected end of the document within a single quoted scalar",
        );
      } else {
        this.#position++;
        captureEnd = this.#position;
      }
    }

    return this.throwError(
      "unexpected end of the stream within a single quoted scalar",
    );
  }

  #readDoubleQuotedScalar(nodeIndent: number): boolean {
    let ch = this.#input.charCodeAt(this.#position);

    if (ch !== 0x22 /* " */) {
      return false;
    }

    this.#kind = "scalar";
    this.#result = "";
    this.#position++;
    let captureEnd = this.#position;
    let captureStart = this.#position;
    let tmp: number;
    while ((ch = this.#input.charCodeAt(this.#position)) !== 0) {
      if (ch === 0x22 /* " */) {
        this.#captureSegment(captureStart, this.#position, true);
        this.#position++;
        return true;
      }
      if (ch === 0x5c /* \ */) {
        this.#captureSegment(captureStart, this.#position, true);
        ch = this.#input.charCodeAt(++this.#position);

        if (isEOL(ch)) {
          this.#skipSeparationSpace(false, nodeIndent);

          // TODO(bartlomieju): rework to inline fn with no type cast?
        } else if (ch < 256 && escapeMap.has(ch)) {
          this.#result += escapeMap.get(ch);
          this.#position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          let hexLength = tmp;
          let hexResult = 0;

          for (; hexLength > 0; hexLength--) {
            ch = this.#input.charCodeAt(++this.#position);

            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              return this.throwError("expected hexadecimal character");
            }
          }

          this.#result += charFromCodepoint(hexResult);

          this.#position++;
        } else {
          return this.throwError("unknown escape sequence");
        }

        captureStart = captureEnd = this.#position;
      } else if (isEOL(ch)) {
        this.#captureSegment(captureStart, captureEnd, true);
        this.#writeFoldedLines(
          this.#skipSeparationSpace(false, nodeIndent),
        );
        captureStart = captureEnd = this.#position;
      } else if (
        this.#position === this.#lineStart &&
        this.#testDocumentSeparator()
      ) {
        return this.throwError(
          "unexpected end of the document within a double quoted scalar",
        );
      } else {
        this.#position++;
        captureEnd = this.#position;
      }
    }

    return this.throwError(
      "unexpected end of the stream within a double quoted scalar",
    );
  }

  #readFlowCollection(nodeIndent: number): boolean {
    let ch = this.#input.charCodeAt(this.#position);
    let terminator: number;
    let isMapping = true;
    let result: ResultType = {};
    if (ch === 0x5b /* [ */) {
      terminator = 0x5d; /* ] */
      isMapping = false;
      result = [];
    } else if (ch === 0x7b /* { */) {
      terminator = 0x7d; /* } */
    } else {
      return false;
    }

    if (this.#anchor !== null && typeof this.#anchor !== "undefined") {
      this.#anchorMap[this.#anchor] = result;
    }

    ch = this.#input.charCodeAt(++this.#position);

    const tag = this.#tag;
    const anchor = this.#anchor;
    let readNext = true;
    let valueNode = null;
    let keyNode = null;
    let keyTag: string | null = null;
    let isExplicitPair = false;
    let isPair = false;
    let following = 0;
    let line = 0;
    const overridableKeys: ArrayObject<boolean> = Object.create(null);
    while (ch !== 0) {
      this.#skipSeparationSpace(true, nodeIndent);

      ch = this.#input.charCodeAt(this.#position);

      if (ch === terminator) {
        this.#position++;
        this.#tag = tag;
        this.#anchor = anchor;
        this.#kind = isMapping ? "mapping" : "sequence";
        this.#result = result;
        return true;
      }
      if (!readNext) {
        return this.throwError("missed comma between flow collection entries");
      }

      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;

      if (ch === 0x3f /* ? */) {
        following = this.#input.charCodeAt(this.#position + 1);

        if (isWsOrEol(following)) {
          isPair = isExplicitPair = true;
          this.#position++;
          this.#skipSeparationSpace(true, nodeIndent);
        }
      }

      line = this.#line;
      this.#composeNode(nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = this.#tag || null;
      keyNode = this.#result;
      this.#skipSeparationSpace(true, nodeIndent);

      ch = this.#input.charCodeAt(this.#position);

      if ((isExplicitPair || this.#line === line) && ch === 0x3a /* : */) {
        isPair = true;
        ch = this.#input.charCodeAt(++this.#position);
        this.#skipSeparationSpace(true, nodeIndent);
        this.#composeNode(nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = this.#result;
      }

      if (isMapping) {
        this.#storeMappingPair(
          result,
          overridableKeys,
          keyTag,
          keyNode,
          valueNode,
        );
      } else if (isPair) {
        (result as ArrayObject[]).push(
          this.#storeMappingPair(
            null,
            overridableKeys,
            keyTag,
            keyNode,
            valueNode,
          ),
        );
      } else {
        (result as ResultType[]).push(keyNode as ResultType);
      }

      this.#skipSeparationSpace(true, nodeIndent);

      ch = this.#input.charCodeAt(this.#position);

      if (ch === 0x2c /* , */) {
        readNext = true;
        ch = this.#input.charCodeAt(++this.#position);
      } else {
        readNext = false;
      }
    }

    return this.throwError(
      "unexpected end of the stream within a flow collection",
    );
  }

  // Handles block scaler styles: e.g. '|', '>', '|-' and '>-'.
  // https://yaml.org/spec/1.2.2/#81-block-scalar-styles
  #readBlockScalar(nodeIndent: number): boolean {
    let chomping = CHOMPING_CLIP;
    let didReadContent = false;
    let detectedIndent = false;
    let textIndent = nodeIndent;
    let emptyLines = 0;
    let atMoreIndented = false;

    let ch = this.#input.charCodeAt(this.#position);

    let folding = false;
    if (ch === 0x7c /* | */) {
      folding = false;
    } else if (ch === 0x3e /* > */) {
      folding = true;
    } else {
      return false;
    }

    this.#kind = "scalar";
    this.#result = "";

    let tmp = 0;
    while (ch !== 0) {
      ch = this.#input.charCodeAt(++this.#position);

      if (ch === 0x2b || /* + */ ch === 0x2d /* - */) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 0x2b /* + */ ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          return this.throwError("repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          return this.throwError(
            "bad explicit indentation width of a block scalar; it cannot be less than one",
          );
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          return this.throwError("repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }

    if (isWhiteSpace(ch)) {
      do {
        ch = this.#input.charCodeAt(++this.#position);
      } while (isWhiteSpace(ch));

      if (ch === 0x23 /* # */) {
        do {
          ch = this.#input.charCodeAt(++this.#position);
        } while (!isEOL(ch) && ch !== 0);
      }
    }

    while (ch !== 0) {
      this.#readLineBreak();
      this.#lineIndent = 0;

      ch = this.#input.charCodeAt(this.#position);

      while (
        (!detectedIndent || this.#lineIndent < textIndent) &&
        ch === 0x20 /* Space */
      ) {
        this.#lineIndent++;
        ch = this.#input.charCodeAt(++this.#position);
      }

      if (!detectedIndent && this.#lineIndent > textIndent) {
        textIndent = this.#lineIndent;
      }

      if (isEOL(ch)) {
        emptyLines++;
        continue;
      }

      // End of the scalar.
      if (this.#lineIndent < textIndent) {
        // Perform the chomping.
        if (chomping === CHOMPING_KEEP) {
          this.#result += common.repeat(
            "\n",
            didReadContent ? 1 + emptyLines : emptyLines,
          );
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            // i.e. only if the scalar is not empty.
            this.#result += "\n";
          }
        }

        // Break this `while` cycle and go to the function's epilogue.
        break;
      }

      // Folded style: use fancy rules to handle line breaks.
      if (folding) {
        // Lines starting with white space characters (more-indented lines) are not folded.
        if (isWhiteSpace(ch)) {
          atMoreIndented = true;
          // except for the first content line (cf. Example 8.1)
          this.#result += common.repeat(
            "\n",
            didReadContent ? 1 + emptyLines : emptyLines,
          );

          // End of more-indented block.
        } else if (atMoreIndented) {
          atMoreIndented = false;
          this.#result += common.repeat("\n", emptyLines + 1);

          // Just one line break - perceive as the same line.
        } else if (emptyLines === 0) {
          if (didReadContent) {
            // i.e. only if we have already read some scalar content.
            this.#result += " ";
          }

          // Several line breaks - perceive as different lines.
        } else {
          this.#result += common.repeat("\n", emptyLines);
        }

        // Literal style: just add exact number of line breaks between content lines.
      } else {
        // Keep all line breaks except the header line break.
        this.#result += common.repeat(
          "\n",
          didReadContent ? 1 + emptyLines : emptyLines,
        );
      }

      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      const captureStart = this.#position;

      while (!isEOL(ch) && ch !== 0) {
        ch = this.#input.charCodeAt(++this.#position);
      }

      this.#captureSegment(captureStart, this.#position, false);
    }

    return true;
  }

  #readBlockSequence(nodeIndent: number): boolean {
    let line: number;
    let following: number;
    let detected = false;
    let ch: number;
    const tag = this.#tag;
    const anchor = this.#anchor;
    const result: unknown[] = [];

    if (this.#anchor !== null && typeof this.#anchor !== "undefined") {
      this.#anchorMap[this.#anchor] = result;
    }

    ch = this.#input.charCodeAt(this.#position);

    while (ch !== 0) {
      if (ch !== 0x2d /* - */) {
        break;
      }

      following = this.#input.charCodeAt(this.#position + 1);

      if (!isWsOrEol(following)) {
        break;
      }

      detected = true;
      this.#position++;

      if (this.#skipSeparationSpace(true, -1)) {
        if (this.#lineIndent <= nodeIndent) {
          result.push(null);
          ch = this.#input.charCodeAt(this.#position);
          continue;
        }
      }

      line = this.#line;
      this.#composeNode(nodeIndent, CONTEXT_BLOCK_IN, false, true);
      result.push(this.#result);
      this.#skipSeparationSpace(true, -1);

      ch = this.#input.charCodeAt(this.#position);

      if ((this.#line === line || this.#lineIndent > nodeIndent) && ch !== 0) {
        return this.throwError("bad indentation of a sequence entry");
      } else if (this.#lineIndent < nodeIndent) {
        break;
      }
    }

    if (detected) {
      this.#tag = tag;
      this.#anchor = anchor;
      this.#kind = "sequence";
      this.#result = result;
      return true;
    }
    return false;
  }

  #readBlockMapping(nodeIndent: number, flowIndent: number): boolean {
    const tag = this.#tag;
    const anchor = this.#anchor;
    const result = {};
    const overridableKeys = Object.create(null);
    let following: number;
    let allowCompact = false;
    let line: number;
    let pos: number;
    let keyTag = null;
    let keyNode = null;
    let valueNode = null;
    let atExplicitKey = false;
    let detected = false;
    let ch: number;

    if (this.#anchor !== null && typeof this.#anchor !== "undefined") {
      this.#anchorMap[this.#anchor] = result;
    }

    ch = this.#input.charCodeAt(this.#position);

    while (ch !== 0) {
      following = this.#input.charCodeAt(this.#position + 1);
      line = this.#line; // Save the current line.
      pos = this.#position;

      //
      // Explicit notation case. There are two separate blocks:
      // first for the key (denoted by "?") and second for the value (denoted by ":")
      //
      if (
        (ch === 0x3f || /* ? */ ch === 0x3a) && /* : */ isWsOrEol(following)
      ) {
        if (ch === 0x3f /* ? */) {
          if (atExplicitKey) {
            this.#storeMappingPair(
              result,
              overridableKeys,
              keyTag as string,
              keyNode,
              null,
            );
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          // i.e. 0x3A/* : */ === character after the explicit key.
          atExplicitKey = false;
          allowCompact = true;
        } else {
          return this.throwError(
            "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line",
          );
        }

        this.#position += 1;
        ch = following;

        //
        // Implicit notation case. Flow-style node as the key first, then ":", and the value.
        //
      } else if (
        this.#composeNode(flowIndent, CONTEXT_FLOW_OUT, false, true)
      ) {
        if (this.#line === line) {
          ch = this.#input.charCodeAt(this.#position);

          while (isWhiteSpace(ch)) {
            ch = this.#input.charCodeAt(++this.#position);
          }

          if (ch === 0x3a /* : */) {
            ch = this.#input.charCodeAt(++this.#position);

            if (!isWsOrEol(ch)) {
              return this.throwError(
                "a whitespace character is expected after the key-value separator within a block mapping",
              );
            }

            if (atExplicitKey) {
              this.#storeMappingPair(
                result,
                overridableKeys,
                keyTag as string,
                keyNode,
                null,
              );
              keyTag = keyNode = valueNode = null;
            }

            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = this.#tag;
            keyNode = this.#result;
          } else if (detected) {
            return this.throwError(
              "can not read an implicit mapping pair; a colon is missed",
            );
          } else {
            this.#tag = tag;
            this.#anchor = anchor;
            return true; // Keep the result of `composeNode`.
          }
        } else if (detected) {
          return this.throwError(
            "can not read a block mapping entry; a multiline key may not be an implicit key",
          );
        } else {
          this.#tag = tag;
          this.#anchor = anchor;
          return true; // Keep the result of `composeNode`.
        }
      } else {
        break; // Reading is done. Go to the epilogue.
      }

      //
      // Common reading code for both explicit and implicit notations.
      //
      if (this.#line === line || this.#lineIndent > nodeIndent) {
        if (
          this.#composeNode(nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)
        ) {
          if (atExplicitKey) {
            keyNode = this.#result;
          } else {
            valueNode = this.#result;
          }
        }

        if (!atExplicitKey) {
          this.#storeMappingPair(
            result,
            overridableKeys,
            keyTag as string,
            keyNode,
            valueNode,
            line,
            pos,
          );
          keyTag = keyNode = valueNode = null;
        }

        this.#skipSeparationSpace(true, -1);
        ch = this.#input.charCodeAt(this.#position);
      }

      if (this.#lineIndent > nodeIndent && ch !== 0) {
        return this.throwError("bad indentation of a mapping entry");
      } else if (this.#lineIndent < nodeIndent) {
        break;
      }
    }

    //
    // Epilogue.
    //

    // Special case: last mapping's node contains only the key in explicit notation.
    if (atExplicitKey) {
      this.#storeMappingPair(
        result,
        overridableKeys,
        keyTag as string,
        keyNode,
        null,
      );
    }

    // Expose the resulting mapping.
    if (detected) {
      this.#tag = tag;
      this.#anchor = anchor;
      this.#kind = "mapping";
      this.#result = result;
    }

    return detected;
  }

  #readTagProperty(): boolean {
    let position: number;
    let isVerbatim = false;
    let isNamed = false;
    let tagHandle = "";
    let tagName: string;
    let ch: number;

    ch = this.#input.charCodeAt(this.#position);

    if (ch !== 0x21 /* ! */) return false;

    if (this.#tag !== null) {
      return this.throwError("duplication of a tag property");
    }

    ch = this.#input.charCodeAt(++this.#position);

    if (ch === 0x3c /* < */) {
      isVerbatim = true;
      ch = this.#input.charCodeAt(++this.#position);
    } else if (ch === 0x21 /* ! */) {
      isNamed = true;
      tagHandle = "!!";
      ch = this.#input.charCodeAt(++this.#position);
    } else {
      tagHandle = "!";
    }

    position = this.#position;

    if (isVerbatim) {
      do {
        ch = this.#input.charCodeAt(++this.#position);
      } while (ch !== 0 && ch !== 0x3e /* > */);

      if (this.#position < this.#length) {
        tagName = this.#input.slice(position, this.#position);
        ch = this.#input.charCodeAt(++this.#position);
      } else {
        return this.throwError(
          "unexpected end of the stream within a verbatim tag",
        );
      }
    } else {
      while (ch !== 0 && !isWsOrEol(ch)) {
        if (ch === 0x21 /* ! */) {
          if (!isNamed) {
            tagHandle = this.#input.slice(position - 1, this.#position + 1);

            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              return this.throwError(
                "named tag handle cannot contain such characters",
              );
            }

            isNamed = true;
            position = this.#position + 1;
          } else {
            return this.throwError(
              "tag suffix cannot contain exclamation marks",
            );
          }
        }

        ch = this.#input.charCodeAt(++this.#position);
      }

      tagName = this.#input.slice(position, this.#position);

      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        return this.throwError(
          "tag suffix cannot contain flow indicator characters",
        );
      }
    }

    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      return this.throwError(
        `tag name cannot contain such characters: ${tagName}`,
      );
    }

    if (isVerbatim) {
      this.#tag = tagName;
    } else if (Object.hasOwn(this.#tagMap, tagHandle)) {
      this.#tag = this.#tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      this.#tag = `!${tagName}`;
    } else if (tagHandle === "!!") {
      this.#tag = `tag:yaml.org,2002:${tagName}`;
    } else {
      return this.throwError(`undeclared tag handle "${tagHandle}"`);
    }

    return true;
  }

  #readAnchorProperty(): boolean {
    let ch = this.#input.charCodeAt(this.#position);
    if (ch !== 0x26 /* & */) return false;

    if (this.#anchor !== null) {
      return this.throwError("duplication of an anchor property");
    }
    ch = this.#input.charCodeAt(++this.#position);

    const position = this.#position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = this.#input.charCodeAt(++this.#position);
    }

    if (this.#position === position) {
      return this.throwError(
        "name of an anchor node must contain at least one character",
      );
    }

    this.#anchor = this.#input.slice(position, this.#position);
    return true;
  }

  #readAlias(): boolean {
    let ch = this.#input.charCodeAt(this.#position);

    if (ch !== 0x2a /* * */) return false;

    ch = this.#input.charCodeAt(++this.#position);
    const _position = this.#position;

    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = this.#input.charCodeAt(++this.#position);
    }

    if (this.#position === _position) {
      return this.throwError(
        "name of an alias node must contain at least one character",
      );
    }

    const alias = this.#input.slice(_position, this.#position);
    if (!Object.hasOwn(this.#anchorMap, alias)) {
      return this.throwError(`unidentified alias "${alias}"`);
    }

    this.#result = this.#anchorMap[alias];
    this.#skipSeparationSpace(true, -1);
    return true;
  }
  #readDocument() {
    const documentStart = this.#position;
    let position: number;
    let directiveName: string;
    let directiveArgs: string[];
    let hasDirectives = false;
    let ch: number;

    this.#version = null;
    this.#checkLineBreaks = this.legacy;
    this.#tagMap = Object.create(null);
    this.#anchorMap = Object.create(null);

    while ((ch = this.#input.charCodeAt(this.#position)) !== 0) {
      this.#skipSeparationSpace(true, -1);

      ch = this.#input.charCodeAt(this.#position);

      if (this.#lineIndent > 0 || ch !== 0x25 /* % */) {
        break;
      }

      hasDirectives = true;
      ch = this.#input.charCodeAt(++this.#position);
      position = this.#position;

      while (ch !== 0 && !isWsOrEol(ch)) {
        ch = this.#input.charCodeAt(++this.#position);
      }

      directiveName = this.#input.slice(position, this.#position);
      directiveArgs = [];

      if (directiveName.length < 1) {
        return this.throwError(
          "directive name must not be less than one character in length",
        );
      }

      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          ch = this.#input.charCodeAt(++this.#position);
        }

        if (ch === 0x23 /* # */) {
          do {
            ch = this.#input.charCodeAt(++this.#position);
          } while (ch !== 0 && !isEOL(ch));
          break;
        }

        if (isEOL(ch)) break;

        position = this.#position;

        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = this.#input.charCodeAt(++this.#position);
        }

        directiveArgs.push(this.#input.slice(position, this.#position));
      }

      if (ch !== 0) this.#readLineBreak();

      switch (directiveName) {
        case "YAML":
          this.#yamlDirectiveHandler(...directiveArgs);
          break;
        case "TAG":
          this.#tagDirectiveHandler(...directiveArgs);
          break;
        default:
          this.#throwWarning(`unknown document directive "${directiveName}"`);
      }
    }

    this.#skipSeparationSpace(true, -1);

    if (
      this.#lineIndent === 0 &&
      this.#input.charCodeAt(this.#position) === 0x2d /* - */ &&
      this.#input.charCodeAt(this.#position + 1) === 0x2d /* - */ &&
      this.#input.charCodeAt(this.#position + 2) === 0x2d /* - */
    ) {
      this.#position += 3;
      this.#skipSeparationSpace(true, -1);
    } else if (hasDirectives) {
      return this.throwError("directives end mark is expected");
    }

    this.#composeNode(this.#lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    this.#skipSeparationSpace(true, -1);

    if (
      this.#checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(
        this.#input.slice(documentStart, this.#position),
      )
    ) {
      this.#throwWarning("non-ASCII line breaks are interpreted as content");
    }

    this.#documents.push(this.#result);

    if (this.#position === this.#lineStart && this.#testDocumentSeparator()) {
      if (this.#input.charCodeAt(this.#position) === 0x2e /* . */) {
        this.#position += 3;
        this.#skipSeparationSpace(true, -1);
      }
      return;
    }

    if (this.#position < this.#length - 1) {
      return this.throwError(
        "end of the stream or a document separator is expected",
      );
    }
  }

  parse(input: string) {
    this.#input = input;
    this.#length = input.length;

    while (this.#input.charCodeAt(this.#position) === 0x20 /* Space */) {
      this.#lineIndent += 1;
      this.#position += 1;
    }

    while (this.#position < this.#length - 1) {
      this.#readDocument();
    }
    return this.#documents;
  }
}

export function parseDocuments(
  input: string,
  options?: ParserOptions,
): unknown[] {
  input = String(input);
  options = options || {};

  if (input.length !== 0) {
    // Add tailing `\n` if not exists
    if (
      input.charCodeAt(input.length - 1) !== 0x0a /* LF */ &&
      input.charCodeAt(input.length - 1) !== 0x0d /* CR */
    ) {
      input += "\n";
    }

    // Strip BOM
    if (input.charCodeAt(0) === 0xfeff) {
      input = input.slice(1);
    }
  }

  // Use 0 as string terminator. That significantly simplifies bounds check.
  input += "\0";

  const parser = new Parser(options);
  return parser.parse(input);
}

export function parseDocument(input: string, options?: ParserOptions): unknown {
  const documents = parseDocuments(input, options);

  if (documents.length === 0) return null;
  if (documents.length === 1) return documents[0];
  throw new YamlError(
    "expected a single document in the stream, but found more",
  );
}
