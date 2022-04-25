export interface ParseOptions {
  allowTrailingComma?: boolean;
}

export function parse(
  text: string,
  { allowTrailingComma = true }: ParseOptions = {},
) {
  return new JSONCParser(text, { allowTrailingComma }).parse();
}

enum tokenType {
  objectStart,
  objectEnd,
  arrayStart,
  arrayEnd,
  colon,
  comma,
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
  readonly #numberEndToken = new Set([..."[]{}:,", ...this.#whitespace]);
  #text: string;
  #length: number;
  #gen: Generator<tokenized, void>;
  #options: ParseOptions;
  constructor(text: string, options: ParseOptions) {
    this.#text = text;
    this.#length = text.length;
    this.#gen = this.#tokenize();
    this.#options = options;
  }
  parse() {
    const token = this.#getNext();
    const res = this.#parseJSONValue(token);
    const { done, value } = this.#gen.next();
    if (!done) {
      throw createUnexpectedTokenError(value);
    }
    return res;
  }
  #getNext() {
    const { done, value } = this.#gen.next();
    if (done) {
      throw new SyntaxError("Unexpected end of JSONC input");
    }
    return value;
  }
  *#tokenize(): Generator<tokenized, void> {
    for (let i = 0; i < this.#length; i++) {
      if (this.#whitespace.has(this.#text[i])) {
        continue;
      }
      if (this.#text[i] === "/" && this.#text[i + 1] === "*") {
        i += 2;
        let hasEndOfComment = false;
        for (; i < this.#length; i++) {
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
      if (this.#text[i] === "/" && this.#text[i + 1] === "/") {
        i += 2;
        for (; i < this.#length; i++) {
          if (
            this.#text[i] === "\n" ||
            this.#text[i] === "\r" && this.#text[i] === "\n"
          ) {
            break;
          }
        }
        continue;
      }
      if (this.#text[i] === "{") {
        yield { type: tokenType.objectStart, position: i } as const;
      } else if (this.#text[i] === "}") {
        yield { type: tokenType.objectEnd, position: i } as const;
      } else if (this.#text[i] === "[") {
        yield { type: tokenType.arrayStart, position: i } as const;
      } else if (this.#text[i] === "]") {
        yield { type: tokenType.arrayEnd, position: i } as const;
      } else if (this.#text[i] === ":") {
        yield { type: tokenType.colon, position: i } as const;
      } else if (this.#text[i] === ",") {
        yield { type: tokenType.comma, position: i } as const;
      } else if (this.#text[i] === '"') {
        const startIndex = i;
        i++;
        for (; i < this.#length; i++) {
          if (this.#text[i] === '"' && this.#text[i - 1] !== "\\") {
            break;
          }
        }
        yield {
          type: tokenType.string,
          sourceText: this.#text.substring(startIndex, i + 1),
          position: startIndex,
        } as const;
      } else {
        const startIndex = i;
        for (; i < this.#length; i++) {
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
  #parseJSONValue(value: tokenized) {
    switch (value.type) {
      case tokenType.objectStart:
        return this.#parseObject();
      case tokenType.arrayStart:
        return this.#parseArray();
      case tokenType.nullOrTrueOrFalseOrNumber:
        return this.#parseNumberOrNullOrTrueOrFalse(value);
      case tokenType.string:
        return this.#parseString(value);
      default:
        throw createUnexpectedTokenError(value);
    }
  }
  #parseObject() {
    const target: Record<string, unknown> = {};
    let isFirst = true;
    while (true) {
      const token1 = this.#getNext();
      if (
        (isFirst || this.#options.allowTrailingComma) &&
        token1.type === tokenType.objectEnd
      ) {
        return target;
      }
      if (token1.type !== tokenType.string) {
        throw createUnexpectedTokenError(token1);
      }
      const key = this.#parseString(token1);

      const token2 = this.#getNext();
      if (token2.type !== tokenType.colon) {
        throw createUnexpectedTokenError(token2);
      }

      const token3 = this.#getNext();
      const value = this.#parseJSONValue(token3);
      target[key] = value;

      const token4 = this.#getNext();
      if (token4.type === tokenType.objectEnd) {
        return target;
      }
      if (token4.type !== tokenType.comma) {
        throw createUnexpectedTokenError(token4);
      }
      isFirst = false;
    }
  }
  #parseArray() {
    const target: unknown[] = [];
    let isFirst = true;
    while (true) {
      const token1 = this.#getNext();
      if (
        (isFirst || this.#options.allowTrailingComma) &&
        token1.type === tokenType.arrayEnd
      ) {
        return target;
      }
      target.push(this.#parseJSONValue(token1));
      const token2 = this.#getNext();
      if (token2.type === tokenType.arrayEnd) {
        return target;
      }
      if (token2.type !== tokenType.comma) {
        throw createUnexpectedTokenError(token2);
      }
      isFirst = false;
    }
  }
  #parseString(value: {
    type: tokenType.string;
    sourceText: string;
    position: number;
  }): string {
    let parsed;
    try {
      parsed = JSON.parse(value.sourceText);
    } catch {
      throw createUnexpectedTokenError(value);
    }
    if (typeof parsed !== "string") {
      throw createUnexpectedTokenError(value);
    }
    return parsed;
  }
  #parseNumberOrNullOrTrueOrFalse(value: {
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
      parsed = JSON.parse(value.sourceText);
    } catch {
      throw createUnexpectedTokenError(value);
    }
    if (typeof parsed !== "number" || Number.isNaN(parsed)) {
      throw createUnexpectedTokenError(value);
    }
    return parsed;
  }
}

function createUnexpectedTokenError(
  { type, sourceText, position }: tokenized,
  options?: ErrorOptions,
): SyntaxError {
  let token = "";
  switch (type) {
    case tokenType.objectStart:
      token = "{";
      break;
    case tokenType.objectEnd:
      token = "}";
      break;
    case tokenType.arrayStart:
      token = "[";
      break;
    case tokenType.arrayEnd:
      token = "]";
      break;
    case tokenType.colon:
      token = ":";
      break;
    case tokenType.comma:
      token = ",";
      break;
    case tokenType.nullOrTrueOrFalseOrNumber:
    case tokenType.string:
      token = sourceText;
      break;
    default:
      throw new Error("unreachable");
  }
  return new SyntaxError(
    `Unexpected token ${token} in JSONC at position ${position}`,
    options,
  );
}
