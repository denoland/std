(async () => {
  const imported = await import("./dynamically_imported_esm.js");
  imported.default();
})();
