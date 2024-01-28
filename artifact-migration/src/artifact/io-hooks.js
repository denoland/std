export const isolate = () => globalThis['@@io-worker-hooks']

export const actions = (...args) => isolate().actions(...args)
export const spawns = (...args) => isolate().spawns(...args)
export const writeJS = (...args) => isolate().writeJS(...args)
export const write = (...args) => isolate().write(...args)
export const readJS = (...args) => isolate().readJS(...args)
export const read = (...args) => isolate().read(...args)
export const isFile = (...args) => isolate().isFile(...args)
export const ls = (...args) => isolate().ls(...args)
export const rm = (...args) => isolate().rm(...args)
