// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

function digits(value: string | number, count = 2): string {
  return String(value).padStart(count, "0");
}

// as declared in namespace Intl
type DateTimeFormatPartTypes =
  | "day"
  | "dayPeriod"
  // | "era"
  | "hour"
  | "literal"
  | "minute"
  | "month"
  | "second"
  | "timeZoneName"
  // | "weekday"
  | "year"
  | "fractionalSecond";

interface DateTimeFormatPart {
  type: DateTimeFormatPartTypes;
  value: string;
}

type TimeZone = "UTC";

interface Options {
  timeZone?: TimeZone;
}

type FormatPart = {
  type: DateTimeFormatPartTypes;
  value: string | number;
  hour12?: boolean;
};

const SYMBOL_REGEXP = /^(?<symbol>([a-zA-Z])\2*)/;
const QUOTED_LITERAL_REGEXP = /^(')(?<value>\\.|[^\']*)\1/;
const LITERAL_REGEXP = /^(?<value>.+?\s*)/;

// according to unicode symbols (http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
function symbolToFormatPart(symbol: string): FormatPart {
  switch (symbol) {
    // case "GGGGG":
    //   return { type: "era", value: "narrow" };
    // case "GGGG":
    //   return { type: "era", value: "long" };
    // case "GGG":
    // case "GG":
    // case "G":
    //   return { type: "era", value: "short" };
    case "yyyy":
      return { type: "year", value: "numeric" };
    case "yy":
      return { type: "year", value: "2-digit" };
    case "MMMMM":
      return { type: "month", value: "narrow" };
    case "MMMM":
      return { type: "month", value: "long" };
    case "MMM":
      return { type: "month", value: "short" };
    case "MM":
      return { type: "month", value: "2-digit" };
    case "M":
      return { type: "month", value: "numeric" };
    case "dd":
      return { type: "day", value: "2-digit" };
    case "d":
      return { type: "day", value: "numeric" };
    // case "EEEEEE":
    //   return { type: "weekday", value: "short" };
    // case "EEEEE":
    //   return { type: "weekday", value: "narrow" };
    // case "EEEE":
    //   return { type: "weekday", value: "long" };
    // case "EEE":
    // case "EE":
    // case "E":
    //   return { type: "weekday", value: "short" };
    case "aaaaa":
      return { type: "dayPeriod", value: "narrow" };
    case "aaaa":
      return { type: "dayPeriod", value: "long" };
    case "aaa":
    case "aa":
    case "a":
      return { type: "dayPeriod", value: "short" };
    case "HH":
      return { type: "hour", value: "2-digit" };
    case "H":
      return { type: "hour", value: "numeric" };
    case "hh":
      return { type: "hour", value: "2-digit", hour12: true };
    case "h":
      return { type: "hour", value: "numeric", hour12: true };
    case "mm":
      return { type: "minute", value: "2-digit" };
    case "m":
      return { type: "minute", value: "numeric" };
    case "ss":
      return { type: "second", value: "2-digit" };
    case "s":
      return { type: "second", value: "numeric" };
    case "SSS":
      return { type: "fractionalSecond", value: 3 };
    case "SS":
      return { type: "fractionalSecond", value: 2 };
    case "S":
      return { type: "fractionalSecond", value: 1 };
    // case "zzzz":
    //   return { type: "timeZoneName", value: "long" };
    // case "zzz":
    // case "zz":
    // case "z":
    //   return { type: "timeZoneName", value: "short" };
    // case "ZZZZ":
    // case "OOOO":
    //   return { type: "timeZoneName", value: "longOffset" };
    // case "O":
    //   return { type: "timeZoneName", value: "shortOffset" };
    // case "vvvv":
    //   return { type: "timeZoneName", value: "longGeneric" };
    // case "v":
    //   return { type: "timeZoneName", value: "shortGeneric" };
    default:
      throw new Error(
        `ParserError: Cannot parse format symbol "${symbol}"`,
      );
  }
}

function formatToFormatParts(format: string) {
  const formatParts: FormatPart[] = [];
  let index = 0;
  while (index < format.length) {
    const substring = format.slice(index);

    const symbolMatch = SYMBOL_REGEXP.exec(substring);
    if (symbolMatch) {
      const symbol = symbolMatch.groups!.symbol!;
      formatParts.push(symbolToFormatPart(symbol));
      index += symbol.length;
      continue;
    }

    const quotedLiteralMatch = QUOTED_LITERAL_REGEXP.exec(substring);
    if (quotedLiteralMatch) {
      const value = quotedLiteralMatch.groups!.value!;
      formatParts.push({ type: "literal", value });
      index += quotedLiteralMatch[0].length;
      continue;
    }

    const literalMatch = LITERAL_REGEXP.exec(substring)!;
    const value = literalMatch.groups!.value!;
    formatParts.push({ type: "literal", value });
    index += value.length;
  }

  return formatParts;
}

export class DateTimeFormatter {
  #formatParts: FormatPart[];

  constructor(formatString: string) {
    this.#formatParts = formatToFormatParts(formatString);
  }

  format(date: Date, options: Options = {}): string {
    let string = "";

    const utc = options.timeZone === "UTC";

    for (const part of this.#formatParts) {
      const type = part.type;

      switch (type) {
        case "year": {
          const value = utc ? date.getUTCFullYear() : date.getFullYear();
          switch (part.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2).slice(-2);
              break;
            }
            default:
              throw new Error(
                `FormatterError: DateTimeFormatPartType "year" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "month": {
          const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
          switch (part.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw new Error(
                `FormatterError: DateTimeFormatPartType "month" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "day": {
          const value = utc ? date.getUTCDate() : date.getDate();
          switch (part.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw new Error(
                `FormatterError: DateTimeFormatPartType "day" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "hour": {
          let value = utc ? date.getUTCHours() : date.getHours();
          if (part.hour12) {
            if (value === 0) value = 12;
            else if (value > 12) value -= 12;
          }
          switch (part.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw new Error(
                `FormatterError: DateTimeFormatPartType "hour" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "minute": {
          const value = utc ? date.getUTCMinutes() : date.getMinutes();
          switch (part.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw new Error(
                `FormatterError: DateTimeFormatPartType "minute" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "second": {
          const value = utc ? date.getUTCSeconds() : date.getSeconds();
          switch (part.value) {
            case "numeric": {
              string += value;
              break;
            }
            case "2-digit": {
              string += digits(value, 2);
              break;
            }
            default:
              throw new Error(
                `FormatterError: DateTimeFormatPartType "second" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "fractionalSecond": {
          const value = utc
            ? date.getUTCMilliseconds()
            : date.getMilliseconds();
          string += digits(value, 3).slice(0, Number(part.value));
          break;
        }
        case "timeZoneName": {
          if (utc) {
            string += "Z";
            break;
          }

          // TODO(WWRS): add support for time zones
          throw new Error(`FormatterError: Time zone is not supported`);
        }
        case "dayPeriod": {
          switch (part.value) {
            case "short":
            case "long":
              string += date.getHours() >= 12 ? "PM" : "AM";
              break;
            case "narrow":
              string += date.getHours() >= 12 ? "P" : "A";
              break;
            default:
              throw new Error(
                `FormatterError: DateTimeFormatPartType "dayPeriod" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "literal": {
          string += part.value;
          break;
        }

        default:
          throw new Error(`FormatterError: { ${part.type} ${part.value} }`);
      }
    }

    return string;
  }

  formatToParts(string: string): DateTimeFormatPart[] {
    const parts: DateTimeFormatPart[] = [];

    for (const part of this.#formatParts) {
      let value: string | undefined;
      // The number of chars consumed in the parse, defaults to `value.length`
      let parsedLength: number | undefined;

      switch (part.type) {
        case "year": {
          switch (part.value) {
            case "numeric": {
              value = /^\d{4}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              if (value !== undefined) {
                parsedLength = 2;
                value = `20${value}`;
              }
              break;
            }
            default:
              throw new Error(
                `ParserError: DateTimeFormatPartType "year" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "month": {
          switch (part.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              break;
            }
            case "narrow": {
              value = /^[a-zA-Z]+/.exec(string)?.[0];
              break;
            }
            case "short": {
              value = /^[a-zA-Z]+/.exec(string)?.[0];
              break;
            }
            case "long": {
              value = /^[a-zA-Z]+/.exec(string)?.[0];
              break;
            }
            default:
              throw new Error(
                `ParserError: DateTimeFormatPartType "month" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "day": {
          switch (part.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              break;
            }
            default:
              throw new Error(
                `ParserError: DateTimeFormatPartType "day" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "hour": {
          switch (part.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              if (part.hour12 && value && parseInt(value) > 12) {
                throw new Error(
                  `Cannot parse hour greater than 12 with format "h", use "H": hour is ${value}`,
                );
              }
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              if (part.hour12 && value && parseInt(value) > 12) {
                throw new Error(
                  `Cannot parse hour greater than 12 with format "hh", use "HH": hour is ${value}`,
                );
              }
              break;
            }
            default:
              throw new Error(
                `ParserError: DateTimeFormatPartType "hour" does not support value "${part.value}"`,
              );
          }
          break;
        }
        case "minute": {
          switch (part.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              break;
            }
            default:
              throw new Error(
                `ParserError: DateTimeFormatPartType "minute" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "second": {
          switch (part.value) {
            case "numeric": {
              value = /^\d{1,2}/.exec(string)?.[0];
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0];
              break;
            }
            default:
              throw new Error(
                `ParserError: DateTimeFormatPartType "second" does not support value ${part.value}`,
              );
          }
          break;
        }
        case "fractionalSecond": {
          const re = new RegExp(`^\\d{${part.value}}`);
          value = re.exec(string)?.[0];
          break;
        }
        case "timeZoneName": {
          // TODO(WWRS): validate time zone name
          value = String(part.value);
          break;
        }
        case "dayPeriod": {
          value = /^[AP](?:\.M\.|M\.?)/i.exec(string)?.[0];
          parsedLength = value?.length;
          switch (value?.toUpperCase()) {
            case "AM":
            case "AM.":
            case "A.M.":
              value = "AM";
              break;
            case "PM":
            case "PM.":
            case "P.M.":
              value = "PM";
              break;
            default:
              throw new Error(
                `ParserError: Could not parse dayPeriod from "${value}"`,
              );
          }
          break;
        }
        case "literal": {
          if (typeof part.value !== "string") {
            throw new Error(
              `ParserError: DateTimeFormatPartType "literal" does not support value ${part.value}`,
            );
          }
          if (!string.startsWith(part.value)) {
            throw new Error(
              `ParserError: DateTimeFormatPartType "literal" expected value "${part.value}" at the start of remaining input, but found "${
                string.slice(0, 25)
              }"`,
            );
          }
          value = part.value;
          break;
        }

        default:
          throw new Error(
            `ParserError: Unknown type: "${part.type}" (value is ${part.value})`,
          );
      }

      if (!value) {
        throw new Error(
          `ParserError: Did not produce a value for type: ${part.type}, remaining input ${
            string.length === 0
              ? "is empty"
              : `starts with "${string.slice(0, 25)}"`
          }`,
        );
      }
      parts.push({ type: part.type, value });

      string = string.slice(parsedLength ?? value.length);
    }

    if (string.length > 0) {
      throw new Error(
        `ParserError: Input exceeds format, remaining input starts with "${
          string.slice(0, 25)
        }"`,
      );
    }

    return parts;
  }

  partsToDate(parts: DateTimeFormatPart[]): Date {
    let year;
    let month;
    let day;
    let hour = 0;
    let minute = 0;
    let second = 0;
    let fractionalSecond = 0;
    let dayPeriod: "am" | "pm" | undefined = undefined;
    let utc = false;

    for (const part of parts) {
      switch (part.type) {
        case "year":
          year = Number(part.value);
          break;
        case "month":
          month = Number(part.value);
          break;
        case "day":
          day = Number(part.value);
          break;
        case "hour":
          hour = Number(part.value);
          break;
        case "minute":
          minute = Number(part.value);
          break;
        case "second":
          second = Number(part.value);
          break;
        case "fractionalSecond":
          fractionalSecond = Number(part.value);
          break;
        case "dayPeriod": {
          switch (part.value.toUpperCase()) {
            case "AM":
            case "AM.":
            case "A.M.":
              dayPeriod = "am";
              break;
            case "PM":
            case "PM.":
            case "P.M.":
              dayPeriod = "pm";
              break;
            default:
              throw new Error(
                `ParserError: Could not parse dayPeriod from "${part.value}"`,
              );
          }
          break;
        }
        case "timeZoneName":
          utc = part.value === "UTC";
          break;
      }
    }

    if (dayPeriod !== undefined) {
      if (hour === undefined) {
        throw new Error(
          `ParserError: Cannot use dayPeriod without hour`,
        );
      }
      if (hour > 12) {
        throw new Error(
          `ParserError: Cannot use dayPeriod with hour greater than 12, hour is "${hour}"`,
        );
      }

      if (dayPeriod === "pm") {
        hour += 12;
      }
    }

    const date = new Date();
    if (year === undefined) {
      year = utc ? date.getUTCFullYear() : date.getFullYear();
    }
    if (month === undefined) {
      month = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    }
    if (day === undefined) {
      day = utc ? date.getUTCDate() : date.getDate();
    }

    // TODO(WWRS): add time zone
    return new Date(
      `${year}-${digits(month, 2)}-${digits(day, 2)}T${digits(hour, 2)}:${
        digits(minute, 2)
      }:${digits(second, 2)}.${digits(fractionalSecond, 3)}${utc ? "Z" : ""}`,
    );
  }

  parse(string: string): Date {
    const parts = this.formatToParts(string);
    return this.partsToDate(parts);
  }
}
