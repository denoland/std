# Deno Standard Library

The Deno Standard Library is a collection of high-quality packages for Deno and
the web, distributed via JSR as `@std/*`. It supports multiple runtimes: Deno,
Node.js, Bun, browsers, and Cloudflare Workers.

## Repository Structure

- Each top-level directory is a package (e.g., `async/`, `http/`, `collections/`)
- `_tools/` contains internal CI/dev tooling (lint plugins, doc checkers, etc.)
- Root `deno.json` defines the workspace, tasks, and compiler options
- `import_map.json` maps all `@std/*` packages and dev dependencies

### Package Layout

Every package follows this structure:

```
<package>/
├── deno.json              # Name (@std/<package>), version, exports
├── mod.ts                 # Public entry point
├── <api>.ts               # Implementation (one function/class per file)
├── <api>_test.ts          # Tests for the corresponding source file
└── unstable_<api>.ts      # Experimental APIs (stable packages only)
```

- **Minimal exports**: each file exports a single function/class and related
  types
- **Unstable APIs** (`unstable_*.ts`): used in packages with version >= 1.0.0;
  must have `@experimental` TSDoc tag; must NOT be exported from `mod.ts`
- Packages with version < 1.0.0 have no unstable file restrictions

## Quality Gate

Run `deno task ok` before submitting. This runs:

- `deno lint` (includes custom style-guide plugin at `_tools/lint_plugin.ts`)
- `deno fmt --check`
- `deno task test:browser` (browser compatibility check)
- `deno task test` (full test suite with coverage and doc tests)

Additional lint tasks available:

- `deno task lint:circular` — circular dependency detection
- `deno task lint:mod-exports` — validates `mod.ts` exports
- `deno task lint:docs` — validates JSDoc completeness
- `deno task lint:import-map` — validates import map
- `deno task lint:export-names` — verifies export naming
- `deno task lint:unstable-deps` — tracks unstable feature usage
- `deno task typos` — spell checking

## PR Conventions

### Title Format

PR titles must follow semantic format with a package scope:

```
feat(http): add streaming response support
fix(csv): handle escaped quotes correctly
docs(fmt): update docstrings
deprecation(encoding): base32hex
```

The scope must match an existing package name. New packages must first add their
name to the `scopes` list in `.github/workflows/title.yml`.

### Commit Messages

Follow the same semantic format as PR titles.

## Testing

- Framework: `Deno.test()` with `@std/assert` for assertions
- Test names: descriptive, include the symbol and criteria
  - `delay() resolves immediately with ms = 0`
  - `ensureDirSync() creates dir if it does not exist`
- Each source file gets a corresponding `_test.ts` file
- Do NOT use `@std/assert` in implementation code — only in tests

## Documentation Requirements

All public symbols must have JSDoc with:

1. Short description
2. `@typeParam` for each type parameter
3. `@param` for each parameter
4. `@returns` for return value
5. At least one `@example` with a title and runnable code snippet

Example snippets must be reproducible and use `@std/assert` assertions. Use
`ignore` directive to skip running a snippet, `expect-error` for expected
failures.

Module files (`mod.ts`) need a `@module` tag.

## Error Message Style

- Sentence case, no trailing period
- Active voice: "Cannot parse input x" not "Input x cannot be parsed"
- No contractions: "Cannot" not "Can't"
- Quote string values: `Cannot parse input "hello, world"`
- Use colons for context: `Cannot parse input x: value is empty`
- State current and desired state when possible

Exception: `@std/assert` uses periods in error messages (downstream compat).

## CI Pipeline

Tests run on Ubuntu, Windows, and macOS against Deno v1.x, v2.x, and canary.
Cross-runtime testing includes Node.js and Bun. Timezone-sensitive tests run
across Sydney, London, and Toronto.

## Versioning and Releases

- Packages >= 1.0.0: follow semver
- Packages < 1.0.0: follow semver proposal
  (https://github.com/semver/semver/pull/923)
- Release tags: `release-YYYY.MM.DD`
- Publishing: `workspace_publish` workflow pushes to JSR

## Deprecation Policy

Deprecated APIs use the format:

```ts
/**
 * @deprecated This will be removed in X.Y.Z. Use {@linkcode bar} instead.
 */
```

Deprecated symbols are removed in the next major version. PRs use the title
format `deprecation(<package>): <symbol>`.
