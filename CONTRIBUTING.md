# Contributing

deno_std is a loose port of [Go's standard library](https://golang.org/pkg/).
When in doubt, simply port Go's source code, documentation, and tests. There are
many times when the nature of JavaScript, TypeScript, or Deno itself justifies
diverging from Go, but if possible we want to leverage the energy that went into
building Go. We generally welcome direct ports of Go's code.

Please ensure the copyright headers cite the code's origin.

Follow the [style guide](https://deno.land/manual/contributing/style_guide).

### Opening a pull request

After cloning don't forget to `git submodule update --init`.

Before opening a PR make sure to:

- have the latest Deno version installed locally
- add tests that cover your changes.
- `deno task test` passes.
- `deno fmt --check` passes.
- `deno task lint` passes.
- (optionally) check for typos with `deno task typos` (requires
  [typos](https://github.com/crate-ci/typos#install) to be installed)

Give the PR a descriptive title.

Examples of good titles:

- fix(http): Fix race condition in server
- docs(fmt): Update docstrings
- feat(log): Handle nested messages

Examples of bad titles:

- fix #7123
- update docs
- fix bugs

Ensure there is a related issue and it is referenced in the PR text.

_About CI checks_:

We currently have 6 checks on CI. Each PR should pass all of these checks to be
accepted.

- test with Deno canary on Windows
- test with Deno canary on Linux
- test with Deno canary on macOS
- lint
- wasm crypto check
- CLA

_For maintainers_:

To release a new version a tag in the form of `x.y.z` should be added.

### Types

Deno is moving away from non-native IO functions and interfaces in favor of the
[Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API).
These types are to be defined here, in the Standard Library, instead of in the
Deno namespace in the future. As a rule, use the following corresponding and
identical types from `types.d.ts`:

- `Deno.Reader`
- `Deno.Writer`
- `Deno.ReaderSync`
- `Deno.WriterSync`
- `Deno.Closer`

See the tracking issue [here](https://github.com/denoland/deno/issues/9795).
