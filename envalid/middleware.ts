export const strictProxyMiddleware = <T extends Record<never, never>>(
  envObj: T,
  rawEnv: unknown,
) => {
  const inspectables = [
    "constructor",
    "length",
    "inspect",
    "hasOwnProperty",
    "toJSON", // Allow JSON.stringify() on output. See af/envalid#157
    Symbol.toStringTag,
    Symbol.iterator,

    // For libs that use `then` checks to see if objects are Promises (see af/envalid#74):
    "then",
    // For usage with TypeScript esModuleInterop flag
    "__esModule",
  ];

  return new Proxy(envObj, {
    get(target, name: string) {
      // These checks are needed because calling console.log on a
      // proxy that throws crashes the entire process. This permits access on
      // the necessary properties for `console.log(envObj)`, `envObj.length`,
      // `Object.prototype.hasOwnProperty.call(envObj, 'string')` to work.
      if (inspectables.includes(name)) {
        // @ts-expect-error TS doesn't like symbol types as indexers
        return target[name];
      }

      const varExists = Object.prototype.hasOwnProperty.call(target, name);

      if (!varExists) {
        if (
          typeof rawEnv === "object" && rawEnv &&
          Object.prototype.hasOwnProperty.call(rawEnv, name)
        ) {
          throw new ReferenceError(
            `[envalid] Env var ${name} was accessed but not validated. This var is set in the environment; please add an envalid validator for it.`,
          );
        }

        throw new ReferenceError(`[envalid] Env var not found: ${name}`);
      }

      return target[name as keyof T];
    },

    set(_target, name: string) {
      throw new TypeError(
        `[envalid] Attempt to mutate environment value: ${name}`,
      );
    },
  });
};

export const applyDefaultMiddleware = <T extends Record<string, unknown>>(
  cleanedEnv: T,
  rawEnv: unknown,
) => {
  // Note: Ideally we would declare the default middlewares in an array and apply them in series with
  // a generic pipe() function. However, a generically typed variadic pipe() appears to not be possible
  // in TypeScript as of 4.x, so we just manually apply them below. See
  // https://github.com/microsoft/TypeScript/pull/39094#issuecomment-647042984
  return strictProxyMiddleware(cleanedEnv, rawEnv);
};
