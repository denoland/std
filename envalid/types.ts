type DefaultType<T> = T extends string ? string
  : T extends number ? number
  : T extends boolean ? boolean
  : T extends Record<string, unknown> ? Record<string, unknown>
  : // deno-lint-ignore no-explicit-any
  any;

export interface Spec<T> {
  /**
   * An array of permitted values
   */
  choices?: ReadonlyArray<T>;
  /**
   * A fallback value to use if the variable was not set. Providing this effectively makes the variable optional.
   */
  default?: DefaultType<T>;
  /**
   * Description of the variable
   */
  desc?: string;
  /**
   * Example value
   */
  example?: string;
  /**
   * Documentation URL
   */
  docs?: string;
}

export interface ValidatorSpec<T> extends Spec<T> {
  _parse: (input: string) => T;
}

export interface ReporterOptions<T> {
  errors: Partial<Record<keyof T, Error>>;
  env: unknown;
}

export interface CleanOptions<T> {
  /**
   * A function that overrides the default reporter
   */
  reporter?: ((opts: ReporterOptions<T>) => void) | null;
}
