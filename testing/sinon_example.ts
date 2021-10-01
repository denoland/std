/**
 * Run this example with:
 *
 * deno test ./testing/sinon_example.ts
 */
import sinon from "https://cdn.skypack.dev/sinon@11.1.2?dts";
import chai from "https://cdn.skypack.dev/chai@4.3.4?dts";

Deno.test("stubbed callback", () => {
  const callback = sinon.stub();
  callback.withArgs(42).returns(1);
  callback.withArgs(1).throws(new Error("test-error"));

  chai.assert.isUndefined(callback()); // No return value, no exception
  chai.assert.equal(callback(42), 1); // Returns 1
  chai.assert.equal(callback.withArgs(42).callCount, 1); // Use withArgs in assertion
  chai.assert.throws(() => {
    callback(1);
  }, "test-error"); // Throws Error("test-error")
});
