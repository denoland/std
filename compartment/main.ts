// run-remote-ts-module.ts
//
// This script runs under Deno, uses "transpile" from "jsr:@deno/emit" to fetch and transpile
// a remote TypeScript file (and its imports) into JavaScript. It then runs the resulting code
// in a SES Compartment.
//
// Usage:
// deno run --allow-net run-remote-ts-module.ts https://example.com/yourModule.ts

import 'ses'
import { ModuleSource } from '@endo/module-source'
import { transpile } from 'jsr:@deno/emit' // Uses the jsr:@deno/emit library

// Lock down the environment
lockdown({ errorTaming: 'unsafe', stackFiltering: 'verbose' })

async function runModule(entryURL: string) {
  // Convert the string to a URL object
  const rootURL = new URL(entryURL)

  // Transpile the entire dependency graph starting from the entry point
  const result = await transpile(rootURL)

  const resolveHook = (specifier: string, referrer: string) => {
    // Resolve relative imports
    return new URL(specifier, referrer).toString()
  }

  const importHook = async (specifier: string) => {
    // Lookup the transpiled JavaScript code from the map
    const jsCode = result.get(specifier)
    if (!jsCode) {
      throw new Error(`No transpiled code found for ${specifier}`)
    }
    return {
      source: new ModuleSource(jsCode, specifier),
    }
  }

  // Provide limited globals
  const globals = { console }

  const compartment = new Compartment(globals, {}, {
    name: 'ts-runner',
    resolveHook,
    importHook,
  })

  // Import the module and log its exports
  const ns = await compartment.import(entryURL)
  console.log('Loaded module exports:', ns)
}

if (import.meta.main) {
  const moduleURL = Deno.args[0]
  if (!moduleURL) {
    console.error(
      'Usage: deno run --allow-net run-remote-ts-module.ts <module_url>',
    )
    Deno.exit(1)
  }

  await runModule(moduleURL)
}
