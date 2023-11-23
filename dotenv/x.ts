// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** Environment variable settings for {@linkcode x}. */
export type EnvVar =
  & {
    /** Key of the environment variable. */
    key: string;
  }
  & (
    | {
      /** Default value of the environment variable set if undefined. */
      defaultValue: string;
      /**
       * Whether the environment variable is defined.
       *
       * @default {undefined}
       */
      required?: boolean;
    }
    | {
      /** Default value of the environment variable set if undefined. */
      defaultValue?: string;
      /**
       * Whether the environment variable is defined.
       *
       * @default {undefined}
       */
      required: boolean;
    }
  );

/**
 * Error thrown when a required environment variable is not set in the current
 * process.
 */
export class MissingEnvVarError extends Error {
  key: string;

  constructor(message: string, key: string) {
    super(message);
    this.name = "MissingEnvVarError";
    this.key = key;
  }
}

/**
 * Sets a default value for the given environment variable, if defined. Then,
 * asserts that the given environment variable has been set in the current
 * process.
 *
 * @example
 * ```ts
 * import { x } from "https://deno.land/std@$STD_VERSION/dotenv/x.ts";
 *
 * // Returns the value of the "FOO" environment variable if already set or
 * // returns "BAR" when "FOO" environment variable is not set or
 * x({ key: "FOO", defaultValue: "BAR" });
 *
 * // Throws when the value of the "FOO" environment variable is not set or
 * // does not have a default value.
 * x({ key: "FOO", required: true });
 * ```
 */
export function x(envVar: EnvVar) {
  if (Deno.env.has(envVar.key)) return;

  if (envVar.defaultValue !== undefined) {
    Deno.env.set(envVar.key, envVar.defaultValue);
  }

  if (envVar.required) {
    throw new MissingEnvVarError(
      `Missing environment variable: ${envVar.key}`,
      envVar.key,
    );
  }
}
