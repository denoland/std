// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
/**
 * {@linkcode parse} and {@linkcode stringify} for handling
 * [INI](https://en.wikipedia.org/wiki/INI_file) encoded data, such as the
 * [Desktop Entry specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/ar01s03.html).
 * Values are parsed as strings by default to preserve data parity from the original.
 * Customization is possible in the form of reviver/replacer functions like those in `JSON.parse` and `JSON.stringify`.
 * Nested sections, repeated key names within a section, multi-line values, and key/value arrays are not supported.
 * White space padding and lines starting with '#', ';', or '//' will be treated as comments.
 *
 * Optionally, {@linkcode IniMap} may be used for finer INI handling. Using this class will permit preserving
 * comments, accessing values like a map, iterating over key/value/section entries, and more.
 *
 * @example
 * ```ts
 * import { IniMap } from "https://deno.land/std@$STD_VERSION/encoding/ini.ts";
 * const ini = new IniMap();
 * ini.set("section1", "keyA", 100)
 * console.log(ini.toString())
 *
 * // =>
 * // [section1]
 * // keyA=100
 *
 * ini.set('keyA', 25)
 * console.log(ini.toObject())
 *
 * // =>
 * // {
 * //   keyA: 25,
 * //   section1: {
 * //     keyA: 100
 * //   }
 * // }
 * ```
 *
 * @module
 */

/** Options for providing formatting marks. */
export interface FormattingOptions {
  /** The character used to assign a value to a key; defaults to '='. */
  assignment?: string;
  /** Character(s) used to break lines in the config file; defaults to '\n'. Ignored on parse. */
  lineBreak?: string;
  /** Mark to use for setting comments; expects '#', ';', '//', defaults to '#' unless another mark is found. */
  comment?: string;
  /** Use a plain assignment char or pad with spaces; defaults to false. Ignored on parse. */
  pretty?: boolean;
}

/** Options for parsing INI strings. */
export interface ParseOptions {
  /** The character used to assign a value to a key; defaults to '='. */
  assignment?: FormattingOptions["assignment"];
  /** Provide custom parsing of the value in a key/value pair. */
  reviver?: ReviverFunction;
}

/** Options for constructing INI strings. */
export interface StringifyOptions extends FormattingOptions {
  /** Provide custom string conversion for the value in a key/value pair. */
  replacer?: ReplacerFunction;
}

/** Function for replacing JavaScript values with INI string values. */
export type ReplacerFunction = (
  key: string,
  // deno-lint-ignore no-explicit-any
  value: any,
  section?: string,
) => string;

/** Function for replacing INI values with JavaScript values. */
export type ReviverFunction = (
  key: string,
  // deno-lint-ignore no-explicit-any
  value: any,
  section?: string,
  // deno-lint-ignore no-explicit-any
) => any;

/** Parse an INI config string into an object. Provide formatting options to override the default assignment operator. */
export function parse(
  text: string,
  options?: ParseOptions,
): Record<string, unknown | Record<string, unknown>> {
  return IniMap.parse(text, options).toObject();
}

/** Compile an object into an INI config string. Provide formatting options to modify the output. */
export function stringify(
  // deno-lint-ignore no-explicit-any
  object: any,
  options?: StringifyOptions,
): string {
  return IniMap.from(object, options).toString(options?.replacer);
}

/** Class implementation for fine control of INI data structures. */
export class IniMap {
  #global = new Map<string, LineValue>();
  #sections = new Map<string, LineSection>();
  #lines: Line[] = [];
  #formatting: FormattingOptions;

  constructor(formatting?: FormattingOptions) {
    this.#formatting = this.#cleanFormatting(formatting);
  }

  /** Get the count of key/value pairs. */
  get size(): number {
    let size = this.#global.size;
    for (const { map } of this.#sections.values()) {
      size += map.size;
    }
    return size;
  }

  get formatting(): FormattingOptions {
    return this.#formatting;
  }

  /** Clear a single section or the entire INI. */
  clear(sectionName?: string): void {
    if (sectionName) {
      const section = this.#sections.get(sectionName);

      if (section) {
        section.map.clear();
        this.#sections.delete(sectionName);
        this.#lines.splice(section.num - 1, section.end - section.num);
      }
    } else {
      this.#global.clear();
      this.#sections.clear();
      this.#lines.length = 0;
    }
  }

  /** Delete a global key in the INI. */
  delete(key: string): boolean;
  /** Delete a section key in the INI. */
  delete(section: string, key: string): boolean;
  delete(keyOrSection: string, noneOrKey?: string): boolean {
    if (noneOrKey) {
      const section = this.#sections.get(keyOrSection);

      if (section) {
        const existing = section.map.get(noneOrKey);

        if (existing) {
          this.#appendOrDeleteLine(existing, LineOp.Del);
          return section.map.delete(noneOrKey);
        }
      }
    } else {
      const existing = this.#global.get(keyOrSection);

      if (existing) {
        this.#appendOrDeleteLine(existing, LineOp.Del);
        return this.#global.delete(keyOrSection);
      }
    }

    return false;
  }

  /** Get a value from a global key in the INI. */
  get(key: string): unknown;
  /** Get a value from a section key in the INI. */
  get(section: string, key: string): unknown;
  get(keyOrSection: string, noneOrKey?: string): unknown {
    return this.#getValue(keyOrSection, noneOrKey)?.val;
  }

  /** Check if a global key exists in the INI. */
  has(key: string): boolean;
  /** Check if a section key exists in the INI. */
  has(section: string, key: string): boolean;
  has(keyOrSection: string, noneOrKey?: string): boolean {
    if (noneOrKey) {
      const section = this.#sections.get(keyOrSection);

      return section?.map.has(noneOrKey) ?? false;
    }

    return this.#global.has(keyOrSection);
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

      this.#sections.set(args[0], section);
    } else {
      const lineValue: LineValue = {
        type: "value",
        num: 0,
        key: args[0],
        val: args[1],
      };
      this.#appendValue(lineValue);
      this.#global.set(args[0], lineValue);
    }

    return this;
  }

  /** Iterate over each entry in the INI to retrieve key, value, and section. */
  *entries(): Generator<
    [key: string, value: unknown, section?: string | undefined]
  > {
    for (const { key, val } of this.#global.values()) {
      yield [key, val];
    }
    for (const { map } of this.#sections.values()) {
      for (const { key, val, sec } of map.values()) {
        yield [key, val, sec];
      }
    }
  }

  /** Manage comments in the INI. */
  get comments(): Comments {
    return {
      clear: (): void => {
        this.#lines = this.#lines.filter((line) => line.type !== "comment");
      },
      deleteAtLine: (line: number): boolean => {
        const comment = this.#getComment(line);
        if (comment) {
          this.#appendOrDeleteLine(comment, LineOp.Del);
          return true;
        }
        return false;
      },
      deleteAtKey: (keyOrSection: string, noneOrKey?: string): boolean => {
        const lineValue = this.#getValue(keyOrSection, noneOrKey);
        if (lineValue) {
          return this.comments.deleteAtLine(lineValue.num - 1);
        }
        return false;
      },
      deleteAtSection: (sectionName: string): boolean => {
        const section = this.#sections.get(sectionName);
        if (section) {
          return this.comments.deleteAtLine(section.num - 1);
        }
        return false;
      },
      getAtLine: (line: number): string | undefined => {
        return this.#getComment(line)?.val;
      },
      getAtKey: (
        keyOrSection: string,
        noneOrKey?: string,
      ): string | undefined => {
        const lineValue = this.#getValue(keyOrSection, noneOrKey);
        if (lineValue) {
          return this.comments.getAtLine(lineValue.num - 1);
        }
      },
      getAtSection: (sectionName: string): string | undefined => {
        const section = this.#sections.get(sectionName);
        if (section) {
          return this.comments.getAtLine(section.num - 1);
        }
      },
      setAtLine: (line: number, text: string): Comments => {
        const comment = this.#getComment(line);
        const mark = this.#formatting.comment ?? "#";
        const formatted = text.startsWith(mark) || text === ""
          ? text
          : `${mark} ${text}`;
        if (comment) {
          comment.val = formatted;
        } else {
          if (line > this.#lines.length) {
            for (let i = this.#lines.length + 1; i < line; i += 1) {
              this.#appendOrDeleteLine({
                type: "comment",
                num: i,
                val: "",
              }, LineOp.Add);
            }
          }
          this.#appendOrDeleteLine({
            type: "comment",
            num: line,
            val: formatted,
          }, LineOp.Add);
        }
        return this.comments;
      },
      setAtKey: (
        ...args: [keyOrSection: string, textOrKey: string, noneOrText?: string]
      ): Comments => {
        if (args.length > 2) {
          const lineValue = this.#getValue(args[0], args[1]);
          if (lineValue) {
            if (this.#getComment(lineValue.num - 1)) {
              this.comments.setAtLine(lineValue.num - 1, args[2]!);
            } else {
              this.comments.setAtLine(lineValue.num, args[2]!);
            }
          }
        } else {
          const lineValue = this.#getValue(args[0]);
          if (lineValue) {
            if (this.#getComment(lineValue.num - 1)) {
              this.comments.setAtLine(lineValue.num - 1, args[1]);
            } else {
              this.comments.setAtLine(lineValue.num, args[1]);
            }
          }
        }
        return this.comments;
      },
      setAtSection: (sectionName: string, text: string): Comments => {
        const section = this.#sections.get(sectionName);
        if (section) {
          if (this.#getComment(section.num - 1)) {
            this.comments.setAtLine(section.num - 1, text);
          } else {
            this.comments.setAtLine(section.num, text);
          }
        }
        return this.comments;
      },
    };
  }

  #getOrCreateSection(section: string): LineSection {
    const existing = this.#sections.get(section);

    if (existing) {
      return existing;
    }

    const lineSection: LineSection = {
      type: "section",
      num: this.#lines.length + 1,
      sec: section,
      map: new Map<string, LineValue>(),
      end: this.#lines.length + 1,
    };
    this.#lines.push(lineSection);
    return lineSection;
  }

  #getValue(keyOrSection: string, noneOrKey?: string): LineValue | undefined {
    if (noneOrKey) {
      const section = this.#sections.get(keyOrSection);

      return section?.map.get(noneOrKey);
    }

    return this.#global.get(keyOrSection);
  }

  #getComment(line: number): LineComment | undefined {
    const comment: Line | undefined = this.#lines[line - 1];
    if (comment?.type === "comment") {
      return comment;
    }
  }

  #appendValue(lineValue: LineValue): void {
    if (this.#lines.length === 0) {
      // For an empty aray, just insert the line value
      lineValue.num = 1;
      this.#lines.push(lineValue);
    } else if (lineValue.sec) {
      // For line values in a section, the end of the section is known
      this.#appendOrDeleteLine(lineValue, LineOp.Add);
    } else {
      // For global values, find the line preceding the first section
      let i = 0;
      for (; i < this.#lines.length; i += 1) {
        if (this.#lines[i].type === "section") {
          break;
        }
      }
      lineValue.num = i + 1;
      // Append the line value at the end of all global values
      this.#appendOrDeleteLine(lineValue, LineOp.Add);
    }
  }

  #appendOrDeleteLine(input: Line, op: LineOp) {
    if (op === LineOp.Add) {
      this.#lines.splice(input.num - 1, 0, input);
    } else {
      this.#lines.splice(input.num - 1, 1);
    }
    const { length } = this.#lines;
    // If the input is a comment, find the next section if any to update.
    let updateSection = input.type === "comment";
    for (let i = input.num; i < length; i += 1) {
      const line = this.#lines[i];
      line.num += op;
      if (line.type === "section") {
        line.end += op;
        // If the comment is before the nearest section, don't update the section further.
        updateSection = false;
      }
      if (updateSection) {
        // if the comment precedes a value in a section, get and update the section end.
        if (line.type === "value" && line.sec) {
          const section = this.#sections.get(line.sec);

          if (section) {
            section.end += op;
            updateSection = false;
          }
        }
      }
    }
  }

  *#readTextLines(text: string): Generator<string> {
    const lineBreak = "\r\n";
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
            if (!this.#formatting.lineBreak) {
              this.#formatting.lineBreak = char + ahead;
            }
            lineBreakLength = 1;
          } else {
            if (!this.#formatting.lineBreak) {
              this.#formatting.lineBreak = char;
            }
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

  #cleanFormatting(options?: FormattingOptions): FormattingOptions {
    return Object.fromEntries(
      Object.entries(options ?? {}).filter(([key]) =>
        FormattingKeys.includes(key as keyof FormattingOptions)
      ),
    );
  }

  /** Convert this `IniMap` to a plain object. */
  toObject(): Record<string, unknown | Record<string, unknown>> {
    const obj: Record<string, unknown | Record<string, unknown>> = {};

    for (const { key, val } of this.#global.values()) {
      Object.defineProperty(obj, key, {
        value: val,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    for (const { sec, map } of this.#sections.values()) {
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
    const pretty = this.#formatting?.pretty ?? false;
    const assignmentMark = (this.#formatting?.assignment ?? "=")[0];
    const assignment = pretty ? ` ${assignmentMark} ` : assignmentMark;

    return this.#lines.map((line) => {
      switch (line.type) {
        case "comment":
          return line.val;
        case "section":
          return `[${line.sec}]`;
        case "value":
          return line.key + assignment +
            replacerFunc(line.key, line.val, line.sec);
      }
    }).join(this.#formatting?.lineBreak ?? "\n");
  }

  /** Parse an INI string in this `IniMap`. */
  parseIni(text: string, reviver?: ReviverFunction): this {
    if (typeof text !== "string") {
      throw new SyntaxError(`Unexpected token ${text} in INI at line 0`);
    }
    const reviverFunc: ReviverFunction = typeof reviver === "function"
      ? reviver
      : (_key, value, _section) => value;
    const assignment = (this.#formatting.assignment ?? "=").substring(0, 1);
    let lineNumber = 1;
    let currentSection: LineSection | undefined;

    for (const line of this.#readTextLines(text)) {
      const trimmed = line.trim();
      if (isComment(trimmed)) {
        // If comment formatting mark is not set, discover it.
        if (!this.#formatting.comment) {
          const mark = trimmed[0];
          if (mark) {
            // if mark is truthy, use the character.
            this.#formatting.comment = mark === "/" ? "//" : mark;
          }
        }
        this.#lines.push({
          type: "comment",
          num: lineNumber,
          val: trimmed,
        });
      } else if (isSection(trimmed, lineNumber)) {
        const sec = trimmed.substring(1, trimmed.length - 1);

        if (sec.trim() === "") {
          throw new SyntaxError(
            `Unexpected empty section name at line ${lineNumber}`,
          );
        }

        currentSection = {
          type: "section",
          num: lineNumber,
          sec,
          map: new Map<string, LineValue>(),
          end: lineNumber,
        };
        this.#lines.push(currentSection);
        this.#sections.set(currentSection.sec, currentSection);
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

        const leftHand = trimmed.substring(0, assignmentPos);
        const rightHand = trimmed.substring(assignmentPos + 1);

        if (this.#formatting.pretty === undefined) {
          this.#formatting.pretty = leftHand.endsWith(" ") &&
            rightHand.startsWith(" ");
        }

        const key = leftHand.trim();
        const value = rightHand.trim();

        if (currentSection) {
          const lineValue: LineValue = {
            type: "value",
            num: lineNumber,
            sec: currentSection.sec,
            key,
            val: reviverFunc(key, value, currentSection.sec),
          };
          currentSection.map.set(key, lineValue);
          this.#lines.push(lineValue);
          currentSection.end = lineNumber;
        } else {
          const lineValue: LineValue = {
            type: "value",
            num: lineNumber,
            key,
            val: reviverFunc(key, value),
          };
          this.#global.set(key, lineValue);
          this.#lines.push(lineValue);
        }
      }

      lineNumber += 1;
    }

    return this;
  }

  /** Parse an INI string to an `IniMap`. */
  static parse(
    text: string,
    options?: ParseOptions & FormattingOptions,
  ): IniMap {
    return new IniMap(options).parseIni(text, options?.reviver);
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

export interface Comments {
  /** Clear all comments in the INI. */
  clear(): void;
  /** Delete a comment at a specific line in the INI. */
  deleteAtLine(line: number): boolean;
  /** Delete a comment before a global key in the INI. */
  deleteAtKey(key: string): boolean;
  /** Delete a comment before a section key in the INI. */
  deleteAtKey(section: string, key: string): boolean;
  /** Delete a comment before a section line in the INI. */
  deleteAtSection(section: string): boolean;
  /** Get a comment at a specific line in the INI. */
  getAtLine(line: number): string | undefined;
  /** Get a comment before a global key in the INI. */
  getAtKey(key: string): string | undefined;
  /** Get a comment before a section key in the INI. */
  getAtKey(section: string, key: string): string | undefined;
  /** Get a comment before a section line in the INI. */
  getAtSection(section: string): string | undefined;
  /** Set a comment at a specific line in the INI. */
  setAtLine(line: number, text: string): Comments;
  /** Set a comment before a global key in the INI. */
  setAtKey(key: string, text: string): Comments;
  /** Set a comment before a section key in the INI. */
  setAtKey(section: string, key: string, text: string): Comments;
  /** Set a comment before a section line in the INI. */
  setAtSection(section: string, text: string): Comments;
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

type LineOp = typeof LineOp[keyof typeof LineOp];
const LineOp = {
  Del: -1,
  Add: 1,
} as const;
const DummyFormatting: Required<FormattingOptions> = {
  assignment: "",
  lineBreak: "",
  pretty: false,
  comment: "",
};
const FormattingKeys = Object.keys(
  DummyFormatting,
) as (keyof FormattingOptions)[];

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
