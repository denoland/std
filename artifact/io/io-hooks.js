export const isolatedApi = () => globalThis['@@io-worker-hooks']

export const inBand = (...args) => isolatedApi().inBand(...args)
export const spawns = (...args) => isolatedApi().spawns(...args)
export const writeJS = (...args) => isolatedApi().writeJS(...args)
export const write = (...args) => isolatedApi().write(...args)
export const readJS = (...args) => isolatedApi().readJS(...args)
export const read = (...args) => isolatedApi().read(...args)
export const isFile = (...args) => isolatedApi().isFile(...args)
export const ls = (...args) => isolatedApi().ls(...args)
export const rm = (...args) => isolatedApi().rm(...args)
