`std/_crypto_wasm` is only for internal use, such as by `std/crypto` and
`std/node/crypto`. Its interface may not be stable between releases and it
should not be imported directly.

## How to Build

### Build

```sh
deno task build:crypto
```

This will regenerate the files in the `./lib/` folder from the Rust source.

### CI

If CI fails in `Verify WASM hasn't changed` step, you need to download built
artifacts from that CI run and commit them back to the PR. Visit
`https://github.com/denoland/deno_std/actions/runs/<CI_RUN_ID>#artifacts` and
click on `Artifacts` at the top of the page.
