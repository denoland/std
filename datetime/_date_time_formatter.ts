// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

function digits(value: string | number, count = 2): string {
  return String(value).padStart(count, "0");
}

// as declared as in namespace Intl
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

const QUOTED_LITERAL_REGEXP = /^(')(?<value>\\.|[^\']*)\1/;
const LITERAL_REGEXP = /^(?<value>.+?\s*)/;
const SYMBOL_REGEXP = /^(?<symbol>([a-zA-Z])\2*)/;

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
    // case "MMMMM":
    //   return { type: "month", value: "narrow" };
    // case "MMMM":
    //   return { type: "month", value: "long" };
    // case "MMM":
    //   return { type: "month", value: "short" };
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
    // case "aaaaa":
    //   return { type: "dayPeriod", value: "narrow" };
    // case "aaaa":
    //   return { type: "dayPeriod", value: "long" };
    // case "aaa":
    // case "aa":
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

/**
 * Parses a datetime format string to FormatParts
 *
 * @param formatString The string to parse the format from
 * @returns The FormatParts of the string
 */
export function formatStringToFormatParts(formatString: string): FormatPart[] {
  const formatParts: FormatPart[] = [];
  let index = 0;
  while (index < formatString.length) {
    const substring = formatString.slice(index);
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

function sortDateTimeFormatParts(
  parts: readonly DateTimeFormatPart[],
): DateTimeFormatPart[] {
  const remainingParts = [...parts];
  let result: DateTimeFormatPart[] = [];
  const typeArray = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "fractionalSecond",
  ];
  for (const type of typeArray) {
    const current = remainingParts.findIndex((el) => el.type === type);
    if (current !== -1) {
      result = result.concat(remainingParts.splice(current, 1));
    }
  }
  result = result.concat(remainingParts);
  return result;
}

/**
 * Formats a date using FormatParts.
 *
 * @param date The date to format
 * @param formatParts The parts to format the date to
 * @param options Formatting options
 * @returns The formatted date
 */
export function formatDate(
  date: Date,
  formatParts: FormatPart[],
  options: Options = {},
): string {
  let string = "";

  const utc = options.timeZone === "UTC";

  for (const part of formatParts) {
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
              `FormatterError: value "${part.value}" is not supported`,
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
              `FormatterError: value "${part.value}" is not supported`,
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
              `FormatterError: value "${part.value}" is not supported`,
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
              `FormatterError: value "${part.value}" is not supported`,
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
              `FormatterError: value "${part.value}" is not supported`,
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
              `FormatterError: value "${part.value}" is not supported`,
            );
        }
        break;
      }
      case "fractionalSecond": {
        const value = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
        string += digits(value, 3).slice(0, Number(part.value));
        break;
      }
      // FIXME(bartlomieju)
      case "timeZoneName": {
        // string += utc ? "Z" : part.value
        break;
      }
      case "dayPeriod": {
        string += date.getHours() >= 12 ? "PM" : "AM";
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

/**
 * Parses a format string and FormatParts to DateTimeFormatParts.
 *
 * @param dateString The date string to parse
 * @param formatParts The format of `dateString`
 * @returns The DateTimeFormatParts parsed
 */
export function dateStringToDateTimeFormatParts(
  dateString: string,
  formatParts: FormatPart[],
): DateTimeFormatPart[] {
  const parts: DateTimeFormatPart[] = [];

  for (const part of formatParts) {
    const type = part.type;
    let length = 0;
    let value = "";
    switch (part.type) {
      case "year": {
        switch (part.value) {
          case "numeric": {
            value = /^\d{4}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          case "2-digit": {
            value = /^\d{2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          default:
            throw new Error(
              `ParserError: value "${part.value}" is not supported`,
            );
        }
        break;
      }
      case "month": {
        switch (part.value) {
          case "numeric": {
            value = /^\d{1,2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          case "2-digit": {
            value = /^\d{2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          case "narrow": {
            value = /^[a-zA-Z]+/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          case "short": {
            value = /^[a-zA-Z]+/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          case "long": {
            value = /^[a-zA-Z]+/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          default:
            throw new Error(
              `ParserError: value "${part.value}" is not supported`,
            );
        }
        break;
      }
      case "day": {
        switch (part.value) {
          case "numeric": {
            value = /^\d{1,2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          case "2-digit": {
            value = /^\d{2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          default:
            throw new Error(
              `ParserError: value "${part.value}" is not supported`,
            );
        }
        break;
      }
      case "hour": {
        switch (part.value) {
          case "numeric": {
            value = /^\d{1,2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            if (part.hour12 && parseInt(value) > 12) {
              // TODO(iuioiua): Replace with throwing an error
              // deno-lint-ignore no-console
              console.error(
                `Trying to parse hour greater than 12, use 'H' instead of 'h'.`,
              );
            }
            break;
          }
          case "2-digit": {
            value = /^\d{2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            if (part.hour12 && parseInt(value) > 12) {
              // TODO(iuioiua): Replace with throwing an error
              // deno-lint-ignore no-console
              console.error(
                `Trying to parse hour greater than 12, use 'HH' instead of 'hh'.`,
              );
            }
            break;
          }
          default:
            // TODO(iuioiua): Correct error type and message
            throw new Error(
              `ParserError: value "${part.value}" is not supported`,
            );
        }
        break;
      }
      case "minute": {
        switch (part.value) {
          case "numeric": {
            value = /^\d{1,2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          case "2-digit": {
            value = /^\d{2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          default:
            throw new Error(
              `ParserError: value "${part.value}" is not supported`,
            );
        }
        break;
      }
      case "second": {
        switch (part.value) {
          case "numeric": {
            value = /^\d{1,2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          case "2-digit": {
            value = /^\d{2}/.exec(dateString)?.[0] as string;
            length = value?.length;
            break;
          }
          default:
            throw new Error(
              `ParserError: value "${part.value}" is not supported`,
            );
        }
        break;
      }
      case "fractionalSecond": {
        value = new RegExp(`^\\d{${part.value}}`).exec(dateString)
          ?.[0] as string;
        length = value?.length;
        break;
      }
      case "timeZoneName": {
        value = part.value as string;
        length = value?.length;
        break;
      }
      case "dayPeriod": {
        value = /^[AP](?:\.M\.|M\.?)/i.exec(dateString)?.[0] as string;
        switch (value.toUpperCase()) {
          case "AM":
            value = "AM";
            length = 2;
            break;
          case "AM.":
            value = "AM";
            length = 3;
            break;
          case "A.M.":
            value = "AM";
            length = 4;
            break;
          case "PM":
            value = "PM";
            length = 2;
            break;
          case "PM.":
            value = "PM";
            length = 3;
            break;
          case "P.M.":
            value = "PM";
            length = 4;
            break;
          default:
            throw new Error(`DayPeriod '${value}' is not supported.`);
        }
        break;
      }
      case "literal": {
        if (!dateString.startsWith(part.value as string)) {
          throw new Error(
            `Literal "${part.value}" not found "${dateString.slice(0, 25)}"`,
          );
        }
        value = part.value as string;
        length = value?.length;
        break;
      }

      default:
        throw new Error(
          `Cannot format the date, the value (${part.value}) of the type (${part.type}) is given`,
        );
    }

    if (!value) {
      throw new Error(
        `Cannot format value: The value is not valid for part { ${type} ${value} } ${
          dateString.slice(
            0,
            25,
          )
        }`,
      );
    }
    parts.push({ type, value });

    dateString = dateString.slice(length);
  }

  if (dateString.length) {
    throw new Error(
      `datetime string was not fully parsed! ${dateString.slice(0, 25)}`,
    );
  }

  return parts;
}

/**
 * Converts DateTimeFormatParts to a Date.
 *
 * @param parts The DateTimeFormatParts to convert
 * @returns The Date represented by `parts`
 */
export function dateTimeFormatPartsToDate(
  parts: readonly DateTimeFormatPart[],
): Date {
  const sortedParts = sortDateTimeFormatParts(parts);

  const date = new Date();
  const utc = sortedParts.find(
    (part) => part.type === "timeZoneName" && part.value === "UTC",
  );

  const dayPart = sortedParts.find((part) => part.type === "day");

  utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
  for (const part of sortedParts) {
    switch (part.type) {
      case "year": {
        const value = Number(part.value.padStart(4, "20"));
        utc ? date.setUTCFullYear(value) : date.setFullYear(value);
        break;
      }
      case "month": {
        const value = Number(part.value) - 1;
        if (dayPart) {
          utc
            ? date.setUTCMonth(value, Number(dayPart.value))
            : date.setMonth(value, Number(dayPart.value));
        } else {
          utc ? date.setUTCMonth(value) : date.setMonth(value);
        }
        break;
      }
      case "day": {
        const value = Number(part.value);
        utc ? date.setUTCDate(value) : date.setDate(value);
        break;
      }
      case "hour": {
        let value = Number(part.value);
        const dayPeriod = sortedParts.find(
          (part: DateTimeFormatPart) => part.type === "dayPeriod",
        );
        if (dayPeriod) {
          switch (dayPeriod.value.toUpperCase()) {
            case "AM":
            case "AM.":
            case "A.M.":
              // ignore
              break;
            case "PM":
            case "PM.":
            case "P.M.":
              value += 12;
              break;
            default:
              throw new Error(
                `dayPeriod '${dayPeriod.value}' is not supported.`,
              );
          }
        }
        utc ? date.setUTCHours(value) : date.setHours(value);
        break;
      }
      case "minute": {
        const value = Number(part.value);
        utc ? date.setUTCMinutes(value) : date.setMinutes(value);
        break;
      }
      case "second": {
        const value = Number(part.value);
        utc ? date.setUTCSeconds(value) : date.setSeconds(value);
        break;
      }
      case "fractionalSecond": {
        const value = Number(part.value);
        utc ? date.setUTCMilliseconds(value) : date.setMilliseconds(value);
        break;
      }
    }
  }
  return date;
}

export class DateTimeFormatter {
  #formatParts: FormatPart[];

  constructor(formatString: string) {
    this.#formatParts = formatStringToFormatParts(formatString);
  }

  format(date: Date, options: Options = {}) {
    return formatDate(date, this.#formatParts, options);
  }

  parse(dateString: string): Date {
    const parts = dateStringToDateTimeFormatParts(
      dateString,
      this.#formatParts,
    );
    return dateTimeFormatPartsToDate(parts);
  }
}
