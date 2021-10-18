const ie = require("imports_exports");

if (ie.foo !== "foo") {
  throw new Error("bad foo export");
}

if (ie.dep.polyfill !== "require") {
  throw new Error("bad polyfill import");
}
