// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/*
 * Basic INI-style config parser/compiler to handle key-value pairs and sections as raw as possible.
 * Values are parsed as strings by default to preserve data parity from the original.
 * BYO value transformer in the form of reviver/replacer like JSON.parse/JSON.stringify.
 * Nested sections, repeated key names within a section, multi-line values, and key/value arrays are not supported.
 * White space padding and comment lines starting with '#', ';', or '//' will be skipped completely.
 */

export interface FormattingOptions {
  /** The character used to assign a value to a key; defaults to '='. */
  assignment?: string;
  /** Character(s) used to break lines in the config file; defaults to '\n'. Ignored on parse. */
  lineBreak?: string;
  /** Use a plain assignment char or pad with spaces; defaults to false. Ignored on parse. */
  pretty?: boolean;
}

export interface ParseOptions {
  /** The character used to assign a value to a key; defaults to '='. */
  assignment?: FormattingOptions["assignment"];
  /** Provide custom parsing of the value in a key/value pair. */
  reviver?: ReviverFunction;
}

export interface StringifyOptions extends FormattingOptions {
  /** Provide custom string conversion for the value in a key/value pair. */
  replacer?: ReplacerFunction;
}

export type ReplacerFunction = (
  key: string,
  // deno-lint-ignore no-explicit-any
  value: any,
  section?: string,
) => string;

export type ReviverFunction = (
  key: string,
  // deno-lint-ignore no-explicit-any
  value: any,
  section?: string,
  // deno-lint-ignore no-explicit-any
) => any;

/** Parse an INI config string into an object. Provide formatting options to override the default assignment operator. */
export function parse(
  str: string,
  options?: ParseOptions,
): Record<string, unknown | Record<string, unknown>> {
  return IniMap.parse(str, options).toObject();
}

/** Compile an object into an INI config string. Provide formatting options to modify the output. */
export function stringify(
  // deno-lint-ignore no-explicit-any
  obj: any,
  options?: StringifyOptions,
): string {
  return IniMap.from(obj, options).toString(options?.replacer);
}

export class IniMap {
  private global = new Map<string, LineValue>();
  private sections = new Map<string, LineSection>();
  private lines: Line[] = [];
  private formatting: FormattingOptions;

  constructor(formatting?: FormattingOptions) {
    this.formatting = { ...(formatting ?? {}) };
  }

  /** Clear a single section or the entire INI. */
  clear(sectionName?: string): void {
    if (sectionName) {
      const section = this.sections.get(sectionName);

      if (section) {
        section.map.clear();
        this.sections.delete(sectionName);
        this.lines.splice(section.num - 1, section.end - section.num);
      }
    } else {
      this.global.clear();
      this.sections.clear();
      this.lines.length = 0;
    }
  }

  /** Delete a global key in the INI. */
  delete(key: string): boolean;
  /** Delete a section key in the INI. */
  delete(section: string, key: string): boolean;
  delete(...args: [keyOrSection: string, noneOrKey?: string]): boolean {
    if (args.length > 1) {
      const section = this.sections.get(args[0]);

      if (section) {
        const existing = section.map.get(args[1]!);

        if (existing) {
          this.#deleteValue(existing);
          return section.map.delete(args[1]!);
        }
      }
    } else {
      const existing = this.global.get(args[0]);

      if (existing) {
        this.#deleteValue(existing);
        return this.global.delete(args[0]);
      }
    }

    return false;
  }

  /** Get a value from a global key in the INI. */
  get(key: string): unknown;
  /** Get a value from a section key in the INI. */
  get(section: string, key: string): unknown;
  get(...args: [keyOrSection: string, noneOrKey?: string]): unknown {
    if (args.length > 1) {
      const section = this.sections.get(args[0]);

      return section?.map.get(args[1]!);
    }

    return this.global.get(args[0]);
  }

  /** Check if a global key exists in the INI. */
  has(key: string): boolean;
  /** Check if a section key exists in the INI. */
  has(section: string, key: string): boolean;
  has(...args: [keyOrSection: string, noneOrKey?: string]): boolean {
    if (args.length > 1) {
      const section = this.sections.get(args[0]);

      return section?.map.has(args[1]!) ?? false;
    }

    return this.global.has(args[0]);
  }

  /** Set the value of a global key in the INI. */
  // deno-lint-ignore no-explicit-any
  set(key: string, value: any): this;
  /** Set the value of a section key in the INI. */
  // deno-lint-ignore no-explicit-any
  set(section: string, key: string, value: any): this;
  set(
    // deno-lint-ignore no-explicit-any
    ...args: [keyOrSection: string, valueOrKey: any, value?: any]
  ): this {
    if (args.length > 2) {
      const section = this.#getOrCreateSection(args[0]);
      const existing = section.map.get(args[1]);

      if (existing) {
        existing.val = args[2];
      } else {
        section.end += 1;
        const lineValue: LineValue = {
          type: "value",
          num: section.end,
          sec: section.sec,
          key: args[1],
          val: args[2],
        };
        this.#appendValue(lineValue);
        section.map.set(args[1], lineValue);
      }

      this.sections.set(args[0], section);
    } else {
      const lineValue: LineValue = {
        type: "value",
        num: 0,
        key: args[0],
        val: args[1],
      };
      this.#appendValue(lineValue);
      this.global.set(args[0], lineValue);
    }

    return this;
  }

  /** Iterate over each entry in the INI to retrieve key, value, and section. */
  *entries(): Generator<[key: string, value: unknown, section?: string]> {
    for (const { key, val } of this.global.values()) {
      yield [key, val];
    }
    for (const { map } of this.sections.values()) {
      for (const { key, val, sec } of map.values()) {
        yield [key, val, sec];
      }
    }
  }

  #getOrCreateSection(section: string): LineSection {
    const existing = this.sections.get(section);

    if (existing) {
      return existing;
    }

    const lineSection: LineSection = {
      type: "section",
      num: this.lines.length + 1,
      sec: section,
      map: new Map<string, LineValue>(),
      end: this.lines.length + 1,
    };
    this.lines.push(lineSection);
    return lineSection;
  }

  #appendValue(lineValue: LineValue): void {
    if (lineValue.sec) {
      // For line values in a section, the end of the section is known
      this.lines.splice(lineValue.num - 1, 0, lineValue);
      const { length } = this.lines;
      for (let i = lineValue.num; i < length; i += 1) {
        const line = this.lines[i];
        line.num += 1;
        if (line.type === "section") line.end += 1;
      }
    } else if (this.lines.length === 0) {
      // For an empty aray, just insert the line value
      lineValue.num = 1;
      this.lines.push(lineValue);
    } else {
      // For global values, find the line preceding the first section
      let i = 0;
      for (; i < this.lines.length; i += 1) {
        if (this.lines[i].type === "section") {
          break;
        }
      }
      lineValue.num = i;
      // Append the line value at the end of all global values
      this.lines.splice(lineValue.num - 1, 0, lineValue);
      const { length } = this.lines;
      for (; i < length; i += 1) {
        const line = this.lines[i];
        line.num += 1;
        if (line.type === "section") line.end += 1;
      }
    }
  }

  #deleteValue(lineValue: LineValue): void {
    this.lines.splice(lineValue.num - 1, 1);
    const { length } = this.lines;
    for (let i = lineValue.num - 1; i < length; i += 1) {
      const line = this.lines[i];
      line.num -= 1;
      if (line.type === "section") line.end -= 1;
    }
  }

  /** Convert this `IniMap` to a plain object. */
  toObject(): Record<string, unknown | Record<string, unknown>> {
    const obj: Record<string, unknown | Record<string, unknown>> = {};

    for (const { key, val } of this.global.values()) {
      Object.defineProperty(obj, key, {
        value: val,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    for (const { sec, map } of this.sections.values()) {
      const section: Record<string, unknown> = {};
      Object.defineProperty(obj, sec, {
        value: section,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      for (const { key, val } of map.values()) {
        Object.defineProperty(section, key, {
          value: val,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    return obj;
  }

  /** Convenience method for `JSON.stringify`. */
  toJSON() {
    return this.toObject();
  }

  /** Convert this `IniMap` to an INI string. */
  toString(replacer?: ReplacerFunction): string {
    const replacerFunc: ReplacerFunction = typeof replacer === "function"
      ? replacer
      : (_key, value, _section) => `${value}`;
    const pretty = this.formatting?.pretty ?? false;
    const assign = () => (this.formatting?.assignment ?? "=").substring(0, 1);
    const assignment = pretty ? ` ${assign()} ` : assign();

    return this.lines.map((line) => {
      switch (line.type) {
        case "comment":
          return line.val;
        case "section":
          return `[${line.sec}]`;
        case "value":
          return line.key + assignment +
            replacerFunc(line.key, line.val, line.sec);
      }
    }).join(this.formatting?.lineBreak ?? "\n");
  }

  /** Parse an INI string to an `IniMap`. */
  static parse(
    str: string,
    options?: ParseOptions & FormattingOptions,
  ): IniMap {
    if (typeof str !== "string") {
      throw new SyntaxError(`Unexpected token ${str} in INI at line 0`);
    }
    const ini = new IniMap(options);
    const reviverFunc: ReviverFunction = typeof options?.reviver === "function"
      ? options.reviver
      : (_key, value, _section) => value;
    const assignment = (ini.formatting?.assignment ?? "=").substring(0, 1);
    let lineNumber = 1;
    let currentSection: LineSection | undefined;

    for (const line of readLines(str)) {
      const trimmed = line.trim();

      if (isComment(trimmed)) {
        ini.lines.push({
          type: "comment",
          num: lineNumber += 1,
          val: trimmed,
        });
      } else if (isSection(trimmed, lineNumber)) {
        const sec = trimmed.substring(1, trimmed.length - 1);

        if (sec.trim() === "") {
          throw new SyntaxError(
            `Unexpected empty section name at line ${lineNumber}`,
          );
        }

        const num = lineNumber += 1;
        currentSection = {
          type: "section",
          num,
          sec,
          map: new Map<string, LineValue>(),
          end: num,
        };
        ini.lines.push(currentSection);
        ini.sections.set(currentSection.sec, currentSection);
      } else {
        const assignmentPos = trimmed.indexOf(assignment);

        if (assignmentPos === -1) {
          throw new SyntaxError(
            `Unexpected token ${trimmed[0]} in INI at line ${lineNumber}`,
          );
        }
        if (assignmentPos === 0) {
          throw new SyntaxError(
            `Unexpected empty key name at line ${lineNumber}`,
          );
        }

        const key = trimmed.substring(0, assignmentPos).trim();
        const value = trimmed.substring(assignmentPos + 1).trim();

        if (currentSection) {
          const num = lineNumber += 1;
          const lineValue: LineValue = {
            type: "value",
            num,
            sec: currentSection.sec,
            key,
            val: reviverFunc(key, value, currentSection.sec),
          };
          currentSection.map.set(key, lineValue);
          ini.lines.push(lineValue);
          currentSection.end = num;
        } else {
          const lineValue: LineValue = {
            type: "value",
            num: lineNumber += 1,
            key,
            val: reviverFunc(key, value),
          };
          ini.global.set(key, lineValue);
          ini.lines.push(lineValue);
        }
      }
    }

    return ini;
  }

  /** Create an `IniMap` from a plain object. */
  static from(
    // deno-lint-ignore no-explicit-any
    input: Record<string, any>,
    formatting?: FormattingOptions,
  ): IniMap {
    const ini = new IniMap(formatting);
    // deno-lint-ignore no-explicit-any
    const isRecord = (val: any): val is Record<string, any> =>
      typeof val === "object" && val !== null;
    // deno-lint-ignore no-explicit-any
    const sort = ([_a, valA]: [string, any], [_b, valB]: [string, any]) => {
      if (isRecord(valA)) return 1;
      if (isRecord(valB)) return -1;
      return 0;
    };

    for (const [key, val] of Object.entries(input).sort(sort)) {
      if (isRecord(val)) {
        for (const [sectionKey, sectionValue] of Object.entries(val)) {
          ini.set(key, sectionKey, sectionValue);
        }
      } else {
        ini.set(key, val);
      }
    }

    return ini;
  }
}

function* readLines(input?: string) {
  const lineBreak = "\r\n";
  const text = input ?? "";
  const { length } = text;
  let lineBreakLength = -1;
  let line = "";

  for (let i = 0; i < length; i += 1) {
    const char = text[i];

    if (lineBreak.includes(char)) {
      yield line;
      line = "";
      if (lineBreakLength === -1) {
        const ahead = text[i + 1];
        if (
          ahead !== undefined && ahead !== char && lineBreak.includes(ahead)
        ) {
          lineBreakLength = 1;
        } else {
          lineBreakLength = 0;
        }
      }
      i += lineBreakLength;
    } else {
      line += char;
    }
  }

  yield line;
}

/** Detect supported comment styles. */
function isComment(input: string): boolean {
  return input === "" ||
    input.startsWith("#") ||
    input.startsWith(";") ||
    input.startsWith("//");
}

/** Detect a section start. */
function isSection(input: string, lineNumber: number): boolean {
  if (input.startsWith("[")) {
    if (input.endsWith("]")) {
      return true;
    }
    throw new SyntaxError(
      `Unexpected end of INI section at line ${lineNumber}`,
    );
  }
  return false;
}

interface LineComment {
  type: "comment";
  num: number;
  val: string;
}

interface LineSection {
  type: "section";
  num: number;
  sec: string;
  map: Map<string, LineValue>;
  end: number;
}

interface LineValue {
  type: "value";
  num: number;
  sec?: string;
  key: string;
  // deno-lint-ignore no-explicit-any
  val: any;
}

type Line = LineComment | LineSection | LineValue;
