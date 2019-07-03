// tslint:disable:no-conditional-assignment
import { YAMLError } from "../error/YAMLError.ts";
import { Mark } from "../Mark.ts";
import { DEFAULT_SAFE_SCHEMA } from "../schema/mod.ts";
import { Type } from "../Type.ts";
import * as common from "../utils.ts";
import { LoaderState, LoaderStateOptions, ResultType } from "./LoaderState.ts";

type ArrayObject<T> = common.ArrayObject<T>;

const _hasOwnProperty = Object.prototype.hasOwnProperty;

const CONTEXT_FLOW_IN = 1;
const CONTEXT_FLOW_OUT = 2;
const CONTEXT_BLOCK_IN = 3;
const CONTEXT_BLOCK_OUT = 4;

const CHOMPING_CLIP = 1;
const CHOMPING_STRIP = 2;
const CHOMPING_KEEP = 3;

const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
const PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
const PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
const PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;

function _class(obj: any) {
  return Object.prototype.toString.call(obj);
}

function is_EOL(c: number) {
  return c === 0x0a /* LF */ || c === 0x0d /* CR */;
}

function is_WHITE_SPACE(c: number) {
  return c === 0x09 /* Tab */ || c === 0x20 /* Space */;
}

function is_WS_OR_EOL(c: number) {
  return (
    c === 0x09 /* Tab */ ||
    c === 0x20 /* Space */ ||
    c === 0x0a /* LF */ ||
    c === 0x0d /* CR */
  );
}

function is_FLOW_INDICATOR(c: number) {
  return (
    c === 0x2c /* , */ ||
    c === 0x5b /* [ */ ||
    c === 0x5d /* ] */ ||
    c === 0x7b /* { */ ||
    c === 0x7d /* } */
  );
}

function fromHexCode(c: number) {
  if (0x30 /* 0 */ <= c && c <= 0x39 /* 9 */) {
    return c - 0x30;
  }

  const lc = c | 0x20;

  if (0x61 /* a */ <= lc && lc <= 0x66 /* f */) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c: number) {
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

function fromDecimalCode(c: number) {
  if (0x30 /* 0 */ <= c && c <= 0x39 /* 9 */) {
    return c - 0x30;
  }

  return -1;
}

function simpleEscapeSequence(c: number) {
  /* tslint:disable:prettier */
  return c === 0x30 /* 0 */
    ? "\x00"
    : c === 0x61 /* a */
    ? "\x07"
    : c === 0x62 /* b */
    ? "\x08"
    : c === 0x74 /* t */
    ? "\x09"
    : c === 0x09 /* Tab */
    ? "\x09"
    : c === 0x6e /* n */
    ? "\x0A"
    : c === 0x76 /* v */
    ? "\x0B"
    : c === 0x66 /* f */
    ? "\x0C"
    : c === 0x72 /* r */
    ? "\x0D"
    : c === 0x65 /* e */
    ? "\x1B"
    : c === 0x20 /* Space */
    ? " "
    : c === 0x22 /* " */
    ? "\x22"
    : c === 0x2f /* / */
    ? "/"
    : c === 0x5c /* \ */
    ? "\x5C"
    : c === 0x4e /* N */
    ? "\x85"
    : c === 0x5f /* _ */
    ? "\xA0"
    : c === 0x4c /* L */
    ? "\u2028"
    : c === 0x50 /* P */
    ? "\u2029"
    : "";
  /* tslint:enable:prettier */
}

function charFromCodepoint(c: number) {
  if (c <= 0xffff) {
    return String.fromCharCode(c);
  }
  // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xd800,
    ((c - 0x010000) & 0x03ff) + 0xdc00
  );
}

const simpleEscapeCheck = new Array(256); // integer, for fast access
const simpleEscapeMap = new Array(256);
for (let i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}

function generateError(state, message) {
  return new YAMLError(
    message,
    new Mark(
      state.filename,
      state.input,
      state.position,
      state.line,
      state.position - state.lineStart
    )
  );
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}

const directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    let match, major, minor;

    if (state.version !== null) {
      throwError(state, "duplication of %YAML directive");
    }

    if (args.length !== 1) {
      throwError(state, "YAML directive accepts exactly one argument");
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (match === null) {
      throwError(state, "ill-formed argument of the YAML directive");
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (major !== 1) {
      throwError(state, "unacceptable YAML version of the document");
    }

    state.version = args[0];
    state.checkLineBreaks = minor < 2;

    if (minor !== 1 && minor !== 2) {
      throwWarning(state, "unsupported YAML version of the document");
    }
  },

  TAG: function handleTagDirective(state, name, args) {
    let handle, prefix;

    if (args.length !== 2) {
      throwError(state, "TAG directive accepts exactly two arguments");
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(
        state,
        "ill-formed tag handle (first argument) of the TAG directive"
      );
    }

    if (_hasOwnProperty.call(state.tagMap, handle)) {
      throwError(
        state,
        `there is a previously declared suffix for "${handle}" tag handle`
      );
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(
        state,
        "ill-formed tag prefix (second argument) of the TAG directive"
      );
    }

    state.tagMap[handle] = prefix;
  }
};

function captureSegment(
  state: LoaderState,
  start: number,
  end: number,
  checkJson: boolean
) {
  let result: string;
  if (start < end) {
    result = state.input.slice(start, end);

    if (checkJson) {
      for (
        let position = 0, length = result.length;
        position < length;
        position++
      ) {
        const character = result.charCodeAt(position);
        if (
          !(character === 0x09 || (0x20 <= character && character <= 0x10ffff))
        ) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(result)) {
      throwError(state, "the stream contains non-printable characters");
    }

    state.result += result;
  }
}

function mergeMappings(
  state: LoaderState,
  destination: {},
  source: {},
  overridableKeys: ArrayObject<boolean>
) {
  if (!common.isObject(source)) {
    throwError(
      state,
      "cannot merge mappings; the provided source object is unacceptable"
    );
  }

  const keys = Object.keys(source);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (!_hasOwnProperty.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(
  state: LoaderState,
  result: {},
  overridableKeys: ArrayObject<boolean>,
  keyTag: string,
  keyNode: any,
  valueNode: {},
  startLine?: number,
  startPos?: number
) {
  // The output is a plain object here, so keys can only be strings.
  // We need to convert keyNode to a string, but doing so can hang the process
  // (deeply nested arrays that explode exponentially using aliases).
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);

    for (let index = 0, quantity = keyNode.length; index < quantity; index++) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
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
        let index = 0, quantity = valueNode.length;
        index < quantity;
        index++
      ) {
        mergeMappings(state, result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, result, valueNode, overridableKeys);
    }
  } else {
    if (
      !state.json &&
      !_hasOwnProperty.call(overridableKeys, keyNode) &&
      _hasOwnProperty.call(result, keyNode)
    ) {
      state.line = startLine || state.line;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    result[keyNode] = valueNode;
    delete overridableKeys[keyNode];
  }

  return result;
}

function readLineBreak(state) {
  let ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x0a /* LF */) {
    state.position++;
  } else if (ch === 0x0d /* CR */) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 0x0a /* LF */) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }

  state.line += 1;
  state.lineStart = state.position;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  let lineBreaks = 0,
    ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    if (allowComments && ch === 0x23 /* # */) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0x0a /* LF */ && ch !== 0x0d /* CR */ && ch !== 0);
    }

    if (is_EOL(ch)) {
      readLineBreak(state);

      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;

      while (ch === 0x20 /* Space */) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }

  if (
    checkIndent !== -1 &&
    lineBreaks !== 0 &&
    state.lineIndent < checkIndent
  ) {
    throwWarning(state, "deficient indentation");
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  let _position = state.position,
    ch;

  ch = state.input.charCodeAt(_position);

  // Condition state.position === state.lineStart is tested
  // in parent on each call, for efficiency. No needs to test here again.
  if (
    (ch === 0x2d /* - */ || ch === 0x2e) /* . */ &&
    ch === state.input.charCodeAt(_position + 1) &&
    ch === state.input.charCodeAt(_position + 2)
  ) {
    _position += 3;

    ch = state.input.charCodeAt(_position);

    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += " ";
  } else if (count > 1) {
    state.result += common.repeat("\n", count - 1);
  }
}

function readPlainScalar(
  state: LoaderState,
  nodeIndent: number,
  withinFlowCollection: boolean
) {
  const kind = state.kind;
  const result = state.result;
  let ch = state.input.charCodeAt(state.position);

  if (
    is_WS_OR_EOL(ch) ||
    is_FLOW_INDICATOR(ch) ||
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
  if (ch === 0x3f /* ? */ || ch === 0x2d /* - */) {
    following = state.input.charCodeAt(state.position + 1);

    if (
      is_WS_OR_EOL(following) ||
      (withinFlowCollection && is_FLOW_INDICATOR(following))
    ) {
      return false;
    }
  }

  state.kind = "scalar";
  state.result = "";
  let captureEnd: number,
    captureStart = (captureEnd = state.position);
  let hasPendingContent = false;
  let line = 0;
  while (ch !== 0) {
    if (ch === 0x3a /* : */) {
      following = state.input.charCodeAt(state.position + 1);

      if (
        is_WS_OR_EOL(following) ||
        (withinFlowCollection && is_FLOW_INDICATOR(following))
      ) {
        break;
      }
    } else if (ch === 0x23 /* # */) {
      const preceding = state.input.charCodeAt(state.position - 1);

      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (
      (state.position === state.lineStart && testDocumentSeparator(state)) ||
      (withinFlowCollection && is_FLOW_INDICATOR(ch))
    ) {
      break;
    } else if (is_EOL(ch)) {
      line = state.line;
      const lineStart = state.lineStart;
      const lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = line;
        state.lineStart = lineStart;
        state.lineIndent = lineIndent;
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (!common.isNullOrUndefined(state.result)) {
    return true;
  }

  state.kind = kind;
  state.result = result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  let ch, captureStart, captureEnd;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x27 /* ' */) {
    return false;
  }

  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x27 /* ' */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x27 /* ' */) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (
      state.position === state.lineStart &&
      testDocumentSeparator(state)
    ) {
      throwError(
        state,
        "unexpected end of the document within a single quoted scalar"
      );
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(
    state,
    "unexpected end of the stream within a single quoted scalar"
  );
}

function readDoubleQuotedScalar(state: LoaderState, nodeIndent: number) {
  let ch = state.input.charCodeAt(state.position);

  if (ch !== 0x22 /* " */) {
    return false;
  }

  state.kind = "scalar";
  state.result = "";
  state.position++;
  let captureEnd: number,
    captureStart = (captureEnd = state.position);
  let tmp: number;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x22 /* " */) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    }
    if (ch === 0x5c /* \ */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);

        // TODO: rework to inline fn with no type cast?
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        let hexLength = tmp;
        let hexResult = 0;

        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);

          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }

        state.result += charFromCodepoint(hexResult);

        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }

      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (
      state.position === state.lineStart &&
      testDocumentSeparator(state)
    ) {
      throwError(
        state,
        "unexpected end of the document within a double quoted scalar"
      );
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(
    state,
    "unexpected end of the stream within a double quoted scalar"
  );
}

function readFlowCollection(state: LoaderState, nodeIndent: number) {
  let ch = state.input.charCodeAt(state.position);
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

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = result;
  }

  ch = state.input.charCodeAt(++state.position);

  const tag = state.tag,
    anchor = state.anchor;
  let readNext = true;
  let valueNode,
    keyNode,
    keyTag = (keyNode = valueNode = null),
    isExplicitPair: boolean,
    isPair = (isExplicitPair = false);
  let following = 0,
    line = 0;
  const overridableKeys: ArrayObject<boolean> = {};
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === terminator) {
      state.position++;
      state.tag = tag;
      state.anchor = anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = result;
      return true;
    }
    if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (ch === 0x3f /* ? */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    line = state.line;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === line) && ch === 0x3a /* : */) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(
        state,
        result,
        overridableKeys,
        keyTag,
        keyNode,
        valueNode
      );
    } else if (isPair) {
      (result as Array<{}>).push(
        storeMappingPair(
          state,
          null,
          overridableKeys,
          keyTag,
          keyNode,
          valueNode
        )
      );
    } else {
      (result as ResultType[]).push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x2c /* , */) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, "unexpected end of the stream within a flow collection");
}

function readBlockScalar(state, nodeIndent) {
  let chomping = CHOMPING_CLIP,
    didReadContent = false,
    detectedIndent = false,
    textIndent = nodeIndent,
    emptyLines = 0,
    atMoreIndented = false;

  let ch = state.input.charCodeAt(state.position);

  let folding = false;
  if (ch === 0x7c /* | */) {
    folding = false;
  } else if (ch === 0x3e /* > */) {
    folding = true;
  } else {
    return false;
  }

  state.kind = "scalar";
  state.result = "";

  let tmp = 0;
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x2b /* + */ || ch === 0x2d /* - */) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 0x2b /* + */ ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(
          state,
          "bad explicit indentation width of a block scalar; it cannot be less than one"
        );
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }

  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));

    if (ch === 0x23 /* # */) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }

  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;

    ch = state.input.charCodeAt(state.position);

    while (
      (!detectedIndent || state.lineIndent < textIndent) &&
      ch === 0x20 /* Space */
    ) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {
      // Perform the chomping.
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat(
          "\n",
          didReadContent ? 1 + emptyLines : emptyLines
        );
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          // i.e. only if the scalar is not empty.
          state.result += "\n";
        }
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {
      // Lines starting with white space characters (more-indented lines) are not folded.
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        // except for the first content line (cf. Example 8.1)
        state.result += common.repeat(
          "\n",
          didReadContent ? 1 + emptyLines : emptyLines
        );

        // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat("\n", emptyLines + 1);

        // Just one line break - perceive as the same line.
      } else if (emptyLines === 0) {
        if (didReadContent) {
          // i.e. only if we have already read some scalar content.
          state.result += " ";
        }

        // Several line breaks - perceive as different lines.
      } else {
        state.result += common.repeat("\n", emptyLines);
      }

      // Literal style: just add exact number of line breaks between content lines.
    } else {
      // Keep all line breaks except the header line break.
      state.result += common.repeat(
        "\n",
        didReadContent ? 1 + emptyLines : emptyLines
      );
    }

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    const captureStart = state.position;

    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  let line: number,
    following: number,
    detected = false,
    ch: number;
  const tag = state.tag,
    anchor = state.anchor,
    result = [];

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (ch !== 0x2d /* - */) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (!is_WS_OR_EOL(following)) {
      break;
    }

    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }

    line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    result.push(state.result);
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if ((state.line === line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = tag;
    state.anchor = anchor;
    state.kind = "sequence";
    state.result = result;
    return true;
  }
  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  const tag = state.tag,
    anchor = state.anchor,
    result = {},
    overridableKeys = {};
  let following: number,
    allowCompact: boolean,
    line: number,
    pos: number,
    keyTag = null,
    keyNode = null,
    valueNode = null,
    atExplicitKey = false,
    detected = false,
    ch: number;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    following = state.input.charCodeAt(state.position + 1);
    line = state.line; // Save the current line.
    pos = state.position;

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if (
      (ch === 0x3f /* ? */ || ch === 0x3a) /* : */ &&
      is_WS_OR_EOL(following)
    ) {
      if (ch === 0x3f /* ? */) {
        if (atExplicitKey) {
          storeMappingPair(
            state,
            result,
            overridableKeys,
            keyTag,
            keyNode,
            null
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
        throwError(
          state,
          "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"
        );
      }

      state.position += 1;
      ch = following;

      //
      // Implicit notation case. Flow-style node as the key first, then ":", and the value.
      //
    } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
      if (state.line === line) {
        ch = state.input.charCodeAt(state.position);

        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x3a /* : */) {
          ch = state.input.charCodeAt(++state.position);

          if (!is_WS_OR_EOL(ch)) {
            throwError(
              state,
              "a whitespace character is expected after the key-value separator within a block mapping"
            );
          }

          if (atExplicitKey) {
            storeMappingPair(
              state,
              result,
              overridableKeys,
              keyTag,
              keyNode,
              null
            );
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(
            state,
            "can not read an implicit mapping pair; a colon is missed"
          );
        } else {
          state.tag = tag;
          state.anchor = anchor;
          return true; // Keep the result of `composeNode`.
        }
      } else if (detected) {
        throwError(
          state,
          "can not read a block mapping entry; a multiline key may not be an implicit key"
        );
      } else {
        state.tag = tag;
        state.anchor = anchor;
        return true; // Keep the result of `composeNode`.
      }
    } else {
      break; // Reading is done. Go to the epilogue.
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === line || state.lineIndent > nodeIndent) {
      if (
        composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)
      ) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(
          state,
          result,
          overridableKeys,
          keyTag,
          keyNode,
          valueNode,
          line,
          pos
        );
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if (state.lineIndent > nodeIndent && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, result, overridableKeys, keyTag, keyNode, null);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = tag;
    state.anchor = anchor;
    state.kind = "mapping";
    state.result = result;
  }

  return detected;
}

function readTagProperty(state: LoaderState) {
  let position: number,
    isVerbatim = false,
    isNamed = false,
    tagHandle: string,
    tagName: string,
    ch: number;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x21 /* ! */) return false;

  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }

  ch = state.input.charCodeAt(++state.position);

  if (ch === 0x3c /* < */) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 0x21 /* ! */) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }

  position = state.position;

  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 0x3e /* > */);

    if (state.position < state.length) {
      tagName = state.input.slice(position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 0x21 /* ! */) {
        if (!isNamed) {
          tagHandle = state.input.slice(position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(
              state,
              "named tag handle cannot contain such characters"
            );
          }

          isNamed = true;
          position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, `tag name cannot contain such characters: ${tagName}`);
  }

  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = `!${tagName}`;
  } else if (tagHandle === "!!") {
    state.tag = `tag:yaml.org,2002:${tagName}`;
  } else {
    throwError(state, `undeclared tag handle "${tagHandle}"`);
  }

  return true;
}

function readAnchorProperty(state: LoaderState) {
  let position: number, ch: number;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x26 /* & */) return false;

  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }

  ch = state.input.charCodeAt(++state.position);
  position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === position) {
    throwError(
      state,
      "name of an anchor node must contain at least one character"
    );
  }

  state.anchor = state.input.slice(position, state.position);
  return true;
}

function readAlias(state) {
  let _position, alias, ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x2a /* * */) return false;

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(
      state,
      "name of an alias node must contain at least one character"
    );
  }

  alias = state.input.slice(_position, state.position);

  if (!state.anchorMap.hasOwnProperty(alias)) {
    throwError(state, `unidentified alias "${alias}"`);
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(
  state: LoaderState,
  parentIndent: number,
  nodeContext: number,
  allowToSeek: boolean,
  allowCompact: boolean
) {
  let allowBlockStyles: boolean,
    allowBlockScalars: boolean,
    allowBlockCollections: boolean,
    indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
    atNewLine = false,
    hasContent = false,
    type: Type,
    flowIndent: number,
    blockIndent: number;

  if (state.listener && state.listener !== null) {
    state.listener("open", state);
  }

  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }

  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
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
    const cond =
      CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext;
    flowIndent = cond ? parentIndent : parentIndent + 1;

    blockIndent = state.position - state.lineStart;

    if (indentStatus === 1) {
      if (
        (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
            readBlockMapping(state, blockIndent, flowIndent))) ||
        readFlowCollection(state, flowIndent)
      ) {
        hasContent = true;
      } else {
        if (
          (allowBlockScalars && readBlockScalar(state, flowIndent)) ||
          readSingleQuotedScalar(state, flowIndent) ||
          readDoubleQuotedScalar(state, flowIndent)
        ) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;

          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (
          readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)
        ) {
          hasContent = true;

          if (state.tag === null) {
            state.tag = "?";
          }
        }

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      // Special case: block sequences are allowed to have same indentation level as the parent.
      // http://www.yaml.org/spec/1.2/spec.html#id2799784
      hasContent =
        allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (state.tag !== null && state.tag !== "!") {
    if (state.tag === "?") {
      for (
        let typeIndex = 0, typeQuantity = state.implicitTypes.length;
        typeIndex < typeQuantity;
        typeIndex++
      ) {
        type = state.implicitTypes[typeIndex];

        // Implicit resolving is not allowed for non-scalar types, and '?'
        // non-specific tag is only assigned to plain scalars. So, it isn't
        // needed to check for 'kind' conformity.

        if (type.resolve(state.result)) {
          // `state.result` updated in resolver if matched
          state.result = type.construct(state.result);
          state.tag = type.tag;
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
          break;
        }
      }
    } else if (
      _hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)
    ) {
      type = state.typeMap[state.kind || "fallback"][state.tag];

      if (state.result !== null && type.kind !== state.kind) {
        throwError(
          state,
          `unacceptable node kind for !<${state.tag}> tag; it should be "${
            type.kind
          }", not "${state.kind}"`
        );
      }

      if (!type.resolve(state.result)) {
        // `state.result` updated in resolver if matched
        throwError(
          state,
          `cannot resolve a node with !<${state.tag}> explicit tag`
        );
      } else {
        state.result = type.construct(state.result);
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else {
      throwError(state, `unknown tag !<${state.tag}>`);
    }
  }

  if (state.listener && state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}

function readDocument(state: LoaderState) {
  const documentStart = state.position;
  let position: number,
    directiveName: string,
    directiveArgs: any[],
    hasDirectives = false,
    ch: number;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = {};
  state.anchorMap = {};

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if (state.lineIndent > 0 || ch !== 0x25 /* % */) {
      break;
    }

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(
        state,
        "directive name must not be less than one character in length"
      );
    }

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (ch === 0x23 /* # */) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }

      if (is_EOL(ch)) break;

      position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(position, state.position));
    }

    if (ch !== 0) readLineBreak(state);

    if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, `unknown document directive "${directiveName}"`);
    }
  }

  skipSeparationSpace(state, true, -1);

  if (
    state.lineIndent === 0 &&
    state.input.charCodeAt(state.position) === 0x2d /* - */ &&
    state.input.charCodeAt(state.position + 1) === 0x2d /* - */ &&
    state.input.charCodeAt(state.position + 2) === 0x2d /* - */
  ) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (
    state.checkLineBreaks &&
    PATTERN_NON_ASCII_LINE_BREAKS.test(
      state.input.slice(documentStart, state.position)
    )
  ) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 0x2e /* . */) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}

function loadDocuments(input: string, options?: LoaderStateOptions) {
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

  const state = new LoaderState(input, options);

  // Use 0 as string terminator. That significantly simplifies bounds check.
  state.input += "\0";

  while (state.input.charCodeAt(state.position) === 0x20 /* Space */) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < state.length - 1) {
    readDocument(state);
  }

  return state.documents;
}

export type CbFunction = (doc: any) => void;
function isCbFunction(fn: any): fn is CbFunction {
  return typeof fn === "function";
}

export function loadAll<T extends CbFunction | LoaderStateOptions>(
  input: string,
  iteratorOrOption?: T,
  options?: LoaderStateOptions
): T extends CbFunction ? void : any[] {
  if (!isCbFunction(iteratorOrOption)) {
    return loadDocuments(input, iteratorOrOption as LoaderStateOptions) as any;
  }

  const documents = loadDocuments(input, options);
  const iterator = iteratorOrOption;
  for (let index = 0, length = documents.length; index < length; index++) {
    iterator(documents[index]);
  }
}

export function load(input: string, options?: LoaderStateOptions): any {
  const documents = loadDocuments(input, options);

  if (documents.length === 0) {
    return;
  }
  if (documents.length === 1) {
    return documents[0];
  }
  throw new YAMLError(
    "expected a single document in the stream, but found more"
  );
}

export function safeLoadAll<T extends CbFunction | LoaderStateOptions>(
  input: string,
  outputOrOptions?: T,
  options: LoaderStateOptions = {}
): T extends CbFunction ? void : any[] {
  if (isCbFunction(outputOrOptions)) {
    loadAll<T>(input, outputOrOptions, {
      schema: DEFAULT_SAFE_SCHEMA,
      ...options
    });
  } else {
    options = (outputOrOptions as LoaderStateOptions) || {};
    return loadAll<T>(input, {
      schema: DEFAULT_SAFE_SCHEMA,
      ...options
    } as any);
  }
}

export function safeLoad(input: string, options?: LoaderStateOptions): any {
  return load(input, { schema: DEFAULT_SAFE_SCHEMA, ...options });
}
