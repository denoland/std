// deno-lint-ignore-file no-explicit-any
import { blue, white, yellow } from "../fmt/colors.ts";
import { EnvMissingError } from "./errors.ts";
import { ReporterOptions } from "./types.ts";

type Errors<T> = Partial<Record<keyof T, Error>>;
type Logger = (data: any, ...args: any[]) => void;

// The default reporter is supports a second argument, for consumers
// who want to use it with only small customizations
type ExtraOptions<T> = {
  onError?: (errors: Errors<T>) => void;
  logger: (output: string) => void;
};

const defaultLogger = console.error.bind(console);

const RULE = white("================================");

// Takes the provided errors, formats them all to an output string, and passes that string output to the
// provided "logger" function.
//
// This is exposed in the public API so third-party reporters can leverage this logic if desired
export const envalidErrorFormatter = <T = any>(
  errors: Errors<T>,
  logger: Logger = defaultLogger,
) => {
  const missingVarsOutput: string[] = [];
  const invalidVarsOutput: string[] = [];
  for (const [k, err] of Object.entries(errors)) {
    if (err instanceof EnvMissingError) {
      missingVarsOutput.push(
        `    ${blue(k)}: ${err.message || "(required)"}`,
      );
    } else {
      invalidVarsOutput.push(
        `    ${blue(k)}: ${(err as Error)?.message || "(invalid format)"}`,
      );
    }
  }

  // Prepend "header" output for each section of the output:
  if (invalidVarsOutput.length) {
    invalidVarsOutput.unshift(
      ` ${yellow("Invalid")} environment variables:`,
    );
  }
  if (missingVarsOutput.length) {
    missingVarsOutput.unshift(
      ` ${yellow("Missing")} environment variables:`,
    );
  }

  const output = [
    RULE,
    invalidVarsOutput.sort().join("\n"),
    missingVarsOutput.sort().join("\n"),
    RULE,
  ]
    .filter((x) => !!x)
    .join("\n");

  logger(output);
};

export const defaultReporter = <T = any>(
  { errors = {} }: ReporterOptions<T>,
  { onError, logger }: ExtraOptions<T> = { logger: defaultLogger },
) => {
  if (!Object.keys(errors).length) return;

  envalidErrorFormatter(errors, logger);

  if (onError) {
    onError(errors);
  } else if (!Deno.noColor) {
    logger(yellow("\n Exiting with error code 1"));
    Deno.exit(1);
  } else {
    throw new TypeError("Environment validation failed");
  }
};
