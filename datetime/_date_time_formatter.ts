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
function formatToFormatParts(format: string) {
  const formatParts: FormatPart[] = [];
  let index = 0;
  while (index < format.length) {
    const substring = format.slice(index);
    const symbol = SYMBOL_REGEXP.exec(substring)?.groups?.symbol;
    switch (symbol) {
      case "yyyy":
        formatParts.push({ type: "year", value: "numeric" });
        index += symbol.length;
        continue;
      case "yy":
        formatParts.push({ type: "year", value: "2-digit" });
        index += symbol.length;
        continue;
      case "MM":
        formatParts.push({ type: "month", value: "2-digit" });
        index += symbol.length;
        continue;
      case "M":
        formatParts.push({ type: "month", value: "numeric" });
        index += symbol.length;
        continue;
      case "dd":
        formatParts.push({ type: "day", value: "2-digit" });
        index += symbol.length;
        continue;
      case "d":
        formatParts.push({ type: "day", value: "numeric" });
        index += symbol.length;
        continue;
      case "HH":
        formatParts.push({ type: "hour", value: "2-digit" });
        index += symbol.length;
        continue;
      case "H":
        formatParts.push({ type: "hour", value: "numeric" });
        index += symbol.length;
        continue;
      case "hh":
        formatParts.push({ type: "hour", value: "2-digit", hour12: true });
        index += symbol.length;
        continue;
      case "h":
        formatParts.push({ type: "hour", value: "numeric", hour12: true });
        index += symbol.length;
        continue;
      case "mm":
        formatParts.push({ type: "minute", value: "2-digit" });
        index += symbol.length;
        continue;
      case "m":
        formatParts.push({ type: "minute", value: "numeric" });
        index += symbol.length;
        continue;
      case "ss":
        formatParts.push({ type: "second", value: "2-digit" });
        index += symbol.length;
        continue;
      case "s":
        formatParts.push({ type: "second", value: "numeric" });
        index += symbol.length;
        continue;
      case "SSS":
        formatParts.push({ type: "fractionalSecond", value: 3 });
        index += symbol.length;
        continue;
      case "SS":
        formatParts.push({ type: "fractionalSecond", value: 2 });
        index += symbol.length;
        continue;
      case "S":
        formatParts.push({ type: "fractionalSecond", value: 1 });
        index += symbol.length;
        continue;
      case "a":
        formatParts.push({ type: "dayPeriod", value: 1 });
        index += symbol.length;
        continue;
    }

    const quotedLiteralMatch = QUOTED_LITERAL_REGEXP.exec(substring);
    if (quotedLiteralMatch) {
      const value = quotedLiteralMatch.groups!.value as string;
      formatParts.push({ type: "literal", value });
      index += quotedLiteralMatch[0].length;
      continue;
    }

    const literalGroups = LITERAL_REGEXP.exec(substring)!.groups!;
    const value = literalGroups.value as string;
    formatParts.push({ type: "literal", value });
    index += value.length;
  }

  return formatParts;
}

function sortDateTimeFormatParts(
  parts: DateTimeFormatPart[],
): DateTimeFormatPart[] {
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
    const current = parts.findIndex((el) => el.type === type);
    if (current !== -1) {
      result = result.concat(parts.splice(current, 1));
    }
  }
  result = result.concat(parts);
  return result;
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
          const value = utc
            ? date.getUTCMilliseconds()
            : date.getMilliseconds();
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

  formatToParts(string: string): DateTimeFormatPart[] {
    const parts: DateTimeFormatPart[] = [];

    for (const part of this.#formatParts) {
      const type = part.type;
      let length = 0;
      let value = "";
      switch (part.type) {
        case "year": {
          switch (part.value) {
            case "numeric": {
              value = /^\d{4}/.exec(string)?.[0] as string;
              length = value?.length;
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0] as string;
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
              value = /^\d{1,2}/.exec(string)?.[0] as string;
              length = value?.length;
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0] as string;
              length = value?.length;
              break;
            }
            case "narrow": {
              value = /^[a-zA-Z]+/.exec(string)?.[0] as string;
              length = value?.length;
              break;
            }
            case "short": {
              value = /^[a-zA-Z]+/.exec(string)?.[0] as string;
              length = value?.length;
              break;
            }
            case "long": {
              value = /^[a-zA-Z]+/.exec(string)?.[0] as string;
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
              value = /^\d{1,2}/.exec(string)?.[0] as string;
              length = value?.length;
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0] as string;
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
              value = /^\d{1,2}/.exec(string)?.[0] as string;
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
              value = /^\d{2}/.exec(string)?.[0] as string;
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
              value = /^\d{1,2}/.exec(string)?.[0] as string;
              length = value?.length;
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0] as string;
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
              value = /^\d{1,2}/.exec(string)?.[0] as string;
              length = value?.length;
              break;
            }
            case "2-digit": {
              value = /^\d{2}/.exec(string)?.[0] as string;
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
          value = new RegExp(`^\\d{${part.value}}`).exec(string)
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
          value = /^[AP](?:\.M\.|M\.?)/i.exec(string)?.[0] as string;
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
          if (!string.startsWith(part.value as string)) {
            throw new Error(
              `Literal "${part.value}" not found "${string.slice(0, 25)}"`,
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
            string.slice(
              0,
              25,
            )
          }`,
        );
      }
      parts.push({ type, value });

      string = string.slice(length);
    }

    if (string.length) {
      throw new Error(
        `datetime string was not fully parsed! ${string.slice(0, 25)}`,
      );
    }

    return parts;
  }

  partsToDate(parts: DateTimeFormatPart[]): Date {
    parts = sortDateTimeFormatParts(parts);

    const date = new Date();
    const utc = parts.find(
      (part) => part.type === "timeZoneName" && part.value === "UTC",
    );

    const dayPart = parts.find((part) => part.type === "day");

    utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
    for (const part of parts) {
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
          const dayPeriod = parts.find(
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

  parse(string: string): Date {
    const parts = this.formatToParts(string);
    return this.partsToDate(parts);
  }
}
