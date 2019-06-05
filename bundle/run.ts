// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { assertStrictEq, assert } from "../testing/asserts.ts";
import { exists } from "../fs/exists.ts";

interface DefineFactory {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (...args: any): object | void;
}

interface ModuleMetaData {
  dependencies: string[];
  factory?: DefineFactory;
  exports: object;
}

type Define = (
  id: string,
  dependencies: string[],
  factory: DefineFactory
) => void;

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace globalThis {
    var define: Define | undefined;
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/** Load the bundle and return the contents asynchronously. */
export async function load(args: string[]): Promise<string> {
  // TODO(kitsonk) allow loading of remote bundles via fetch.
  assertStrictEq(args.length, 2, "Expected exactly two arguments.");
  const [, bundleFileName] = args;
  assert(await exists(bundleFileName), `Expected ${bundleFileName} to exist.`);
  return new TextDecoder().decode(await Deno.readFile(bundleFileName));
}

/** Evaluate the bundle, returning a queue of module IDs and their data to
 * instantiate.
 */
export function evaluate(
  text: string
): [string[], Map<string, ModuleMetaData>] {
  const queue: string[] = [];
  const modules = new Map<string, ModuleMetaData>();

  globalThis.define = function define(
    id: string,
    dependencies: string[],
    factory: DefineFactory
  ): void {
    modules.set(id, {
      dependencies,
      factory,
      exports: {}
    });
    queue.push(id);
  };
  const globalEval = eval;
  globalEval(text);
  // Deleting `define()` so it isn't accidentally there when the modules
  // instantiate.
  delete globalThis.define;

  return [queue, modules];
}

/** Drain the queue of module IDs while instantiating the modules. */
export function instantiate(
  queue: string[],
  modules: Map<string, ModuleMetaData>
): void {
  let id: string | undefined;
  while ((id = queue.shift())) {
    const module = modules.get(id)!;
    assert(module != null);
    assert(module.factory != null);

    const dependencies = module.dependencies.map(
      (id): object => {
        if (id === "require") {
          // TODO(kitsonk) support dynamic import by passing a `require()` that
          // can return a local module or dynamically import one.
          return () => {};
        } else if (id === "exports") {
          return module.exports;
        }
        const dep = modules.get(id)!;
        assert(dep != null);
        return dep.exports;
      }
    );

    module.factory!(...dependencies);
    delete module.factory;
  }
}

async function main(args: string[]): Promise<void> {
  const text = await load(args);
  const result = evaluate(text);
  instantiate(...result);
}

main(Deno.args);
