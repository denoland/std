import { assert } from "../_util/assert.ts";

export interface ParseOptions {
  allowTrailingComma?: boolean;
}

export function parse(
  text: string,
  { allowTrailingComma = true }: ParseOptions = {},
) {
  return new JSONCParser(text, { allowTrailingComma }).parse() as JSONValue;
}

type JSONValue =
  | { [key: string]: JSONValue }
  | JSONValue[]
  | string
  | number
  | boolean
  | null;

enum tokenType {
  beginObject,
  endObject,
  beginArray,
  endArray,
  nameSeparator,
  valueSeparator,
  nullOrTrueOrFalseOrNumber,
  string,
}

type tokenized = {
  type: Exclude<
    tokenType,
    tokenType.string | tokenType.nullOrTrueOrFalseOrNumber
  >;
  sourceText?: undefined;
  position: number;
} | {
  type: tokenType.string;
  sourceText: string;
  position: number;
} | {
  type: tokenType.nullOrTrueOrFalseOrNumber;
  sourceText: string;
  position: number;
};

class JSONCParser {
  readonly #whitespace = new Set(" \t\r\n");
  readonly #numberEndToken = new Set([..."[]{}:,/", ...this.#whitespace]);
  #text: string;
  #length: number;
  #tokenized: Generator<tokenized, void>;
  #options: ParseOptions;
  constructor(text: string, options: ParseOptions) {
    this.#text = text;
    this.#length = text.length;
    this.#tokenized = this.#tokenize();
    this.#options = options;
  }
  parse() {
    const token = this.#getNext();
    const res = this.#parseJSONValue(token);

    // make sure all characters have been read
    const { done, value } = this.#tokenized.next();
    if (!done) {
      throw new SyntaxError(buildErrorMessage(value));
    }

    return res;
  }
  /** Read the next token. If the token is read to the end, it throws a SyntaxError. */
  #getNext() {
    const { done, value } = this.#tokenized.next();
    if (done) {
      throw new SyntaxError("Unexpected end of JSONC input");
    }
    return value;
  }
  /** Split the JSONC string into token units. */
  *#tokenize(): Generator<tokenized, void> {
    for (let i = 0; i < this.#length; i++) {
      // skip whitespace
      if (this.#whitespace.has(this.#text[i])) {
        continue;
      }

      // skip comment (`/*...*/`)
      if (this.#text[i] === "/" && this.#text[i + 1] === "*") {
        i += 2;
        let hasEndOfComment = false;
        for (; i < this.#length; i++) { // read until find `*/`
          if (this.#text[i] === "*" && this.#text[i + 1] === "/") {
            hasEndOfComment = true;
            break;
          }
        }
        if (!hasEndOfComment) {
          throw new SyntaxError("Unexpected end of JSONC input");
        }
        i++;
        continue;
      }

      // skip comment (`//...`)
      if (this.#text[i] === "/" && this.#text[i + 1] === "/") {
        i += 2;
        for (; i < this.#length; i++) { // read until find `\n` or `\r\n`
          if (
            this.#text[i] === "\n" ||
            this.#text[i] === "\r" && this.#text[i + 1] === "\n"
          ) {
            break;
          }
        }
        continue;
      }

      switch (this.#text[i]) {
        case "{":
          yield { type: tokenType.beginObject, position: i } as const;
          break;
        case "}":
          yield { type: tokenType.endObject, position: i } as const;
          break;
        case "[":
          yield { type: tokenType.beginArray, position: i } as const;
          break;
        case "]":
          yield { type: tokenType.endArray, position: i } as const;
          break;
        case ":":
          yield { type: tokenType.nameSeparator, position: i } as const;
          break;
        case ",":
          yield { type: tokenType.valueSeparator, position: i } as const;
          break;
        case '"': { // parse string token
          const startIndex = i;
          i++;
          for (; i < this.#length; i++) { // read until find `"`
            if (this.#text[i] === '"' && this.#text[i - 1] !== "\\") {
              break;
            }
          }
          yield {
            type: tokenType.string,
            sourceText: this.#text.substring(startIndex, i + 1),
            position: startIndex,
          } as const;
          break;
        }
        default: { // parse null, true, false or number token
          const startIndex = i;
          for (; i < this.#length; i++) { // read until find numberEndToken
            if (this.#numberEndToken.has(this.#text[i])) {
              break;
            }
          }
          i--;
          yield {
            type: tokenType.nullOrTrueOrFalseOrNumber,
            sourceText: this.#text.substring(startIndex, i + 1),
            position: startIndex,
          } as const;
        }
      }
    }
  }
  #parseJSONValue(value: tokenized) {
    switch (value.type) {
      case tokenType.beginObject:
        return this.#parseObject();
      case tokenType.beginArray:
        return this.#parseArray();
      case tokenType.nullOrTrueOrFalseOrNumber:
        return this.#parseNullOrTrueOrFalseOrNumber(value);
      case tokenType.string:
        return this.#parseString(value);
      default:
        throw new SyntaxError(buildErrorMessage(value));
    }
  }
  #parseObject() {
    const target: Record<string, unknown> = {};
    //   ┌─token1
    // { }
    //      ┌─────────────token1
    //      │   ┌─────────token2
    //      │   │   ┌─────token3
    //      │   │   │   ┌─token4
    //  { "key" : value }
    //      ┌───────────────token1
    //      │   ┌───────────token2
    //      │   │   ┌───────token3
    //      │   │   │   ┌───token4
    //      │   │   │   │ ┌─token5
    //  { "key" : value , }
    //      ┌─────────────────────────────token1
    //      │   ┌─────────────────────────token2
    //      │   │   ┌─────────────────────token3
    //      │   │   │   ┌─────────────────token4
    //      │   │   │   │   ┌─────────────token1
    //      │   │   │   │   │   ┌─────────token2
    //      │   │   │   │   │   │   ┌─────token3
    //      │   │   │   │   │   │   │   ┌─token4
    //  { "key" : value , "key" : value }
    for (let isFirst = true;; isFirst = false) {
      const token1 = this.#getNext();
      if (
        (isFirst || this.#options.allowTrailingComma) &&
        token1.type === tokenType.endObject
      ) {
        return target;
      }
      if (token1.type !== tokenType.string) {
        throw new SyntaxError(buildErrorMessage(token1));
      }
      const key = this.#parseString(token1);

      const token2 = this.#getNext();
      if (token2.type !== tokenType.nameSeparator) {
        throw new SyntaxError(buildErrorMessage(token2));
      }

      const token3 = this.#getNext();
      target[key] = this.#parseJSONValue(token3);

      const token4 = this.#getNext();
      if (token4.type === tokenType.endObject) {
        return target;
      }
      if (token4.type !== tokenType.valueSeparator) {
        throw new SyntaxError(buildErrorMessage(token4));
      }
    }
  }
  #parseArray() {
    const target: unknown[] = [];
    //   ┌─token1
    // [ ]
    //      ┌─────────────token1
    //      │   ┌─────────token2
    //  [ value ]
    //      ┌───────token1
    //      │   ┌───token2
    //      │   │ ┌─token1
    //  [ value , ]
    //      ┌─────────────token1
    //      │   ┌─────────token2
    //      │   │   ┌─────token1
    //      │   │   │   ┌─token2
    //  [ value , value ]
    for (let isFirst = true;; isFirst = false) {
      const token1 = this.#getNext();
      if (
        (isFirst || this.#options.allowTrailingComma) &&
        token1.type === tokenType.endArray
      ) {
        return target;
      }
      target.push(this.#parseJSONValue(token1));

      const token2 = this.#getNext();
      if (token2.type === tokenType.endArray) {
        return target;
      }
      if (token2.type !== tokenType.valueSeparator) {
        throw new SyntaxError(buildErrorMessage(token2));
      }
    }
  }
  #parseString(value: {
    type: tokenType.string;
    sourceText: string;
    position: number;
  }): string {
    let parsed;
    try {
      // Use JSON.parse to handle `\u0000` etc. correctly.
      parsed = JSON.parse(value.sourceText);
    } catch {
      throw new SyntaxError(buildErrorMessage(value));
    }
    assert(typeof parsed === "string");
    return parsed;
  }
  #parseNullOrTrueOrFalseOrNumber(value: {
    type: tokenType.nullOrTrueOrFalseOrNumber;
    sourceText: string;
    position: number;
  }) {
    if (value.sourceText === "null") {
      return null;
    }
    if (value.sourceText === "true") {
      return true;
    }
    if (value.sourceText === "false") {
      return false;
    }
    let parsed;
    try {
      // Use JSON.parse to handle `+100`, `Infinity` etc. correctly.
      parsed = JSON.parse(value.sourceText);
    } catch {
      throw new SyntaxError(buildErrorMessage(value));
    }
    assert(typeof parsed === "number");
    return parsed;
  }
}

function buildErrorMessage({ type, sourceText, position }: tokenized) {
  let token = "";
  switch (type) {
    case tokenType.beginObject:
      token = "{";
      break;
    case tokenType.endObject:
      token = "}";
      break;
    case tokenType.beginArray:
      token = "[";
      break;
    case tokenType.endArray:
      token = "]";
      break;
    case tokenType.nameSeparator:
      token = ":";
      break;
    case tokenType.valueSeparator:
      token = ",";
      break;
    case tokenType.nullOrTrueOrFalseOrNumber:
    case tokenType.string:
      token = sourceText;
      break;
    default:
      throw new Error("unreachable");
  }
  return `Unexpected token ${token} in JSONC at position ${position}`;
}
