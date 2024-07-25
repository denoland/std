// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Options for providing formatting marks. */
export interface FormattingOptions {
  /**
   * The character used to assign a value to a key; defaults to '='.
   *
   * @default {"="}
   */
  assignment?: string;
  /**
   * Character(s) used to break lines in the config file. Ignored on parse.
   *
   * @default {"\n"}
   */
  lineBreak?: "\n" | "\r\n" | "\r";
  /**
   * Mark to use for setting comments.
   *
   * @default {"#"}
   */
  commentChar?: "#" | ";" | "//";
  /**
   * Use a plain assignment char or pad with spaces. Ignored on parse.
   *
   * @default {false}
   */
  pretty?: boolean;
  /**
   * Filter duplicate keys from INI string output.
   *
   * @default {false}
   */
  deduplicate?: boolean;
}

/** Options for parsing INI strings. */
interface ParseOptions {
  /** Provide custom parsing of the value in a key/value pair. */
  reviver?: ReviverFunction;
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

/**
 * Class implementation for fine control of INI data structures.
 */
export class IniMap {
  #global = new Map<string, LineValue>();
  #sections = new Map<string, LineSection>();
  #lines: Line[] = [];
  #comments: Comments = {
    clear: (): void => {
      this.#lines = this.#lines.filter((line) => line.type !== "comment");
      for (const [i, line] of this.#lines.entries()) {
        if (line.type === "section") {
          line.end = line.end - line.num + i + 1;
        }
        line.num = i + 1;
      }
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
      const mark = this.#formatting.commentChar ?? "#";
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
      keyOrSection: string,
      textOrKey: string,
      noneOrText?: string,
    ): Comments => {
      if (noneOrText !== undefined) {
        const lineValue = this.#getValue(keyOrSection, textOrKey);
        if (lineValue) {
          if (this.#getComment(lineValue.num - 1)) {
            this.comments.setAtLine(lineValue.num - 1, noneOrText);
          } else {
            this.comments.setAtLine(lineValue.num, noneOrText);
          }
        }
      } else {
        const lineValue = this.#getValue(keyOrSection);
        if (lineValue) {
          if (this.#getComment(lineValue.num - 1)) {
            this.comments.setAtLine(lineValue.num - 1, textOrKey);
          } else {
            this.comments.setAtLine(lineValue.num, textOrKey);
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
  #formatting: FormattingOptions;

  /** Constructs a new `IniMap`.
   *
   * @param formatting Optional formatting options when printing an INI file.
   */
  constructor(formatting?: FormattingOptions) {
    this.#formatting = this.#cleanFormatting(formatting);
  }

  /**
   * Gets the count of key/value pairs.
   *
   * @returns The number of key/value pairs.
   */
  get size(): number {
    let size = this.#global.size;
    for (const { map } of this.#sections.values()) {
      size += map.size;
    }
    return size;
  }

  /**
   * Gets the formatting options.
   *
   * @returns The formatting options
   */
  get formatting(): FormattingOptions {
    return this.#formatting;
  }

  /** Returns the comments in the INI.
   *
   * @returns The comments
   */
  get comments(): Comments {
    return this.#comments;
  }

  /**
   * Clears a single section or the entire INI.
   *
   * @param sectionName The section name to clear
   */
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

  /**
   * Deletes a global key in the INI.
   *
   * @param key The key to delete
   * @returns `true` if the key was deleted, `false` if not found.
   */
  delete(key: string): boolean;
  /**
   * Deletes a section key in the INI.
   *
   * @param section The section
   * @param key The key to delete
   * @returns `true` if the section was deleted, `false` if not found.
   */
  delete(section: string, key: string): boolean;
  delete(keyOrSection: string, noneOrKey?: string): boolean {
    const exists = this.#getValue(keyOrSection, noneOrKey);
    if (exists) {
      this.#appendOrDeleteLine(exists, LineOp.Del);
      if (exists.sec) {
        return this.#sections.get(exists.sec)!.map.delete(exists.key);
      } else {
        return this.#global.delete(exists.key);
      }
    }

    return false;
  }

  /**
   * Gets a value from a global key in the INI.
   *
   * @param key The key to get
   * @returns The value for the key, or undefined if the key doesn't have a value
   */
  get(key: string): unknown;
  /** Get a value from a section key in the INI.
   *
   * @param section The section
   * @param key The key to get
   * @returns The value for the key, or undefined if the key doesn't have a value
   */
  get(section: string, key: string): unknown;
  get(keyOrSection: string, noneOrKey?: string): unknown {
    return this.#getValue(keyOrSection, noneOrKey)?.val;
  }

  /**
   * Check if a global key exists in the INI.
   *
   * @param key The key to check
   * @returns `true` if the key has the value, `false` otherwise
   */
  has(key: string): boolean;
  /** Check if a section key exists in the INI.
   *
   * @param section The section
   * @param key The key to check
   * @returns `true` if the key has the value in the given section, `false` otherwise
   */
  has(section: string, key: string): boolean;
  has(keyOrSection: string, noneOrKey?: string): boolean {
    return this.#getValue(keyOrSection, noneOrKey) !== undefined;
  }

  /**
   * Set the value of a global key in the INI.
   *
   * @param key The key to set the value
   * @param value The value to set
   * @returns The map object itself
   */
  set(key: string, value: unknown): this;
  /**
   * Set the value of a section key in the INI.
   *
   * @param section The section
   * @param key The key to set
   * @param value The value to set
   * @return The map object itself
   */
  set(section: string, key: string, value: unknown): this;
  // deno-lint-ignore no-explicit-any
  set(keyOrSection: string, valueOrKey: any, value?: any): this {
    if (typeof valueOrKey === "string" && value !== undefined) {
      const section = this.#getOrCreateSection(keyOrSection);
      const exists = section.map.get(valueOrKey);

      if (exists) {
        exists.val = value;
      } else {
        section.end += 1;
        const lineValue: LineValue = {
          type: "value",
          num: section.end,
          sec: section.sec,
          key: valueOrKey,
          val: value,
        };
        this.#appendValue(lineValue);
        section.map.set(valueOrKey, lineValue);
      }
    } else {
      const lineValue: LineValue = {
        type: "value",
        num: 0, // Simply set to zero since we have to find the end ofthe global keys
        key: keyOrSection,
        val: valueOrKey,
      };
      this.#appendValue(lineValue);
      this.#global.set(keyOrSection, lineValue);
    }

    return this;
  }

  /**
   * Iterate over each entry in the INI to retrieve key, value, and section.
   *
   * @returns The iterator of entries
   */
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
    this.#sections.set(section, lineSection);
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
      // For an empty array, just insert the line value
      lineValue.num = 1;
      this.#lines.push(lineValue);
    } else if (lineValue.sec) {
      // For line values in a section, the end of the section is known
      this.#appendOrDeleteLine(lineValue, LineOp.Add);
    } else {
      // For global values, find the line preceding the first section
      lineValue.num = this.#lines.length + 1;
      for (const [i, line] of this.#lines.entries()) {
        if (line.type === "section") {
          lineValue.num = i + 1;
          break;
        }
      }
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
    // If the input is a comment, find the next section if any to update.
    let updateSection = input.type === "comment";
    const start = op === LineOp.Add ? input.num : input.num - 1;
    for (const line of this.#lines.slice(start)) {
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
    const { length } = text;
    let line = "";

    for (let i = 0; i < length; i += 1) {
      const char = text[i]!;

      if (char === "\n" || char === "\r") {
        yield line;
        line = "";
        if (char === "\r" && text[i + 1] === "\n") {
          i++;
          if (!this.#formatting.lineBreak) {
            this.#formatting.lineBreak = "\r\n";
          }
        } else if (!this.#formatting.lineBreak) {
          this.#formatting.lineBreak = char;
        }
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

  /**
   * Convert this `IniMap` to a plain object.
   *
   * @returns The object equivalent to this {@code IniMap}
   */
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

  /**
   * Convenience method for `JSON.stringify`.
   *
   * @returns The object equivalent to this {@code IniMap}
   */
  toJSON(): Record<string, unknown | Record<string, unknown>> {
    return this.toObject();
  }

  /**
   * Convert this `IniMap` to an INI string.
   *
   * @param replacer The replacer
   * @returns Ini string
   */
  toString(replacer?: ReplacerFunction): string {
    const replacerFunc: ReplacerFunction = typeof replacer === "function"
      ? replacer
      : (_key, value, _section) => `${value}`;
    const pretty = this.#formatting?.pretty ?? false;
    const assignmentMark = (this.#formatting?.assignment ?? "=")[0];
    const assignment = pretty ? ` ${assignmentMark} ` : assignmentMark;
    const lines = this.#formatting.deduplicate
      ? this.#lines.filter((lineA, index, self) => {
        if (lineA.type === "value") {
          const lastIndex = self.findLastIndex((lineB) => {
            return lineA.sec === (lineB as LineValue).sec &&
              lineA.key === (lineB as LineValue).key;
          });
          return index === lastIndex;
        }
        return true;
      })
      : this.#lines;

    return lines.map((line) => {
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

  /**
   * Parse an INI string in this `IniMap`.
   *
   * @param text The text to parse
   * @param reviver The reviver function
   * @returns This {@code IniMap} object
   */
  parse(text: string, reviver?: ReviverFunction): this {
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
        if (!this.#formatting.commentChar) {
          const mark = trimmed[0];
          if (mark) {
            // if mark is truthy, use the character.
            this.#formatting.commentChar = mark === "/"
              ? "//"
              : mark as "#" | ";";
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

  /**
   * Create an `IniMap` from an INI string.
   *
   * @param input The input string
   * @param options The options to use
   * @returns The parsed {@code IniMap}
   */
  static from(
    input: string,
    options?: ParseOptions & FormattingOptions,
  ): IniMap;
  /**
   * Create an `IniMap` from a plain object.
   *
   * @param input The input string
   * @param formatting The options to use
   * @returns The parsed {@code IniMap}
   */
  static from(
    input: Record<string, unknown>,
    formatting?: FormattingOptions,
  ): IniMap;
  static from(
    // deno-lint-ignore no-explicit-any
    input: Record<string, any> | string,
    formatting?: ParseOptions & FormattingOptions,
  ): IniMap {
    const ini = new IniMap(formatting);
    if (typeof input === "object" && input !== null) {
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
    } else {
      ini.parse(input, formatting?.reviver);
    }
    return ini;
  }
}

/** Manages comments within the INI file. */
export interface Comments {
  /**
   * Clear all comments in the INI.
   */
  clear(): void;
  /**
   * Delete a comment at a specific line in the INI.
   *
   * @param line The line to delete the comment at
   * @returns `true` if a comment was deleted, otherwise `false`.
   */
  deleteAtLine(line: number): boolean;
  /**
   * Delete a comment before a global key in the INI.
   *
   * @param key The key to delete the comment at
   * @returns `true` if a comment was deleted, otherwise `false`.
   */
  deleteAtKey(key: string): boolean;
  /**
   * Delete a comment before a section key in the INI.
   *
   * @param section The section
   * @param key The key to delete the comment at
   * @returns `true` if a comment was deleted, otherwise `false`.
   */
  deleteAtKey(section: string, key: string): boolean;
  /**
   * Delete a comment before a section line in the INI.
   *
   * @param section The section to delete the comment at
   * @returns `true` if a comment was deleted, otherwise `false`.
   */
  deleteAtSection(section: string): boolean;
  /**
   * Get the comment text at a specific line in the INI.
   *
   * @param line The line to get the comment at
   * @returns The comment text at the line or `undefined` if not found.
   */
  getAtLine(line: number): string | undefined;
  /**
   * Get the comment text before a global key in the INI.
   *
   * @param key The key to get the comment at
   * @returns The comment text at the provided key or `undefined` if not found.
   */
  getAtKey(key: string): string | undefined;
  /**
   * Get the comment text before a section key in the INI.
   *
   * @param section The section
   * @param key The key to get the comment at
   * @returns The comment text at the provided section or `undefined` if not found.
   */
  getAtKey(section: string, key: string): string | undefined;
  /**
   * Get the comment text before a section line in the INI.
   *
   * @param section The section to get the comment at
   * @returns The comment text at the provided section or `undefined` if not found.
   */
  getAtSection(section: string): string | undefined;
  /**
   * Set a comment at a specific line in the INI.
   *
   * @param line The line to set the comment at
   * @param text The comment to set
   * @returns The comments object itself
   */
  setAtLine(line: number, text: string): Comments;
  /**
   * Set a comment before a global key in the INI.
   *
   * @param key The key to set the text at
   * @param text The comment to set
   * @returns The comments object itself
   */
  setAtKey(key: string, text: string): Comments;
  /**
   * Set a comment before a section key in the INI.
   *
   * @param section The section
   * @param key The key to set the text at
   * @param text The comment to set
   * @returns The comments object itself
   */
  setAtKey(section: string, key: string, text: string): Comments;
  /**
   * Set a comment before a section line in the INI.
   *
   * @param section The section to set the comment at
   * @param text The comment to set
   * @returns The comments object itself
   */
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
  lineBreak: "\n",
  pretty: false,
  commentChar: "#",
  deduplicate: false,
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
