/**
 * Run this example with:
 * 
 * deno run --location=http://local ./testing/mocha_example.ts
 */
import mocha from "https://cdn.skypack.dev/mocha@9.1.2?dts";
import chai from "https://cdn.skypack.dev/chai@4.3.4?dts";

function add(a: number, b: number): number {
  return a + b;
}

describe("add", () => {
  it("should add two positive numbers correctly", () => {
    chai.expect(add(2, 3)).to.equal(2);
  });
});

/**
 * In order to use `describe` etc. we need to set Mocha to `bdd`
 * mode.
 *
 * We also need to set the reporter to `spec` (though other options
 * are available) to prevent Mocha using the default browser reporter
 * which requires access to a DOM.
 */
mocha.setup({ ui: "bdd", reporter: "spec" });

/**
 * Ensure there are no leaks in our tests.
 */
mocha.checkLeaks();

/**
 * Callback on completion of tests to ensure Deno exits with
 * the appropriate status code.
 */
function onCompleted(failures: number): void {
  if (failures > 0) {
    Deno.exit(1);
  } else {
    Deno.exit(0);
  }
}

/**
 * And finally we run our tests, passing the onCompleted function
 * hook and setting some globals.
 */
mocha.run(onCompleted);
