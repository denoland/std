// deno-lint-ignore-file no-explicit-any
import { EnvError, EnvMissingError } from "./errors.ts";
import { CleanOptions, Spec, ValidatorSpec } from "./types.ts";
import { defaultReporter } from "./reporter.ts";

export const testOnlySymbol = Symbol("envalid - test only");

/**
 * Validate a single variable.
 *
 * @throws {EnvError} if unsuccessful
 * @return The cleaned value
 */
function validateVar<T>({
  spec,
  name,
  rawValue,
}: {
  name: string;
  rawValue: string | T;
  spec: ValidatorSpec<T>;
}) {
  if (typeof spec._parse !== "function") {
    throw new EnvError(`Invalid spec for "${name}"`);
  }
  const value = spec._parse(rawValue as string);

  if (spec.choices) {
    if (!Array.isArray(spec.choices)) {
      throw new TypeError(`"choices" must be an array (in spec for "${name}")`);
    } else if (!spec.choices.includes(value)) {
      throw new EnvError(`Value "${value}" not in choices [${spec.choices}]`);
    }
  }
  if (value == null) throw new EnvError(`Invalid value for env var "${name}"`);
  return value;
}

/**
 * Returns the error message for a missing variable.
 */
function formatSpecDescription<T>(spec: Spec<T>) {
  const egText = spec.example ? ` (eg. "${spec.example}")` : "";
  const docsText = spec.docs ? `. See ${spec.docs}` : "";
  return `${spec.desc}${egText}${docsText}`;
}

const readRawEnvValue = <T>(
  env: unknown,
  k: keyof T,
): string | T[keyof T] => {
  return (env as any)[k];
};

const isTestOnlySymbol = (value: any): value is symbol =>
  value === testOnlySymbol;

/**
 * Perform the central validation/sanitization on the environment object.
 */
export function getSanitizedEnv<T>(
  environment: unknown,
  specs: { [K in keyof T]: ValidatorSpec<T[K]> },
  options: CleanOptions<T> = {},
): T {
  const cleanedEnv = {} as T;
  const errors: Partial<Record<keyof T, Error>> = {};
  const varKeys = Object.keys(specs) as Array<keyof T>;

  for (const k of varKeys) {
    const spec = specs[k];
    const rawValue = readRawEnvValue(environment, k);

    // If no value was given and default was provided, return the appropriate default
    // value without passing it through validation
    if (rawValue === undefined) {
      if (Object.prototype.hasOwnProperty.call(spec, "default")) {
        // @ts-expect-error default values can break the rules slightly by being explicitly set to undefined
        cleanedEnv[k] = spec.default;
        continue;
      }
    }

    try {
      if (isTestOnlySymbol(rawValue)) {
        throw new EnvMissingError(formatSpecDescription(spec));
      }

      if (rawValue === undefined) {
        // @ts-ignore (fixes af/envalid#138) Need to figure out why explicitly undefined default breaks inference
        cleanedEnv[k] = undefined;
        throw new EnvMissingError(formatSpecDescription(spec));
      } else {
        cleanedEnv[k] = validateVar({ name: k as string, spec, rawValue });
      }
    } catch (err) {
      if (options?.reporter === null) throw err;
      if (err instanceof Error) errors[k] = err;
    }
  }

  const reporter = options?.reporter || defaultReporter;
  reporter({ errors, env: cleanedEnv });
  return cleanedEnv;
}
