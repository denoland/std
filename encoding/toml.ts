// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { deepAssign } from "../_util/deep_assign.ts";
import { assert } from "../_util/assert.ts";

class TOMLError extends Error {}

class KeyValuePair {
  constructor(public key: string, public value: unknown) {}
}

class ParserGroup {
  arrValues: unknown[] = [];
  objValues: Record<string, unknown> = {};

  constructor(public type: string, public name: string) {}
}

class ParserContext {
  currentGroup?: ParserGroup;
  output: Record<string, unknown> = {};
}

class ParserTokenScope {
  start: string;
  private end: string;
  private skip?: (index: number, dataString: string) => boolean;

  constructor(
    { start, end, skip }: {
      start: string;
      end: string;
      skip?: (index: number, dataString: string) => boolean;
    },
  ) {
    this.start = start;
    this.end = end;
    this.skip = skip;
  }

  startsAt(index: number, dataString: string): boolean {
    return !this.skip?.(index, dataString) &&
      Array.from({ length: this.start.length })
        .every((_, i) => dataString[index + i] === this.start[i]);
  }

  endsAt(index: number, dataString: string): boolean {
    return !this.skip?.(index, dataString) &&
      Array.from({ length: this.end.length })
        .every((_, i) => dataString[index + i] === this.end[i]);
  }
}

const Scopes = {
  BASIC_STRING: new ParserTokenScope({
    start: '"',
    end: '"',
    skip: (index: number, dataString: string): boolean => {
      return dataString.slice(index - 1, index + 1) === '\\"' ||
        dataString.slice(index, index + 3) === '"""';
    },
  }),
  LITERAL_STRING: new ParserTokenScope({
    start: "'",
    end: "'",
    skip: (index: number, dataString: string): boolean => {
      return dataString.slice(index, index + 3) === "'''";
    },
  }),
  MULTILINE_BASIC_STRING: new ParserTokenScope({
    start: '"""',
    end: '"""',
  }),
  MULTILINE_LITERAL_STRING: new ParserTokenScope({
    start: "'''",
    end: "'''",
  }),
  ARRAY: new ParserTokenScope({
    start: "[",
    end: "]",
  }),
  INLINE_TABLE: new ParserTokenScope({
    start: "{",
    end: "}",
  }),
  COMMENT: new ParserTokenScope({
    start: "#",
    end: "\n",
  }),
} as const;

// Separate string by some charactor considering scopes
// For example, split inlilne table by "," or split declaration by "="
class ParserSplitter {
  #dataString: string;
  #scopes: ParserTokenScope[];
  constructor(
    dataString: string,
    scopes: ParserTokenScope[],
  ) {
    this.#dataString = dataString;
    this.#scopes = scopes;
  }

  split(separator: string, options = { keepSeparator: false }): string[] {
    const { keepSeparator } = options;
    const stack: ParserTokenScope[] = [];
    const out: string[] = [];
    let acc: string[] = [];
    const dataString = this.#dataString;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString[i];
      if (stack.length > 0) {
        const last = stack[stack.length - 1];
        acc.push(char);
        if (last.endsAt(i, dataString)) {
          stack.pop();
        } // inline table and array can be nested
        else if (last === Scopes.INLINE_TABLE || last === Scopes.ARRAY) {
          for (const scope of this.#scopes) {
            if (scope.startsAt(i, dataString)) {
              stack.push(scope);
              break;
            }
          }
        }
      } else {
        if (char === separator) {
          out.push(acc.join(""));
          acc = [];
          if (keepSeparator) {
            acc.push(char);
          }
          continue;
        }
        acc.push(char);
        for (const scope of this.#scopes) {
          if (scope.startsAt(i, dataString)) {
            stack.push(scope);
            break;
          }
        }
      }
    }
    if (acc.length > 0) {
      out.push(acc.join(""));
    }
    return out;
  }
}

// Whitespace means tab or space in TOML. Other whitespace charactors are invalid.
export function trim(str: string) {
  const trimmed = str
    .replace(/^[ \t]*/, "")
    .replace(/[ \t]*$/, "");
  // Invalid if trimmed string contains other kinds of whitespaces at either end.
  if (/^\s+/.test(trimmed) || /\s+$/.test(trimmed)) {
    const escapeSpaces = (spaces: string) => {
      return spaces
        .split("")
        .map((char) => "\\u" + char.charCodeAt(0).toString(16))
        .join("");
    };
    const escaped = trimmed
      .replace(/^\s+/, escapeSpaces)
      .replace(/\s+$/, escapeSpaces);
    throw new TOMLError(`Contains invalid whitespaces: \`${escaped}\``);
  }
  return trimmed;
}

class Parser {
  tomlLines: string[];
  context: ParserContext;
  constructor(tomlString: string) {
    this.tomlLines = this._splitAndRemoveComments(tomlString);
    this.context = new ParserContext();
  }
  _sanitize(): void {
    this.tomlLines = this.tomlLines.map((line) => trim(line)).filter(Boolean);
  }

  _unflat(
    keys: string[],
    values: Record<string, unknown> | unknown[] = {},
    cObj: Record<string, unknown> | unknown[] = {},
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (keys.length === 0) {
      return cObj as Record<string, unknown>;
    } else {
      if (Object.keys(cObj).length === 0) {
        cObj = values;
      }
      const key: string | undefined = keys.pop();
      if (key) {
        out[key] = cObj;
      }
      return this._unflat(keys, values, out);
    }
  }
  _groupToOutput(): void {
    assert(this.context.currentGroup != null, "currentGroup must be set");
    const arrProperty = this._parseDeclarationName(
      this.context.currentGroup.name,
    );
    let u = {};
    if (this.context.currentGroup.type === "array") {
      u = this._unflat(arrProperty, this.context.currentGroup.arrValues);
    } else {
      u = this._unflat(arrProperty, this.context.currentGroup.objValues);
    }
    deepAssign(this.context.output, u);
    delete this.context.currentGroup;
  }
  _splitAndRemoveComments(str: string): string[] {
    const stack: ParserTokenScope[] = [];
    const out: string[] = [];
    let acc: string[] = [];
    const scopes = [
      Scopes.MULTILINE_BASIC_STRING,
      Scopes.MULTILINE_LITERAL_STRING,
      Scopes.BASIC_STRING,
      Scopes.LITERAL_STRING,
      Scopes.ARRAY,
    ];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (stack.length > 0) {
        const last = stack[stack.length - 1];
        if (last === Scopes.ARRAY && Scopes.COMMENT.startsAt(i, str)) {
          // remove comment
          while (i < str.length && !Scopes.COMMENT.endsAt(i, str)) {
            i++;
          }
          continue;
        }
        if (last === Scopes.ARRAY && char === "\n") {
          continue;
        }

        acc.push(char);
        if (last.endsAt(i, str)) {
          stack.pop();
        } // array can be nested
        else if (last === Scopes.ARRAY) {
          for (const scope of scopes) {
            if (scope.startsAt(i, str)) {
              stack.push(scope);
              break;
            }
          }
        }
      } else {
        if (Scopes.COMMENT.startsAt(i, str)) {
          out.push(acc.join(""));
          acc = [];
          // remove comment
          while (i < str.length && !Scopes.COMMENT.endsAt(i, str)) {
            i++;
          }
          continue;
        } else if (char === "\n") {
          out.push(acc.join(""));
          acc = [];
          continue;
        }
        acc.push(char);
        for (const scope of scopes) {
          if (scope.startsAt(i, str)) {
            stack.push(scope);
            break;
          }
        }
      }
    }
    if (acc.length > 0) {
      out.push(acc.join(""));
    }
    return out;
  }
  _isGroup(line: string): boolean {
    const t = trim(line);
    return t[0] === "[" && /\[(.*)\]/.exec(t) ? true : false;
  }
  _isDeclaration(line: string): boolean {
    return line.split("=").length > 1;
  }
  _createGroup(line: string): void {
    const captureReg = /\[(.*)\]/;
    if (this.context.currentGroup) {
      this._groupToOutput();
    }

    let type: string;
    let m = line.match(captureReg);
    assert(m != null, "line mut be matched");
    let name = m[1];
    if (name.match(/\[.*\]/)) {
      type = "array";
      m = name.match(captureReg);
      assert(m != null, "name must be matched");
      name = m[1];
    } else {
      type = "object";
    }
    this.context.currentGroup = new ParserGroup(type, name);
  }
  _processDeclaration(line: string): KeyValuePair {
    const idx = line.indexOf("=");
    const key = trim(line.substring(0, idx));
    const value = this._parseData(line.slice(idx + 1));
    return new KeyValuePair(key, value);
  }
  _parseData(dataString: string): unknown {
    dataString = trim(dataString);
    switch (dataString[0]) {
      case '"':
      case "'":
        return this._parseString(dataString);
      case "[":
        return this._parseArray(dataString);
      case "{":
        return this._parseInlineTable(dataString);
      default: {
        switch (dataString) {
          case "true":
            return true;
          case "false":
            return false;
          case "inf":
          case "+inf":
            return Infinity;
          case "-inf":
            return -Infinity;
          case "nan":
          case "+nan":
          case "-nan":
            return NaN;
          default:
            return this._parseNumberOrDate(dataString);
        }
      }
    }
  }
  _parseArray(dataString: string): unknown {
    if (
      !(dataString[0] === "[" && dataString[dataString.length - 1] === "]")
    ) {
      throw new TOMLError("Malformed array literal");
    }

    const itemStrings = new ParserSplitter(
      dataString.slice(1, -1), // remove "[" and "]"
      [
        Scopes.MULTILINE_BASIC_STRING,
        Scopes.MULTILINE_LITERAL_STRING,
        Scopes.BASIC_STRING,
        Scopes.LITERAL_STRING,
        Scopes.INLINE_TABLE,
        Scopes.ARRAY,
      ],
    ).split(",")
      .map((str) => trim(str.replace(/^\n/, "")));
    if (
      itemStrings.length > 0 &&
      trim(itemStrings[itemStrings.length - 1]).length === 0
    ) {
      itemStrings.pop();
    }
    const items = itemStrings.map((str) => this._parseData(str));
    return items;
  }
  _parseInlineTable(dataString: string): unknown {
    if (!(dataString[0] === "{" && dataString[dataString.length - 1] === "}")) {
      throw new TOMLError("Malformed inline table");
    }

    const declarations = new ParserSplitter(
      dataString.slice(1, -1), // remove "{" and "}"
      [
        Scopes.MULTILINE_BASIC_STRING,
        Scopes.MULTILINE_LITERAL_STRING,
        Scopes.BASIC_STRING,
        Scopes.LITERAL_STRING,
        Scopes.INLINE_TABLE,
        Scopes.ARRAY,
      ],
    ).split(",");

    const out = Object.fromEntries(
      declarations
        .map((declaration) => this._processDeclaration(declaration))
        .map((kv) => [kv.key, kv.value]),
    );
    return out;
  }
  _parseString(dataString: string): string {
    if (dataString.startsWith("'''")) {
      // multi-line literal
      if (!dataString.endsWith("'''")) {
        throw new TOMLError(`Multi-line string is not closed:\n${dataString}`);
      }
      return dataString.replace(/^'''/, "")
        .replace(/'''$/, "")
        // Remove First EOL
        .replace(/^\n/, "");
    } else if (dataString.startsWith("'")) {
      // single-line literal
      if (!dataString.endsWith("'")) {
        throw new TOMLError(`Single-line string is not closed:\n${dataString}`);
      }
      if (dataString.includes("\n")) {
        throw new TOMLError(
          `Single-line string cannot contain EOL:\n${dataString}`,
        );
      }
      return dataString.replace(/^'/, "").replace(/'$/, "");
    }
    let isSingleLineBasic = false;
    if (dataString.startsWith('"""')) {
      // multi-line basic string
      if (!dataString.endsWith('"""')) {
        throw new TOMLError(`Multi-line string is not closed:\n${dataString}`);
      }
      dataString = dataString.replace(/^"""/, "")
        .replace(/"""$/, "")
        // Remove First EOL
        .replace(/^\n/, "")
        // Trim "/\n"
        .replace(/\\\n\s*/g, "");
    } else {
      // single-line basic string
      if (!dataString.startsWith('"') || !dataString.endsWith('"')) {
        throw new TOMLError(`Single-line string is not closed:\n${dataString}`);
      }
      if (dataString.includes("\n")) {
        throw new TOMLError(
          `Single-line string cannot contain EOL:\n${dataString}`,
        );
      }
      isSingleLineBasic = true;
      dataString = dataString.replace(/^"/, "")
        .replace(/"$/, "");
    }
    let value = "";
    for (let i = 0; i < dataString.length; i++) {
      switch (dataString[i]) {
        case "\\":
          i++;
          // See https://toml.io/en/v1.0.0-rc.3#string
          switch (dataString[i]) {
            case "b":
              value += "\b";
              break;
            case "t":
              value += "\t";
              break;
            case "n":
              value += "\n";
              break;
            case "f":
              value += "\f";
              break;
            case "r":
              value += "\r";
              break;
            case "u":
            case "U": {
              // Unicode character
              const codePointLen = dataString[i] === "u" ? 4 : 6;
              const codePoint = parseInt(
                "0x" + dataString.slice(i + 1, i + 1 + codePointLen),
                16,
              );
              value += String.fromCodePoint(codePoint);
              i += codePointLen;
              break;
            }
            case '"':
              value += '"';
              break;
            case "\\":
              value += "\\";
              break;
            default:
              value += dataString[i];
              break;
          }
          break;
        case '"':
          if (isSingleLineBasic) {
            throw new TOMLError(`Incomplete string literal: ${dataString}`);
          }
          value += dataString[i];
          break
        default:
          value += dataString[i];
          break;
      }
    }
    return value;
  }
  _parseNumberOrDate(dataString: string): unknown {
    if (this._isDate(dataString)) {
      return new Date(dataString);
    }

    if (this._isLocalTime(dataString)) {
      return dataString;
    }

    // If binary / octal / hex
    const hex = /^(0(?:x|o|b)[0-9a-f_]*)/gi.exec(dataString);
    if (hex && hex[0]) {
      return hex[0].trim();
    }

    const testNumber = this._isParsableNumber(dataString);
    if (testNumber !== false && !isNaN(testNumber as number)) {
      return testNumber;
    }

    throw new TOMLError(`Invalid data format: ${dataString}`);
  }
  _isLocalTime(str: string): boolean {
    const reg = /(\d{2}):(\d{2}):(\d{2})/;
    return reg.test(str);
  }
  _isParsableNumber(dataString: string): number | boolean {
    const m = /((?:\+|-|)[0-9_\.e+\-]*)[^#]/i.exec(dataString);
    if (!m) {
      return false;
    } else {
      return parseFloat(m[0].replace(/_/g, ""));
    }
  }
  _isDate(dateStr: string): boolean {
    const reg = /\d{4}-\d{2}-\d{2}/;
    return reg.test(dateStr);
  }
  _parseDeclarationName(declaration: string): string[] {
    const names = new ParserSplitter(
      declaration,
      [Scopes.BASIC_STRING, Scopes.LITERAL_STRING],
    ).split(".");
    return names.map((name) => trim(name));
  }
  _parseLines(): void {
    for (let i = 0; i < this.tomlLines.length; i++) {
      const line = this.tomlLines[i];

      // TODO(zekth): Handle unflat of array of tables
      if (this._isGroup(line)) {
        // if the current group is an array we push the
        // parsed objects in it.
        if (
          this.context.currentGroup &&
          this.context.currentGroup.type === "array"
        ) {
          this.context.currentGroup.arrValues.push(
            this.context.currentGroup.objValues,
          );
          this.context.currentGroup.objValues = {};
        }
        // If we need to create a group or to change group
        if (
          !this.context.currentGroup ||
          (this.context.currentGroup &&
            this.context.currentGroup.name !==
              line.replace(/(\[|\])/g, ""))
        ) {
          this._createGroup(line);
          continue;
        }
      }
      if (this._isDeclaration(line)) {
        const kv = this._processDeclaration(line);
        const key = kv.key;
        const value = kv.value;
        if (!this.context.currentGroup) {
          this.context.output[key] = value;
        } else {
          this.context.currentGroup.objValues[key] = value;
        }
      }
    }
    if (this.context.currentGroup) {
      if (this.context.currentGroup.type === "array") {
        this.context.currentGroup.arrValues.push(
          this.context.currentGroup.objValues,
        );
      }
      this._groupToOutput();
    }
  }
  _cleanOutput(): void {
    this._unflatProperties(this.context.output);
    this._cleanKeys(this.context.output);
  }
  _unflatProperties(obj: Record<string, unknown>): void {
    const keys = Object.keys(obj);
    for (const k of keys) {
      let v = obj[k];
      const pathDeclaration = this._parseDeclarationName(k);
      const first = pathDeclaration.shift()!;
      if (first !== k) {
        if (pathDeclaration.length > 0) {
          const flatten = this._unflat(
            pathDeclaration,
            v as Record<string, unknown>,
          );
          const current = obj[first] instanceof Object ? obj[first] : {};
          v = deepAssign(
            current,
            flatten,
          );
        }
        delete obj[k];
        obj[first] = v;
      }
      if (v instanceof Object) {
        this._unflatProperties(v as Record<string, unknown>);
      }
    }
  }
  _cleanKeys(obj: Record<string, unknown>): void {
    const keys = Object.keys(obj);
    for (const k of keys) {
      const v = obj[k];
      if (k.startsWith('"') || k.startsWith("'")) {
        const parsed = this._parseString(k);
        delete obj[k];
        obj[parsed] = v;
      }
      if (v instanceof Object) {
        this._cleanKeys(v as Record<string, unknown>);
      }
    }
  }
  parse(): Record<string, unknown> {
    this._sanitize();
    this._parseLines();
    this._cleanOutput();
    return this.context.output;
  }
}

// Bare keys may only contain ASCII letters,
// ASCII digits, underscores, and dashes (A-Za-z0-9_-).
function joinKeys(keys: string[]): string {
  // Dotted keys are a sequence of bare or quoted keys joined with a dot.
  // This allows for grouping similar properties together:
  return keys
    .map((str: string): string => {
      return str.match(/[^A-Za-z0-9_-]/) ? `"${str}"` : str;
    })
    .join(".");
}

enum ArrayType {
  ONLY_PRIMITIVE,
  ONLY_OBJECT_EXCLUDING_ARRAY,
  MIXED,
}

class Dumper {
  maxPad = 0;
  srcObject: Record<string, unknown>;
  output: string[] = [];
  #arrayTypeCache = new Map<unknown[], ArrayType>();
  constructor(srcObjc: Record<string, unknown>) {
    this.srcObject = srcObjc;
  }
  dump(): string[] {
    // deno-lint-ignore no-explicit-any
    this.output = this.#printObject(this.srcObject as any);
    this.output = this.#format();
    return this.output;
  }
  #printObject(obj: Record<string, unknown>, keys: string[] = []): string[] {
    const out = [];
    const props = Object.keys(obj);
    const inlineProps = [];
    const multilinePorps = [];
    for (const prop of props) {
      if (this.#isSimplySerializable(obj[prop])) {
        inlineProps.push(prop);
      } else {
        multilinePorps.push(prop);
      }
    }
    const sortedProps = inlineProps.concat(multilinePorps);
    for (let i = 0; i < sortedProps.length; i++) {
      const prop = sortedProps[i];
      const value = obj[prop];
      if (value instanceof Date) {
        out.push(this.#dateDeclaration([prop], value));
      } else if (typeof value === "string" || value instanceof RegExp) {
        out.push(this.#strDeclaration([prop], value.toString()));
      } else if (typeof value === "number") {
        out.push(this.#numberDeclaration([prop], value));
      } else if (typeof value === "boolean") {
        out.push(this.#boolDeclaration([prop], value));
      } else if (
        value instanceof Array
      ) {
        const arrayType = this.#getTypeOfArray(value);
        if (arrayType === ArrayType.ONLY_PRIMITIVE) {
          out.push(this.#arrayDeclaration([prop], value));
        } else if (arrayType === ArrayType.ONLY_OBJECT_EXCLUDING_ARRAY) {
          // array of objects
          for (let i = 0; i < value.length; i++) {
            out.push("");
            out.push(this.#headerGroup([...keys, prop]));
            out.push(...this.#printObject(value[i], [...keys, prop]));
          }
        } else {
          // this is a complex array, use the inline format.
          const str = value.map((x) => this.#printAsInlineValue(x)).join(",");
          out.push(`${prop} = [${str}]`);
        }
      } else if (typeof value === "object") {
        out.push("");
        out.push(this.#header([...keys, prop]));
        if (value) {
          const toParse = value as Record<string, unknown>;
          out.push(...this.#printObject(toParse, [...keys, prop]));
        }
        // out.push(...this._parse(value, `${path}${prop}.`));
      }
    }
    out.push("");
    return out;
  }
  #isPrimitive(value: unknown): boolean {
    return value instanceof Date ||
      value instanceof RegExp ||
      ["string", "number", "boolean"].includes(typeof value);
  }
  #getTypeOfArray(arr: unknown[]): ArrayType {
    if (this.#arrayTypeCache.has(arr)) {
      return this.#arrayTypeCache.get(arr)!;
    }
    const type = this.#doGetTypeOfArray(arr);
    this.#arrayTypeCache.set(arr, type);
    return type;
  }
  #doGetTypeOfArray(arr: unknown[]): ArrayType {
    if (!arr.length) {
      // any type should be fine
      return ArrayType.ONLY_PRIMITIVE;
    }

    const onlyPrimitive = this.#isPrimitive(arr[0]);
    if (arr[0] instanceof Array) {
      return ArrayType.MIXED;
    }
    for (let i = 1; i < arr.length; i++) {
      if (
        onlyPrimitive !== this.#isPrimitive(arr[i]) || arr[i] instanceof Array
      ) {
        return ArrayType.MIXED;
      }
    }
    return onlyPrimitive
      ? ArrayType.ONLY_PRIMITIVE
      : ArrayType.ONLY_OBJECT_EXCLUDING_ARRAY;
  }
  #printAsInlineValue(value: unknown): string | number {
    if (value instanceof Date) {
      return `"${this.#printDate(value)}"`;
    } else if (typeof value === "string" || value instanceof RegExp) {
      return JSON.stringify(value.toString());
    } else if (typeof value === "number") {
      return value;
    } else if (typeof value === "boolean") {
      return value.toString();
    } else if (
      value instanceof Array
    ) {
      const str = value.map((x) => this.#printAsInlineValue(x)).join(",");
      return `[${str}]`;
    } else if (typeof value === "object") {
      if (!value) {
        throw new Error("should never reach");
      }
      const str = Object.keys(value).map((key) => {
        // deno-lint-ignore no-explicit-any
        return `${key} = ${this.#printAsInlineValue((value as any)[key])}`;
      }).join(",");
      return `{${str}}`;
    }

    throw new Error("should never reach");
  }
  #isSimplySerializable(value: unknown): boolean {
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value instanceof RegExp ||
      value instanceof Date ||
      (value instanceof Array &&
        this.#getTypeOfArray(value) !== ArrayType.ONLY_OBJECT_EXCLUDING_ARRAY)
    );
  }
  #header(keys: string[]): string {
    return `[${joinKeys(keys)}]`;
  }
  #headerGroup(keys: string[]): string {
    return `[[${joinKeys(keys)}]]`;
  }
  #declaration(keys: string[]): string {
    const title = joinKeys(keys);
    if (title.length > this.maxPad) {
      this.maxPad = title.length;
    }
    return `${title} = `;
  }
  #arrayDeclaration(keys: string[], value: unknown[]): string {
    return `${this.#declaration(keys)}${JSON.stringify(value)}`;
  }
  #strDeclaration(keys: string[], value: string): string {
    return `${this.#declaration(keys)}"${value}"`;
  }
  #numberDeclaration(keys: string[], value: number): string {
    switch (value) {
      case Infinity:
        return `${this.#declaration(keys)}inf`;
      case -Infinity:
        return `${this.#declaration(keys)}-inf`;
      default:
        return `${this.#declaration(keys)}${value}`;
    }
  }
  #boolDeclaration(keys: string[], value: boolean): string {
    return `${this.#declaration(keys)}${value}`;
  }
  #printDate(value: Date): string {
    function dtPad(v: string, lPad = 2): string {
      return v.padStart(lPad, "0");
    }
    const m = dtPad((value.getUTCMonth() + 1).toString());
    const d = dtPad(value.getUTCDate().toString());
    const h = dtPad(value.getUTCHours().toString());
    const min = dtPad(value.getUTCMinutes().toString());
    const s = dtPad(value.getUTCSeconds().toString());
    const ms = dtPad(value.getUTCMilliseconds().toString(), 3);
    // formatted date
    const fData = `${value.getUTCFullYear()}-${m}-${d}T${h}:${min}:${s}.${ms}`;
    return fData;
  }
  #dateDeclaration(keys: string[], value: Date): string {
    return `${this.#declaration(keys)}${this.#printDate(value)}`;
  }
  #format(): string[] {
    const rDeclaration = /(.*)\s=/;
    const out = [];
    for (let i = 0; i < this.output.length; i++) {
      const l = this.output[i];
      // we keep empty entry for array of objects
      if (l[0] === "[" && l[1] !== "[") {
        // empty object
        if (this.output[i + 1] === "") {
          i += 1;
          continue;
        }
        out.push(l);
      } else {
        const m = rDeclaration.exec(l);
        if (m) {
          out.push(l.replace(m[1], m[1].padEnd(this.maxPad)));
        } else {
          out.push(l);
        }
      }
    }
    // Cleaning multiple spaces
    const cleanedOutput = [];
    for (let i = 0; i < out.length; i++) {
      const l = out[i];
      if (!(l === "" && out[i + 1] === "")) {
        cleanedOutput.push(l);
      }
    }
    return cleanedOutput;
  }
}

/**
 * Stringify dumps source object into TOML string and returns it.
 * @param srcObj
 */
export function stringify(srcObj: Record<string, unknown>): string {
  return new Dumper(srcObj).dump().join("\n");
}

/**
 * Parse parses TOML string into an object.
 * @param tomlString
 */
export function parse(tomlString: string): Record<string, unknown> {
  // File is potentially using EOL CRLF
  tomlString = tomlString.replace(/\r\n/g, "\n");
  return new Parser(tomlString).parse();
}
