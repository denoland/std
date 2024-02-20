type OptionTypeConstructor<T> = T extends boolean ? BooleanConstructor
  : T extends number ? NumberConstructor
  : T extends string ? StringConstructor
  : BooleanConstructor | NumberConstructor | StringConstructor;

interface Option<T> {
  name: string;
  alias?: string;
  description?: string;
  default?: T;
  type?: OptionTypeConstructor<T>;
  negatable?: boolean;
  value?: {
    name: string;
    optional?: boolean;
    multiple?: boolean;
    requireEquals?: boolean;
  };
  fn?: (value: T) => T | void;
}

interface Argument<T = unknown> {
  name: string;
  description?: string;
  multiple?: boolean;
  optional?: boolean;
  fn?: (value: T) => T | void;
}

interface Command<T> {
  name: string;
  description?: string;
  options?: ReadonlyArray<Option<T>>;
  commands?: ReadonlyArray<Command<T>>;
  arguments?: ReadonlyArray<Argument>;
  fn?: (result: Result) => void;
}

interface Program<T> extends Omit<Command<T>, "name"> {
  name?: string;
}

export interface Result {
  options: Record<string, unknown>;
  arguments: Record<string, unknown>;
}

interface FlagRegExpGroup {
  doubleDash?: "-";
  negated?: "no-";
  name: string;
  value?: string;
}
const FLAG_REGEXP =
  /^(?:-(?:(?<doubleDash>-)(?<negated>no-)?)?)(?<name>.+?)(?:=(?<value>.+?))?$/s;
const QUOTED_VALUE_REGEXP = /^('|")(?<value>.*)\1$/;

function validateCommand<T>(program: Program<T>) {
  if (program.options) {
    for (const option of program.options) {
      if (option.default !== undefined) {
        switch (option.type) {
          case Boolean: {
            if (typeof option.default !== "boolean") {
              throw new Error(`default value must be a boolean.`);
            }
            break;
          }
          case Number: {
            if (typeof option.default !== "number" || isNaN(option.default)) {
              throw new Error(`default value must be a number.`);
            }
            break;
          }
          case String: {
            if (typeof option.default !== "string") {
              throw new Error(`default value must be a string.`);
            }
            break;
          }
        }
      }
    }
  }
}
function validateOption<T>(option: Option<T>, groups: FlagRegExpGroup) {
  if (!option.value) {
    if (groups.value) {
      throw new Error(
        `option value is not defined:' ${
          groups.doubleDash ? "--" : "-"
        }${groups.name}'`,
      );
    }
  }
  if (!option.value?.optional && option.value?.requireEquals && !groups.value) {
    throw new Error(
      `option requires equal before value: '${
        groups.doubleDash ? `--${option.name}` : `-${option.alias}`
      }'.`,
    );
  }
}

/**
 * sets value in result.options and calls option.value.fn if defined
 */
function setOptionValue<T>(
  result: Result,
  option: Option<T>,
  value: T,
) {
  if (option.value?.multiple) {
    result.options[option.name] ??= [];
    const array = result.options[option.name] as unknown[];
    array.push(value);
    value = array as T;
  }
  value = option?.fn?.(value) ?? value;
  result.options[option.name] = value;
}
/**
 * sets the next value (or values if option value is multiple) in entries as value in result for the passed option.
 */
function setNextOptionValue<T>(
  entries: IterableIterator<[number, string]>,
  result: Result,
  option: Option<T>,
) {
  for (const [_, arg] of entries) {
    if (arg === undefined) {
      if (!option.value?.optional) {
        throw new Error(`option requires a value: '--${option.name}'.`);
      }
      return;
    }
    const value = parseValue(option, arg) as T;
    setOptionValue(result, option, value);
    if (!option.value?.multiple) break;
  }
}

/**
 * handles command
 * @example
 * ```sh
 * program run
 * ```
 */
function handleCommand<T>(
  program: Program<T>,
  arg: string,
  entries: IterableIterator<[number, string]>,
) {
  const command = program.commands?.find((it) => it.name === arg);
  if (!command) throw new Error(`command not defined: ${arg}`);
  return parseWithIterator(entries, command);
}
/**
 * handles double dash option
 * @example
 * ```sh
 * --key
 * --key=value
 * --key value
 * ```
 */
function handleDoubleDashOption<T>(
  entries: IterableIterator<[number, string]>,
  result: Result,
  program: Program<T>,
  groups: FlagRegExpGroup,
) {
  const option = program.options?.find((it) => it.name === groups.name);
  if (!option) {
    throw new Error(
      `option is not defined: '${
        groups.doubleDash ? "--" : "-"
      }${groups.name}'`,
    );
  }

  // if no value is set already, set default, true, or false if negated or an empty array if is multiple
  result.options[option.name] ??= option.default ??
    (option.value?.multiple ? [] : (groups.negated ? false : true));

  validateOption(option, groups);
  if (!option.value) return;

  if (groups.value) {
    const value = parseValue(option, groups.value) as T;
    setOptionValue(result, option, value);
    return;
  }

  setNextOptionValue(entries, result, option);
}
/**
 * handles single dash option
 * @example
 * ```sh
 * -v
 * -v=3
 * -vvv
 * -vxyz
 * -vxyz=bar
 * -v bar
 * ```
 */
function handleSingleDashOption<T>(
  entries: IterableIterator<[number, string]>,
  result: Result,
  program: Program<T>,
  groups: FlagRegExpGroup,
) {
  for (const char of groups.name) {
    const option = program.options?.find((it) => it.alias === char);
    if (!option) throw new Error(`option not defined: ${char}`);

    // if no value is set already, set default, true, or false if negated or an empty array if is multiple
    result.options[option.name] ??= option.default ??
      (option.value?.multiple ? [] : (groups.negated ? false : true));

    validateOption(option, groups);

    if (groups.value) {
      const value = parseValue(option, groups.value) as T;
      setOptionValue(result, option, value);
    }

    if (option.value) {
      setNextOptionValue(entries, result, option);
    }

    const value = result.options[option.name] as T;
    result.options[option.name] = option?.fn?.(value) ?? value;
  }
}

function handleArgument(argument: Argument, arg: string, result: Result) {
  if (argument.multiple) {
    result.arguments[argument.name] ??= [];
    const array = result.arguments[argument.name] as unknown[];
    array.push(arg);
    result.arguments[argument.name] = argument.fn?.(array) ?? array;
  } else {
    const value = argument.fn?.(arg) ?? arg;
    result.arguments[argument.name] = value;
  }
}
function handleDoubleDashArguments(
  entries: IterableIterator<[number, string]>,
  result: Result,
) {
  const array: string[] = result.arguments["--"] = [];
  for (const [_, arg] of entries) array.push(arg);
}

function parseBooleanValue(value: string) {
  if (value === "true") return true;
  else if (value === "false") return false;
  else throw new Error(`value must be either 'true' or 'false'.`);
}
function parseNumberValue(value: string) {
  const number = Number(value);
  if (isNaN(number)) throw new Error(`value must be a number.`);
  return number;
}

function parseValue<T>(option: Option<T>, value: string) {
  // strip quotes if value starts and ends with quotes
  const groups = value.match(QUOTED_VALUE_REGEXP)?.groups;
  if (groups) value = groups.value;

  switch (option.type) {
    case Boolean:
      return parseBooleanValue(value);
    case Number:
      return parseNumberValue(value);
    case String:
    default:
      return String(value);
  }
}

function parseWithIterator<T>(
  entries: IterableIterator<[number, string]>,
  program: Program<T>,
): Result {
  validateCommand(program);

  const result = { options: {}, arguments: {} } as Result;

  const missingArguments = program.arguments?.filter((it) => !it.optional) ??
    [];

  let parsedArgumentIndex = 0;

  for (const [_, arg] of entries) {
    if (arg === "--") {
      handleDoubleDashArguments(entries, result);
      break;
    }

    const groups = arg.match(FLAG_REGEXP)?.groups as unknown as FlagRegExpGroup;
    if (!groups) {
      const argument = program.arguments?.at(parsedArgumentIndex);
      if (argument) {
        handleArgument(argument, arg, result);
        if (!argument.multiple) parsedArgumentIndex += 1;
        missingArguments.splice(missingArguments.indexOf(argument), 1);
        continue;
      }
      handleCommand(program, arg, entries);
      break;
    }
    if (groups.doubleDash) {
      handleDoubleDashOption(entries, result, program, groups);
    } else {
      handleSingleDashOption(entries, result, program, groups);
    }
  }

  if (missingArguments.length) {
    throw new Error(
      `missing arguments: ${missingArguments.map((it) => it.name).join(", ")}`,
    );
  }

  return program.fn?.(result) ?? result;
}

export function parse<T>(args: string[], program: Program<T>) {
  return parseWithIterator(args.entries(), program);
}
